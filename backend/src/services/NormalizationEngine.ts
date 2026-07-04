import { Prisma } from "@prisma/client";
import { normalizeText, parseAmount, parseDate, titleName, toCompetence } from "../shared/utils/format.js";
import { createSoftHash, createStrictHash } from "./HashService.js";

export type SourceType = "Conta" | "Cartao";
export type TransactionType = "Entrada" | "Saida" | "Compra" | "Estorno";
export type FinancialNature = "Receita" | "Despesa" | "Transferencia" | "Investimento" | "Cartao" | "Ajuste";
export type Origin = "Pessoal" | "Fazenda" | "Empresa" | "Transferencia" | "Investimento" | "Outro" | "Cartao";

export type ParsedTransaction = {
  transactionDate: Date;
  sourceType: SourceType;
  institution: string;
  accountName: string;
  transactionType: TransactionType;
  originalDescription: string;
  amount: number;
  paymentMethod: string;
  cardName?: string;
  installment?: number;
  totalInstallments?: number;
  notes?: string;
};

export type NormalizedTransaction = ParsedTransaction & {
  externalId?: string;
  rawRecordId?: string;
  importFileId?: string;
  importBatchGroupId?: string;
  invoiceId?: string;
  competence: string;
  invoiceCompetence?: string;
  paymentDate?: Date;
  paymentCompetence?: string;
  financialNature: FinancialNature;
  normalizedDescription: string;
  personCompany: string;
  category: string;
  subcategory: string;
  origin: Origin;
  transferInternal: boolean;
  reconciled: boolean;
  importBatch: string;
  importBatchId?: number;
  hash: string;
  strictHash: string;
  softHash: string;
  cashFlowImpact: boolean;
  realConsumptionImpact: boolean;
  classificationConfidence: number;
  classificationSource: "SYSTEM" | "USER" | "RULE" | "AI";
  reviewStatus: "Pending" | "Reviewed" | "Approved" | "Ignored";
};

const descriptionAliases = [
  { patterns: ["UBER ONE"], normalized: "UBER ONE" },
  { patterns: ["DL*UBERRIDES", "DL *UBERRIDES", "DL *UBER*RIDES", "UBER *TRIP", "UBER TRIP HELP.U", "UBERRIDES"], normalized: "UBER" },
  { patterns: ["POSTO PILOTO BELA VISTA"], normalized: "POSTO PILOTO" },
  { patterns: ["UNIMED LONDRINA COOP"], normalized: "UNIMED" }
];

export function normalizeDescription(description: string) {
  const cleaned = normalizeText(description)
    .replace(/[\u200B-\u200D\uFEFF]/g, "")
    .replace(/[^\w\s*./-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  const alias = descriptionAliases.find((item) => item.patterns.some((pattern) => cleaned.includes(normalizeText(pattern))));
  return alias?.normalized ?? cleaned;
}

export function inferPaymentMethod(description: string, sourceType: SourceType) {
  const text = normalizeText(description);
  if (sourceType === "Cartao") return "Credito";
  if (text.includes("PIX")) return "Pix";
  if (text.includes("TED")) return "TED";
  if (text.includes("DOC")) return "DOC";
  if (text.includes("BOLETO")) return "Boleto";
  if (text.includes("FATURA")) return "Cartao";
  if (text.includes("DEBITO")) return "Debito";
  return "Outro";
}

export function inferTransactionType(description: string, amount: number, sourceType: SourceType): TransactionType {
  const text = normalizeText(description);
  if (sourceType === "Cartao") return text.includes("ESTORNO") || amount < 0 ? "Estorno" : "Compra";
  if (text.includes("ESTORNO") || text.includes("CASHBACK")) return "Estorno";
  return amount >= 0 ? "Entrada" : "Saida";
}

export function inferFinancialNature(description: string, transactionType: TransactionType, sourceType: SourceType): FinancialNature {
  const text = normalizeText(description);
  if (text.includes("PAGAMENTO DE FATURA") || text.includes("PAGTO FATURA")) return "Transferencia";
  if (text.includes("RDB") || text.includes("APLICACAO") || text.includes("RESGATE") || text.includes("INVEST")) return "Investimento";
  if (text.includes("TRANSFERENCIA") || text.includes("TED") || text.includes("DOC")) return "Transferencia";
  if (sourceType === "Cartao" && transactionType === "Estorno") return "Ajuste";
  if (transactionType === "Entrada" || transactionType === "Estorno") return "Receita";
  return "Despesa";
}

export function inferDefaultCategory(nature: FinancialNature, sourceType: SourceType) {
  if (nature === "Receita") return { category: "Receita Pessoal", subcategory: "Geral" };
  if (nature === "Transferencia") return { category: sourceType === "Cartao" ? "Cartao de Credito" : "Transferencia Propria", subcategory: "Geral" };
  if (nature === "Investimento") return { category: "Investimentos", subcategory: "Geral" };
  if (nature === "Ajuste") return { category: "Ajustes", subcategory: "Geral" };
  return { category: "Outros", subcategory: "Geral" };
}

export function normalizeParsedTransaction(parsed: ParsedTransaction, importBatch: string): NormalizedTransaction {
  const normalizedDescription = normalizeDescription(parsed.originalDescription);
  const financialNature = inferFinancialNature(parsed.originalDescription, parsed.transactionType, parsed.sourceType);
  const defaults = inferDefaultCategory(financialNature, parsed.sourceType);
  const amount = Math.abs(parseAmount(parsed.amount));
  const transactionDate = parseDate(parsed.transactionDate);
  const transferInternal = financialNature === "Transferencia" || financialNature === "Investimento";
  const strictHash = createStrictHash({
    transactionDate,
    amount,
    originalDescription: parsed.originalDescription,
    institution: parsed.institution,
    accountName: parsed.accountName
  });
  const personCompany = titleName(normalizedDescription) || normalizedDescription;
  const softHash = createSoftHash({ transactionDate, amount, normalizedDescription, personCompany });
  const isCardPurchase = parsed.sourceType === "Cartao" && financialNature === "Despesa";
  const isCardPayment = financialNature === "Transferencia" && normalizeText(defaults.category).includes("CARTAO");

  return {
    ...parsed,
    transactionDate,
    competence: toCompetence(transactionDate),
    amount,
    financialNature,
    normalizedDescription,
    personCompany,
    category: defaults.category,
    subcategory: defaults.subcategory,
    origin: financialNature === "Investimento" ? "Investimento" : financialNature === "Transferencia" ? "Transferencia" : "Outro",
    paymentMethod: parsed.paymentMethod || inferPaymentMethod(parsed.originalDescription, parsed.sourceType),
    transferInternal,
    reconciled: false,
    importBatch,
    hash: strictHash,
    strictHash,
    softHash,
    cashFlowImpact: parsed.sourceType === "Conta",
    realConsumptionImpact: financialNature === "Despesa" && !transferInternal && !isCardPayment,
    classificationConfidence: isCardPurchase ? 60 : 50,
    classificationSource: "SYSTEM",
    reviewStatus: "Pending"
  };
}

export function toPrismaFinancialTransaction(item: NormalizedTransaction) {
  return {
    transactionDate: item.transactionDate,
    competence: item.competence,
    sourceType: item.sourceType,
    institution: item.institution,
    accountName: item.accountName,
    transactionType: item.transactionType,
    financialNature: item.financialNature,
    originalDescription: item.originalDescription,
    normalizedDescription: item.normalizedDescription,
    personCompany: item.personCompany,
    amount: new Prisma.Decimal(item.amount),
    category: item.category,
    subcategory: item.subcategory,
    origin: item.origin,
    paymentMethod: item.paymentMethod,
    cardName: item.cardName,
    installment: item.installment,
    totalInstallments: item.totalInstallments,
    reconciled: item.reconciled,
    transferInternal: item.transferInternal,
    cashFlowImpact: item.cashFlowImpact,
    realConsumptionImpact: item.realConsumptionImpact,
    classificationConfidence: item.classificationConfidence,
    classificationSource: item.classificationSource,
    reviewStatus: item.reviewStatus,
    importBatch: item.importBatch,
    importBatchId: item.importBatchId,
    externalId: item.externalId,
    rawRecordId: item.rawRecordId,
    importFileId: item.importFileId,
    importBatchGroupId: item.importBatchGroupId,
    invoiceId: item.invoiceId,
    invoiceCompetence: item.invoiceCompetence,
    paymentDate: item.paymentDate,
    paymentCompetence: item.paymentCompetence,
    notes: item.notes,
    hash: item.hash,
    strictHash: item.strictHash,
    softHash: item.softHash
  };
}
