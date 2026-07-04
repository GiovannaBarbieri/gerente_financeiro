import fs from "node:fs/promises";
import { Prisma } from "@prisma/client";
import { prisma } from "../shared/database/prisma.js";
import { classifyNormalized } from "./ClassificationEngine.js";
import { parseUploadedFileDetailed } from "./FileParserService.js";
import { assertRequiredColumns, mapRowsToStandardColumns } from "./ColumnMappingService.js";
import { identifyParser, ParserContext } from "./Parsers.js";
import { normalizeParsedTransaction, SourceType, toPrismaFinancialTransaction } from "./NormalizationEngine.js";
import { inferAccountName, inferInstitution } from "./InstitutionInferenceService.js";
import { createRawHash } from "./HashService.js";

type Uploaded = { path: string; originalname: string; mimetype?: string };

type ImportOptions = {
  sourceType: SourceType;
  institution?: string;
  accountName?: string;
  invoiceCompetence?: string;
};

function sourceKind(sourceType: SourceType) {
  return sourceType === "Conta" ? "account" : "card";
}

function validateSource(item: ReturnType<typeof normalizeParsedTransaction>) {
  const required = [
    item.transactionDate,
    item.competence,
    item.sourceType,
    item.institution,
    item.accountName,
    item.transactionType,
    item.financialNature,
    item.originalDescription,
    item.normalizedDescription,
    item.personCompany,
    item.amount,
    item.category,
    item.subcategory,
    item.origin,
    item.paymentMethod,
    item.importBatch,
    item.hash
  ];
  return required.every((value) => value !== undefined && value !== null && value !== "");
}

export async function importFinancialFile(file: Uploaded, options: ImportOptions) {
  const parsedFile = await parseUploadedFileDetailed(file.path, file.originalname);
  const rows = parsedFile.normalizedRows;
  const institution = inferInstitution({ sourceType: options.sourceType, fileName: file.originalname, institution: options.institution, accountName: options.accountName });
  const accountName = inferAccountName({ sourceType: options.sourceType, fileName: file.originalname, institution, accountName: options.accountName });
  const mapped = mapRowsToStandardColumns(rows, sourceKind(options.sourceType), { accountName, cardName: accountName });
  assertRequiredColumns(mapped);
  const sourceType = options.sourceType;
  const importRecord = await prisma.import.create({
    data: {
      fileName: file.originalname,
      fileType: file.mimetype ?? "file",
      sourceType,
      totalRows: rows.length
    }
  });
  const importBatch = `${sourceType}-${importRecord.id}-${Date.now()}`;

  const context: ParserContext = {
    sourceType,
    institution,
    accountName,
    invoiceCompetence: options.invoiceCompetence
  };
  const parser = identifyParser(mapped.rows, context);
  const parsed = parser.parse(mapped.rows, context);
  const rawRecords = await Promise.all(
    parsedFile.rawRows.map((rawJson, index) =>
      prisma.rawImportRecord.create({
        data: {
          importBatchId: importRecord.id,
          sourceType,
          institution,
          originalRowNumber: index + 1,
          rawJson: rawJson as Prisma.InputJsonObject,
          rawHash: createRawHash({
            importBatchId: importRecord.id,
            sourceType,
            institution,
            originalRowNumber: index + 1,
            rawJson
          })
        }
      })
    )
  );

  let created = 0;
  let skipped = 0;
  const preview = [];

  for (const [index, parsedItem] of parsed.entries()) {
    try {
      const normalized = normalizeParsedTransaction(parsedItem, importBatch);
      normalized.rawRecordId = rawRecords[index]?.id;
      normalized.importBatchId = importRecord.id;
      const classified = await classifyNormalized(normalized);
      if (!validateSource(classified)) {
        skipped += 1;
        continue;
      }

      await prisma.financialTransaction.create({
        data: toPrismaFinancialTransaction(classified)
      });
      if (rawRecords[index]) {
        await prisma.rawImportRecord.update({ where: { id: rawRecords[index].id }, data: { processed: true } });
      }
      created += 1;
      preview.push({
        date: classified.transactionDate,
        competence: classified.competence,
        description: classified.originalDescription,
        normalizedDescription: classified.normalizedDescription,
        amount: classified.amount,
        financialNature: classified.financialNature,
        category: classified.category,
        origin: classified.origin,
        parser: parser.name,
        status: "importado"
      });
    } catch {
      skipped += 1;
    }
  }

  await fs.unlink(file.path).catch(() => undefined);
  return {
    importId: importRecord.id,
    importBatch,
    parser: parser.name,
    columns: mapped.columns,
    mappedColumns: mapped.mappedColumns,
    requiredFound: mapped.requiredFound,
    optionalFound: mapped.optionalFound,
    totalRows: rows.length,
    created,
    skipped,
    preview: preview.slice(0, 30)
  };
}

export async function previewFinancialFile(file: Uploaded, options: ImportOptions) {
  const parsedFile = await parseUploadedFileDetailed(file.path, file.originalname);
  const rows = parsedFile.normalizedRows;
  const institution = inferInstitution({ sourceType: options.sourceType, fileName: file.originalname, institution: options.institution, accountName: options.accountName });
  const provisionalAccountName = inferAccountName({ sourceType: options.sourceType, fileName: file.originalname, institution, accountName: options.accountName });
  const mapped = mapRowsToStandardColumns(rows, sourceKind(options.sourceType), { accountName: provisionalAccountName, cardName: provisionalAccountName });
  const context: ParserContext = {
    sourceType: options.sourceType,
    institution,
    accountName: provisionalAccountName,
    invoiceCompetence: options.invoiceCompetence
  };
  const parser = identifyParser(mapped.rows, context);
  const accountName = inferAccountName({ sourceType: options.sourceType, fileName: file.originalname, institution, accountName: options.accountName, parserName: parser.name });
  const finalMapped =
    accountName === provisionalAccountName
      ? mapped
      : mapRowsToStandardColumns(rows, sourceKind(options.sourceType), { accountName, cardName: accountName });

  await fs.unlink(file.path).catch(() => undefined);
  return {
    parser: parser.name,
    institution,
    accountName,
    sourceType: options.sourceType,
    columns: finalMapped.columns,
    mappedColumns: finalMapped.mappedColumns,
    requiredFound: finalMapped.requiredFound,
    missingRequired: finalMapped.missingRequired,
    optionalFound: finalMapped.optionalFound,
    totalRows: rows.length,
    rows: finalMapped.rows.slice(0, 20)
  };
}

export async function importAccountFile(file: Uploaded, institution?: string, accountName?: string) {
  return importFinancialFile(file, {
    sourceType: "Conta",
    institution,
    accountName
  });
}

export async function importCardFile(file: Uploaded, invoiceCompetence?: string, institution?: string, accountName?: string) {
  return importFinancialFile(file, {
    sourceType: "Cartao",
    institution,
    accountName,
    invoiceCompetence
  });
}

export async function previewAccountFile(file: Uploaded, institution?: string, accountName?: string) {
  return previewFinancialFile(file, {
    sourceType: "Conta",
    institution,
    accountName
  });
}

export async function previewCardFile(file: Uploaded, invoiceCompetence?: string, institution?: string, accountName?: string) {
  return previewFinancialFile(file, {
    sourceType: "Cartao",
    institution,
    accountName,
    invoiceCompetence
  });
}
