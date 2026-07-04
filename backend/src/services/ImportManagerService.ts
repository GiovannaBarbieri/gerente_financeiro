import { prisma } from "../shared/database/prisma.js";
import { confirmBatchImport, previewBatchImport } from "./BatchImportService.js";

type Uploaded = { path: string; originalname: string; mimetype?: string };

function fileKind(sourceType: string) {
  if (sourceType === "Cartao") return "Cartao de Credito";
  if (sourceType === "Conta") return "Conta Corrente";
  return "Origem desconhecida";
}

function duplicateSummary(file: { duplicateRows: number }) {
  if (file.duplicateRows > 0) return "Duplicado possivel";
  return "Novo registro";
}

export async function previewSmartImport(files: Uploaded[]) {
  const startedAt = Date.now();
  const preview = await previewBatchImport(files);
  const enhancedFiles = preview.files.map((file) => ({
    ...file,
    detectedKind: fileKind(file.sourceType),
    accountOrCard: file.accountName || (file.sourceType === "Cartao" ? "Cartao de Credito" : "Conta Corrente"),
    duplicateStatus: duplicateSummary(file),
    issues: [
      ...(file.status === "Error" ? [file.errorMessage || "Arquivo com erro"] : []),
      ...(file.errorRows ? [`${file.errorRows} registro(s) com erro`] : []),
      ...(file.duplicateRows ? [`${file.duplicateRows} duplicado(s) possivel(is)`] : []),
      ...(file.institution === "Banco" ? ["Instituicao nao reconhecida"] : [])
    ].filter(Boolean)
  }));

  return {
    ...preview,
    files: enhancedFiles,
    smartSummary: {
      ...preview.summary,
      importedFiles: preview.summary.totalFiles,
      totalRecords: preview.summary.totalRows,
      validRecords: preview.summary.validRows,
      duplicates: preview.summary.duplicateRows,
      errors: preview.summary.errorRows,
      revenues: 0,
      expenses: 0,
      transfers: 0,
      totalAmount: 0,
      processingTimeMs: Date.now() - startedAt
    }
  };
}

export async function confirmSmartImport(importBatchId: string, selectedFileIds?: string[]) {
  const startedAt = Date.now();
  const result = await confirmBatchImport(importBatchId, selectedFileIds);
  return {
    ...result,
    finalReport: {
      files: result.summary.totalFilesProcessed,
      created: result.summary.totalImportedRecords,
      duplicates: result.summary.totalDuplicates,
      ignored: result.summary.totalDuplicates,
      errors: result.summary.totalErrors,
      totalAmount: result.summary.totalEntradas + result.summary.totalSaidas + result.summary.totalComprasCartao,
      revenues: result.summary.totalEntradas,
      expenses: result.summary.totalSaidas + result.summary.totalComprasCartao,
      processingTimeMs: Date.now() - startedAt
    }
  };
}

export async function listImportHistory() {
  const batches = await prisma.importBatch.findMany({
    include: { files: true },
    orderBy: { createdAt: "desc" },
    take: 30
  });

  return batches.map((batch) => ({
    id: batch.id,
    date: batch.createdAt,
    importedAt: batch.importedAt,
    files: batch.files.length,
    fileNames: batch.files.map((file) => file.fileName),
    institutions: Array.from(new Set(batch.files.map((file) => file.institution))).join(", ") || "Nao identificado",
    quantity: batch.totalRows,
    imported: batch.files.reduce((total, file) => total + file.validRows, 0),
    duplicates: batch.files.reduce((total, file) => total + file.duplicateRows, 0),
    errors: batch.files.reduce((total, file) => total + file.errorRows, 0),
    user: "Usuario local",
    status: batch.status,
    details: batch.files.map((file) => ({
      id: file.id,
      fileName: file.fileName,
      institution: file.institution,
      sourceType: file.sourceType,
      parserName: file.parserName,
      totalRows: file.totalRows,
      validRows: file.validRows,
      duplicateRows: file.duplicateRows,
      errorRows: file.errorRows,
      status: file.status,
      errorMessage: file.errorMessage
    }))
  }));
}
