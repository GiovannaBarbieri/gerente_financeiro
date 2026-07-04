import { GenericRow, normalizeHeader, pick } from "./FileParserService.js";
import { formatDateBR, parseDate, toCompetence } from "../shared/utils/format.js";

export type ImportSourceKind = "account" | "card";

export type MappedPreview = {
  columns: string[];
  mappedColumns: Record<string, string | null>;
  requiredFound: string[];
  missingRequired: string[];
  optionalFound: string[];
  rows: GenericRow[];
};

export type MappingDefaults = {
  cardName?: string;
  accountName?: string;
};

const accountAliases: Record<string, string[]> = {
  data_movimentacao: ["data_movimentacao", "data", "date", "data da movimentacao", "data movimento"],
  descricao: ["descricao", "descrição", "description", "title", "titulo", "lancamento", "historico", "histórico"],
  valor: ["valor", "amount", "value", "valor original"],
  tipo_movimentacao: ["tipo_movimentacao", "tipo", "type", "categoria", "tipo de transacao"],
  origem_dados: ["origem_dados", "origem", "source", "origem/destino", "nome", "destinatario", "remetente"]
};

const cardAliases: Record<string, string[]> = {
  data_compra: ["data_compra", "data da compra", "data", "date", "transaction date"],
  descricao: ["descricao", "descrição", "description", "title", "titulo", "estabelecimento", "merchant", "name"],
  valor: ["valor", "amount", "value", "valor original"],
  cartao: ["cartao", "cartão", "card", "nome do cartao"],
  competencia: ["competencia", "fatura", "invoice", "invoice month", "mes", "mês"]
};

const requiredByKind: Record<ImportSourceKind, string[]> = {
  account: ["data_movimentacao", "descricao", "valor"],
  card: ["data_compra", "descricao", "valor"]
};

const aliasesByKind = {
  account: accountAliases,
  card: cardAliases
};

function findColumn(columns: string[], candidates: string[]) {
  const normalizedCandidates = candidates.map(normalizeHeader);
  return columns.find((column) => normalizedCandidates.includes(normalizeHeader(column))) ?? null;
}

function calculateCompetence(value: unknown) {
  try {
    return toCompetence(parseDate(value));
  } catch {
    return "";
  }
}

function formatMappedDate(value: unknown) {
  try {
    return formatDateBR(value);
  } catch {
    return typeof value === "string" ? value.trim() : value ?? "";
  }
}

function inferAccountMovementType(row: GenericRow) {
  const description = String(pick(row, accountAliases.descricao) ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase();

  if (description.includes("TRANSFERENCIA RECEBIDA")) return "Transferencia recebida";
  if (description.includes("TRANSFERENCIA ENVIADA")) return "Transferencia enviada";
  if (description.includes("PIX RECEBIDO")) return "Pix recebido";
  if (description.includes("PIX ENVIADO")) return "Pix enviado";
  if (description.includes("PIX")) return "Pix";
  if (description.includes("PAGAMENTO DE FATURA") || description.includes("PAGTO FATURA")) return "Pagamento de fatura";
  if (description.includes("BOLETO")) return "Pagamento de boleto";
  if (description.includes("APLICACAO") || description.includes("APLICAÇÃO")) return "Aplicacao";
  if (description.includes("RESGATE")) return "Resgate";
  if (description.includes("TED")) return "TED";
  if (description.includes("DOC")) return "DOC";
  if (description.includes("TARIFA")) return "Tarifa";
  if (description.includes("EMPRESTIMO") || description.includes("EMPRÉSTIMO")) return "Emprestimo";

  const value = Number(String(pick(row, accountAliases.valor) ?? "0").replace(/\./g, "").replace(",", "."));
  if (!Number.isNaN(value)) return value >= 0 ? "Credito" : "Debito";
  return "Nao identificado";
}

export function mapRowsToStandardColumns(rows: GenericRow[], kind: ImportSourceKind, defaults: MappingDefaults = {}): MappedPreview {
  const columns = Array.from(new Set(rows.flatMap((row) => Object.keys(row).map(normalizeHeader))));
  const aliases = aliasesByKind[kind];
  const mappedColumns = Object.fromEntries(Object.entries(aliases).map(([standard, candidates]) => [standard, findColumn(columns, candidates)]));
  if (kind === "card" && !mappedColumns.competencia && mappedColumns.data_compra) {
    mappedColumns.competencia = "calculada pela data_compra";
  }
  if (kind === "account" && !mappedColumns.tipo_movimentacao && mappedColumns.descricao) {
    mappedColumns.tipo_movimentacao = "inferido pela descricao";
  }
  const required = requiredByKind[kind];
  const requiredFound = required.filter((field) => Boolean(mappedColumns[field]));
  const missingRequired = required.filter((field) => !mappedColumns[field]);
  const optionalFound = Object.keys(aliases).filter((field) => !required.includes(field) && Boolean(mappedColumns[field]));

  const mappedRows = rows.map((row) =>
    Object.fromEntries(
      Object.entries(aliases).map(([standard, candidates]) => {
        const value = pick(row, candidates);
        if (kind === "card" && standard === "competencia" && (value === undefined || value === null || value === "")) {
          return [standard, calculateCompetence(pick(row, aliases.data_compra))];
        }
        if (standard === "data_compra" || standard === "data_movimentacao") {
          return [standard, formatMappedDate(value)];
        }
        if (kind === "account" && standard === "tipo_movimentacao" && (value === undefined || value === null || value === "")) {
          return [standard, inferAccountMovementType(row)];
        }
        if (kind === "card" && standard === "cartao" && (value === undefined || value === null || value === "")) {
          return [standard, defaults.cardName ?? defaults.accountName ?? ""];
        }
        if (kind === "account" && standard === "origem_dados" && (value === undefined || value === null || value === "")) {
          return [standard, defaults.accountName ?? ""];
        }
        return [standard, typeof value === "string" ? value.trim() : value ?? ""];
      })
    )
  );

  return {
    columns,
    mappedColumns,
    requiredFound,
    missingRequired,
    optionalFound,
    rows: mappedRows
  };
}

export function assertRequiredColumns(preview: MappedPreview) {
  if (preview.missingRequired.length) {
    throw new Error(`Campos obrigatorios ausentes: ${preview.missingRequired.join(", ")}`);
  }
}
