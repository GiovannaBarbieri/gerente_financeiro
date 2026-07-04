import crypto from "node:crypto";
import dayjs from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat.js";

dayjs.extend(customParseFormat);

export function normalizeText(value: unknown) {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toUpperCase();
}

export function toMonth(date: Date) {
  return dayjs(date).format("YYYY-MM");
}

export function toCompetence(date: Date) {
  return dayjs(date).format("MM/YYYY");
}

export function formatDateBR(value: unknown) {
  return dayjs(parseDate(value)).format("DD/MM/YYYY");
}

export function fromMonthInput(value?: string) {
  if (!value) return undefined;
  if (/^\d{4}-\d{2}$/.test(value)) {
    const [year, month] = value.split("-");
    return `${month}/${year}`;
  }
  return value;
}

export function parseDate(value: unknown): Date {
  if (value instanceof Date) return value;
  if (typeof value === "number") {
    const excelEpoch = new Date(Date.UTC(1899, 11, 30));
    return new Date(excelEpoch.getTime() + value * 86400000);
  }

  const text = String(value ?? "").trim();
  const formats = ["DD/MM/YYYY", "D/M/YYYY", "YYYY-MM-DD", "MM/DD/YYYY"];
  for (const format of formats) {
    const parsed = dayjs(text, format, true);
    if (parsed.isValid()) return parsed.toDate();
  }

  const fallback = new Date(text);
  if (!Number.isNaN(fallback.getTime())) return fallback;
  throw new Error(`Data invalida: ${text}`);
}

export function parseAmount(value: unknown): number {
  if (typeof value === "number") return value;
  const raw = String(value ?? "")
    .replace(/[R$\s]/g, "")
    .trim();
  const text = raw.includes(",") ? raw.replace(/\./g, "").replace(",", ".") : raw.replace(/,/g, "");
  const parsed = Number(text);
  if (Number.isNaN(parsed)) throw new Error(`Valor invalido: ${value}`);
  return parsed;
}

export function money(value: unknown) {
  return Number(value ?? 0);
}

export function fingerprint(parts: Array<string | number | Date | null | undefined>) {
  return crypto
    .createHash("sha256")
    .update(parts.map((part) => (part instanceof Date ? part.toISOString() : String(part ?? ""))).join("|"))
    .digest("hex");
}

export function titleName(description: string) {
  return description
    .replace(/^(PIX|TRANSFERENCIA|PAGAMENTO|COMPRA|DEBITO|CREDITO)\s+/i, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 90);
}
