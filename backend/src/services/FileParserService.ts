import fs from "node:fs";
import { parse } from "@fast-csv/parse";
import * as XLSX from "xlsx";

export type GenericRow = Record<string, unknown>;

export type ParsedFile = {
  rawRows: GenericRow[];
  normalizedRows: GenericRow[];
};

export function normalizeHeader(header: string) {
  return header
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[\u200B-\u200D\uFEFF]/g, "")
    .trim()
    .replace(/\s+/g, " ")
    .toLowerCase();
}

export function normalizeRow(row: GenericRow) {
  return Object.fromEntries(Object.entries(row).map(([key, value]) => [normalizeHeader(key), typeof value === "string" ? value.trim() : value]));
}

export async function parseUploadedFile(path: string, originalName: string): Promise<GenericRow[]> {
  return (await parseUploadedFileDetailed(path, originalName)).normalizedRows;
}

export async function parseUploadedFileDetailed(path: string, originalName: string): Promise<ParsedFile> {
  if (/\.(xlsx|xls)$/i.test(originalName)) {
    const workbook = XLSX.readFile(path);
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rawRows = XLSX.utils.sheet_to_json<GenericRow>(sheet, { raw: false });
    return { rawRows, normalizedRows: rawRows.map(normalizeRow) };
  }

  return new Promise((resolve, reject) => {
    const rawRows: GenericRow[] = [];
    fs.createReadStream(path)
      .pipe(
        parse({
          headers: true,
          delimiter: ",",
          quote: '"',
          escape: '"',
          ignoreEmpty: true,
          trim: false
        })
      )
      .on("error", reject)
      .on("data", (row) => rawRows.push(row))
      .on("end", () => resolve({ rawRows, normalizedRows: rawRows.map(normalizeRow) }));
  });
}

export function pick(row: GenericRow, candidates: string[]) {
  const entries = Object.entries(row);
  for (const candidate of candidates.map(normalizeHeader)) {
    const found = entries.find(([key]) => normalizeHeader(key) === candidate || normalizeHeader(key).includes(candidate));
    if (found) return found[1];
  }
  return undefined;
}
