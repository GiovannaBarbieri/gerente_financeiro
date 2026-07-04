import fs from "node:fs/promises";
import path from "node:path";
import { Prisma } from "@prisma/client";
import { prisma } from "../shared/database/prisma.js";
import { classifyNormalized } from "./ClassificationEngine.js";
import { assertRequiredColumns, mapRowsToStandardColumns } from "./ColumnMappingService.js";
import { parseUploadedFileDetailed } from "./FileParserService.js";
import { createRawHash } from "./HashService.js";
import { inferAccountName, inferInstitution } from "./InstitutionInferenceService.js";
import { normalizeParsedTransaction, SourceType, toPrismaFinancialTransaction } from "./NormalizationEngine.js";
import { identifyParser, ParserContext } from "./Parsers.js";

type Uploaded = { path: string; originalname: string; mimetype?: string };

type BatchFilePreview = {
  importFileId: string;
  fileName: string;
  fileType: string;
  sourceType: SourceType;
  institution: string;
  accountName: string;
  parser: string;
  totalRows: number;
  validRows: number;
  duplicateRows: number;
  errorRows: number;
  status: string;
  errorMessage?: string;
  columns: string[];
  mappedColumns: Record<string, string | null>;
  rows: Record<string, unknown>[];
};

function detectSourceType(file: Uploaded, columns: string[]): SourceType {
  const name = file.originalname.toLowerCase();
  const hasTitleAmount = columns.includes("title") && columns.includes("amount");
  const hasIdentifier = columns.includes("identificador");
  if (name.includes("card") || name.includes("cartao") || name.includes("cartão") || hasTitleAmount) return "Cartao";
  if (name.includes("conta") || name.includes("extrato") || hasIdentifier) return "Conta";
  return hasTitleAmount ? "Cartao" : "Conta";
}

function sourceKind(sourceType: SourceType) {
  return sourceType === "Conta" ? "account" : "card";
}

function isValidNormalized(item: ReturnType<typeof normalizeParsedTransaction>) {
  return Boolean(
    item.transactionDate &&
      item.competence &&
      item.sourceType &&
      item.institution &&
      item.accountName &&
      item.transactionType &&
      item.financialNature &&
      item.originalDescription &&
      item.normalizedDescription &&
      item.amount &&
      item.hash
  );
}

async function ensureBatchDir(batchId: string) {
  const dir = path.resolve("uploads", "batches", batchId);
  await fs.mkdir(dir, { recursive: true });
  return dir;
}

async function moveToBatchDir(file: Uploaded, batchId: string) {
  const dir = await ensureBatchDir(batchId);
  const safeName = `${Date.now()}-${file.originalname.replace(/[^\w.\-]+/g, "_")}`;
  const target = path.join(dir, safeName);
  await fs.rename(file.path, target);
  return target;
}

async function analyzeFile(file: Uploaded, tempPath: string, importBatchId: string, importFileId?: string): Promise<BatchFilePreview> {
  const parsedFile = await parseUploadedFileDetailed(tempPath, file.originalname);
  const columns = Array.from(new Set(parsedFile.normalizedRows.flatMap((row) => Object.keys(row))));
  const sourceType = detectSourceType(file, columns);
  const institution = inferInstitution({ sourceType, fileName: file.originalname });
  const provisionalAccountName = inferAccountName({ sourceType, fileName: file.originalname, institution });
  const mapped = mapRowsToStandardColumns(parsedFile.normalizedRows, sourceKind(sourceType), {
    accountName: provisionalAccountName,
    cardName: provisionalAccountName
  });

  let parserName = sourceType === "Cartao" ? "GenericCreditCardParser" : "GenericAccountParser";
  let accountName = provisionalAccountName;
  let validRows = 0;
  let duplicateRows = 0;
  let errorRows = 0;
  let status = "Preview";
  let errorMessage: string | undefined;

  try {
    assertRequiredColumns(mapped);
    const context: ParserContext = { sourceType, institution, accountName };
    const parser = identifyParser(mapped.rows, context);
    parserName = parser.name;
    accountName = inferAccountName({ sourceType, fileName: file.originalname, institution, parserName });
    const finalMapped = mapRowsToStandardColumns(parsedFile.normalizedRows, sourceKind(sourceType), { accountName, cardName: accountName });
    const parsed = parser.parse(finalMapped.rows, { sourceType, institution, accountName });

    for (const parsedItem of parsed) {
      try {
        const normalized = await classifyNormalized(normalizeParsedTransaction(parsedItem, importBatchId));
        if (!isValidNormalized(normalized)) {
          errorRows += 1;
          continue;
        }
        const duplicate = await prisma.financialTransaction.findFirst({
          where: { OR: [{ strictHash: normalized.strictHash }, { hash: normalized.hash }] },
          select: { id: true }
        });
        if (duplicate) duplicateRows += 1;
        else validRows += 1;
      } catch {
        errorRows += 1;
      }
    }

    return {
      importFileId: importFileId ?? "",
      fileName: file.originalname,
      fileType: file.mimetype ?? "file",
      sourceType,
      institution,
      accountName,
      parser: parserName,
      totalRows: parsedFile.normalizedRows.length,
      validRows,
      duplicateRows,
      errorRows,
      status,
      columns: finalMapped.columns,
      mappedColumns: finalMapped.mappedColumns,
      rows: finalMapped.rows.slice(0, 8)
    };
  } catch (error) {
    status = "Error";
    errorMessage = error instanceof Error ? error.message : "Erro ao analisar arquivo";
    errorRows = parsedFile.normalizedRows.length;
    return {
      importFileId: importFileId ?? "",
      fileName: file.originalname,
      fileType: file.mimetype ?? "file",
      sourceType,
      institution,
      accountName,
      parser: parserName,
      totalRows: parsedFile.normalizedRows.length,
      validRows,
      duplicateRows,
      errorRows,
      status,
      errorMessage,
      columns: mapped.columns,
      mappedColumns: mapped.mappedColumns,
      rows: mapped.rows.slice(0, 8)
    };
  }
}

export async function previewBatchImport(files: Uploaded[]) {
  const batch = await prisma.importBatch.create({
    data: { status: "Preview", totalFiles: files.length }
  });

  const previews: BatchFilePreview[] = [];
  for (const file of files) {
    try {
      const tempPath = await moveToBatchDir(file, batch.id);
      const preview = await analyzeFile(file, tempPath, batch.id);
      const importFile = await prisma.importFile.create({
        data: {
          importBatchId: batch.id,
          fileName: file.originalname,
          fileType: file.mimetype ?? "file",
          tempPath,
          sourceType: preview.sourceType,
          institution: preview.institution,
          parserName: preview.parser,
          totalRows: preview.totalRows,
          validRows: preview.validRows,
          duplicateRows: preview.duplicateRows,
          errorRows: preview.errorRows,
          status: preview.status,
          errorMessage: preview.errorMessage
        }
      });
      previews.push({ ...preview, importFileId: importFile.id });
    } catch (error) {
      previews.push({
        importFileId: "",
        fileName: file.originalname,
        fileType: file.mimetype ?? "file",
        sourceType: "Conta",
        institution: "Banco",
        accountName: "Conta Corrente",
        parser: "Nao identificado",
        totalRows: 0,
        validRows: 0,
        duplicateRows: 0,
        errorRows: 0,
        status: "Error",
        errorMessage: error instanceof Error ? error.message : "Erro ao preparar arquivo",
        columns: [],
        mappedColumns: {},
        rows: []
      });
      await fs.unlink(file.path).catch(() => undefined);
    }
  }

  const totalRows = previews.reduce((total, file) => total + file.totalRows, 0);
  await prisma.importBatch.update({ where: { id: batch.id }, data: { totalRows } });

  return {
    importBatchId: batch.id,
    files: previews,
    summary: summarizePreview(previews)
  };
}

function summarizePreview(files: BatchFilePreview[]) {
  return {
    totalFiles: files.length,
    validFiles: files.filter((file) => file.status !== "Error").length,
    errorFiles: files.filter((file) => file.status === "Error").length,
    totalRows: files.reduce((total, file) => total + file.totalRows, 0),
    validRows: files.reduce((total, file) => total + file.validRows, 0),
    duplicateRows: files.reduce((total, file) => total + file.duplicateRows, 0),
    errorRows: files.reduce((total, file) => total + file.errorRows, 0)
  };
}

export async function confirmBatchImport(importBatchId: string, selectedFileIds?: string[]) {
  const files = await prisma.importFile.findMany({
    where: {
      importBatchId,
      status: { not: "Error" },
      ...(selectedFileIds?.length ? { id: { in: selectedFileIds } } : {})
    }
  });

  const results = [];
  let importedRows = 0;
  let duplicateRows = 0;
  let errorRows = 0;
  let totalEntradas = 0;
  let totalSaidas = 0;
  let totalComprasCartao = 0;
  let pendingReview = 0;

  for (const file of files) {
    if (!file.tempPath) continue;
    const legacyImport = await prisma.import.create({
      data: {
        fileName: file.fileName,
        fileType: file.fileType,
        sourceType: file.sourceType,
        totalRows: file.totalRows
      }
    });

    let fileImported = 0;
    let fileDuplicates = 0;
    let fileErrors = 0;
    try {
      const parsedFile = await parseUploadedFileDetailed(file.tempPath, file.fileName);
      const sourceType = file.sourceType as SourceType;
      const accountName = inferAccountName({ sourceType, fileName: file.fileName, institution: file.institution, parserName: file.parserName });
      const mapped = mapRowsToStandardColumns(parsedFile.normalizedRows, sourceKind(sourceType), { accountName, cardName: accountName });
      assertRequiredColumns(mapped);
      const parser = identifyParser(mapped.rows, { sourceType, institution: file.institution, accountName });
      const parsed = parser.parse(mapped.rows, { sourceType, institution: file.institution, accountName });
      const importBatch = `${sourceType}-${legacyImport.id}-${Date.now()}`;

      for (const [index, parsedItem] of parsed.entries()) {
        try {
          const rawJson = parsedFile.rawRows[index] ?? {};
          const rawRecord = await prisma.rawImportRecord.create({
            data: {
              importBatchId: legacyImport.id,
              importFileId: file.id,
              importBatchGroupId: importBatchId,
              sourceType,
              institution: file.institution,
              originalRowNumber: index + 1,
              rawJson: rawJson as Prisma.InputJsonObject,
              rawHash: createRawHash({
                importBatchId: legacyImport.id,
                sourceType,
                institution: file.institution,
                originalRowNumber: index + 1,
                rawJson
              })
            }
          });
          const normalized = normalizeParsedTransaction(parsedItem, importBatch);
          normalized.rawRecordId = rawRecord.id;
          normalized.importBatchId = legacyImport.id;
          normalized.importFileId = file.id;
          normalized.importBatchGroupId = importBatchId;
          const classified = await classifyNormalized(normalized);

          const duplicate = await prisma.financialTransaction.findFirst({
            where: { OR: [{ strictHash: classified.strictHash }, { hash: classified.hash }] },
            select: { id: true }
          });
          if (duplicate) {
            fileDuplicates += 1;
            duplicateRows += 1;
            continue;
          }

          await prisma.financialTransaction.create({ data: toPrismaFinancialTransaction(classified) });
          await prisma.rawImportRecord.update({ where: { id: rawRecord.id }, data: { processed: true } });
          fileImported += 1;
          importedRows += 1;
          if (classified.transactionType === "Entrada") totalEntradas += Number(classified.amount);
          if (classified.sourceType === "Conta" && classified.transactionType === "Saida") totalSaidas += Number(classified.amount);
          if (classified.sourceType === "Cartao" && classified.realConsumptionImpact) totalComprasCartao += Number(classified.amount);
          if (classified.reviewStatus === "Pending" || classified.category === "Outros" || classified.origin === "Outro") pendingReview += 1;
        } catch {
          fileErrors += 1;
          errorRows += 1;
        }
      }

      await prisma.importFile.update({
        where: { id: file.id },
        data: {
          legacyImportId: legacyImport.id,
          validRows: fileImported,
          duplicateRows: fileDuplicates,
          errorRows: fileErrors,
          status: fileErrors ? "ImportedWithErrors" : "Imported",
          importedAt: new Date()
        }
      });
      await fs.unlink(file.tempPath).catch(() => undefined);
    } catch (error) {
      await prisma.importFile.update({
        where: { id: file.id },
        data: { status: "Error", errorMessage: error instanceof Error ? error.message : "Erro ao importar arquivo" }
      });
    }

    results.push({ importFileId: file.id, fileName: file.fileName, importedRows: fileImported, duplicateRows: fileDuplicates, errorRows: fileErrors });
  }

  await prisma.importBatch.update({ where: { id: importBatchId }, data: { status: "Imported", importedAt: new Date() } });

  return {
    importBatchId,
    files: results,
    summary: {
      totalFilesProcessed: results.length,
      totalImportedRecords: importedRows,
      totalDuplicates: duplicateRows,
      totalErrors: errorRows,
      totalEntradas,
      totalSaidas,
      totalComprasCartao,
      pendingReview
    }
  };
}
