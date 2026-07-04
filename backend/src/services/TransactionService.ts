import crypto from "node:crypto";
import { Prisma } from "@prisma/client";
import { prisma } from "../shared/database/prisma.js";
import { fromMonthInput, normalizeText, parseAmount, parseDate, titleName, toCompetence } from "../shared/utils/format.js";
import { classifyNormalized } from "./ClassificationEngine.js";
import { signedAmount } from "./shared/FinancialMathService.js";
import {
  FinancialNature,
  inferPaymentMethod,
  normalizeDescription,
  NormalizedTransaction,
  SourceType,
  TransactionType
} from "./NormalizationEngine.js";

export type EntryFilters = {
  month?: string;
  source?: string;
  q?: string;
  category?: string;
  subcategory?: string;
  type?: string;
  nature?: string;
  status?: string;
  origin?: string;
  institution?: string;
  account?: string;
  card?: string;
};

export type EntryInput = {
  type?: string;
  date: string;
  competence?: string;
  description: string;
  amount: number | string;
  accountName?: string;
  cardName?: string;
  category?: string;
  subcategory?: string;
  paymentMethod?: string;
  status?: string;
  origin?: string;
  institution?: string;
  notes?: string;
};

function entryStatus(value?: string) {
  const normalized = normalizeText(value || "pending").toLowerCase();
  const map: Record<string, string> = {
    pending: "Pending",
    pendente: "Pending",
    paid: "Paid",
    pago: "Paid",
    cleared: "Cleared",
    compensado: "Cleared",
    reviewed: "Reviewed",
    revisado: "Reviewed",
    ignored: "Ignored",
    ignorado: "Ignored"
  };
  return map[normalized] ?? value ?? "Pending";
}

function statusSlug(value?: string) {
  const normalized = normalizeText(value || "Pending");
  if (normalized === "PAID") return "paid";
  if (normalized === "CLEARED") return "cleared";
  if (normalized === "REVIEWED") return "reviewed";
  if (normalized === "IGNORED") return "ignored";
  return "pending";
}

function statusLabel(value?: string) {
  const slug = statusSlug(value);
  const labels: Record<string, string> = {
    pending: "Pendente",
    paid: "Pago",
    cleared: "Compensado",
    reviewed: "Revisado",
    ignored: "Ignorado"
  };
  return labels[slug];
}

function kindToNature(type?: string): FinancialNature {
  const normalized = normalizeText(type);
  if (normalized.includes("RECEITA")) return "Receita";
  if (normalized.includes("TRANSFER")) return "Transferencia";
  if (normalized.includes("AJUSTE") || normalized.includes("ESTORNO")) return "Ajuste";
  return "Despesa";
}

function natureToTransactionType(nature: FinancialNature): TransactionType {
  if (nature === "Receita") return "Entrada";
  if (nature === "Ajuste") return "Estorno";
  return "Saida";
}

function manualHash() {
  return crypto.createHash("sha256").update(`manual|${crypto.randomUUID()}|${Date.now()}`).digest("hex");
}

function toEntry(item: Awaited<ReturnType<typeof prisma.financialTransaction.findMany>>[number]) {
  const status = statusSlug(item.reviewStatus);
  return {
    id: item.id,
    rawId: item.id,
    date: item.transactionDate,
    month: item.competence,
    competence: item.competence,
    type: item.transactionType,
    source: item.sourceType,
    institution: item.institution,
    accountName: item.accountName,
    cardName: item.cardName,
    description: item.originalDescription,
    normalizedDescription: item.normalizedDescription,
    personName: item.personCompany,
    category: item.category,
    subcategory: item.subcategory,
    financialNature: item.financialNature,
    origin: item.origin,
    paymentMethod: item.paymentMethod,
    amount: signedAmount(item),
    status,
    statusLabel: statusLabel(item.reviewStatus),
    isInternalTransfer: item.transferInternal,
    isCreditCardPayment: item.sourceType === "Conta" && item.financialNature === "Transferencia" && normalizeText(item.category).includes("CARTAO"),
    isReconciled: item.reconciled,
    notes: item.notes,
    hash: item.hash,
    importBatchId: item.importBatchId,
    importFileId: item.importFileId,
    rawRecordId: item.rawRecordId
  };
}

export async function listFinancialEntries(filters: EntryFilters = {}) {
  const competence = fromMonthInput(filters.month);
  const rows = await prisma.financialTransaction.findMany({
    where: {
      ...(competence ? { competence } : {}),
      ...(filters.source === "Conta" || filters.source === "Cartao" ? { sourceType: filters.source } : {}),
      ...(filters.q ? { originalDescription: { contains: filters.q } } : {}),
      ...(filters.category ? { category: filters.category } : {}),
      ...(filters.subcategory ? { subcategory: filters.subcategory } : {}),
      ...(filters.nature ? { financialNature: filters.nature } : {}),
      ...(filters.type ? { transactionType: filters.type } : {}),
      ...(filters.status ? { reviewStatus: entryStatus(filters.status) } : {}),
      ...(filters.origin ? { origin: filters.origin } : {}),
      ...(filters.institution ? { institution: filters.institution } : {}),
      ...(filters.account ? { accountName: filters.account } : {}),
      ...(filters.card ? { cardName: filters.card } : {})
    },
    orderBy: { transactionDate: "desc" }
  });
  return rows.map(toEntry);
}

export async function getFinancialEntry(id: string) {
  const item = await prisma.financialTransaction.findUniqueOrThrow({ where: { id } });
  return toEntry(item);
}

export async function createFinancialEntry(input: EntryInput) {
  const transactionDate = parseDate(input.date);
  const financialNature = kindToNature(input.type);
  const sourceType: SourceType = input.cardName ? "Cartao" : "Conta";
  const originalDescription = input.description.trim();
  const normalizedDescription = normalizeDescription(originalDescription);
  const transactionType = natureToTransactionType(financialNature);
  const hash = manualHash();
  const accountName = input.accountName?.trim() || input.cardName?.trim() || "Nao informado";
  const paymentMethod = input.paymentMethod?.trim() || inferPaymentMethod(originalDescription, sourceType);

  let normalized: NormalizedTransaction = {
    transactionDate,
    competence: input.competence || toCompetence(transactionDate),
    sourceType,
    institution: input.institution?.trim() || "Manual",
    accountName,
    cardName: input.cardName?.trim() || undefined,
    transactionType,
    financialNature,
    originalDescription,
    normalizedDescription,
    personCompany: titleName(normalizedDescription) || normalizedDescription,
    amount: Math.abs(parseAmount(input.amount)),
    category: input.category?.trim() || "Outros",
    subcategory: input.subcategory?.trim() || "Geral",
    origin: (input.origin?.trim() as NormalizedTransaction["origin"]) || "Outro",
    paymentMethod,
    transferInternal: financialNature === "Transferencia",
    reconciled: false,
    importBatch: `Manual-${Date.now()}`,
    hash,
    strictHash: hash,
    softHash: hash,
    cashFlowImpact: sourceType === "Conta",
    realConsumptionImpact: financialNature === "Despesa",
    classificationConfidence: input.category ? 100 : 50,
    classificationSource: input.category ? "USER" : "SYSTEM",
    reviewStatus: entryStatus(input.status) as NormalizedTransaction["reviewStatus"],
    notes: input.notes?.trim() || undefined
  };

  if (!input.category) normalized = await classifyNormalized(normalized);

  const created = await prisma.financialTransaction.create({
    data: {
      transactionDate: normalized.transactionDate,
      competence: normalized.competence,
      sourceType: normalized.sourceType,
      institution: normalized.institution,
      accountName: normalized.accountName,
      transactionType: normalized.transactionType,
      financialNature: normalized.financialNature,
      originalDescription: normalized.originalDescription,
      normalizedDescription: normalized.normalizedDescription,
      personCompany: normalized.personCompany,
      amount: new Prisma.Decimal(normalized.amount),
      category: normalized.category,
      subcategory: normalized.subcategory,
      origin: normalized.origin,
      paymentMethod: normalized.paymentMethod,
      cardName: normalized.cardName,
      reconciled: normalized.reconciled,
      transferInternal: normalized.transferInternal,
      cashFlowImpact: normalized.cashFlowImpact,
      realConsumptionImpact: normalized.realConsumptionImpact,
      classificationConfidence: normalized.classificationConfidence,
      classificationSource: normalized.classificationSource,
      reviewStatus: normalized.reviewStatus,
      importBatch: normalized.importBatch,
      notes: normalized.notes,
      hash: normalized.hash,
      strictHash: normalized.strictHash,
      softHash: normalized.softHash
    }
  });

  return toEntry(created);
}

export async function updateFinancialEntry(id: string, input: Partial<EntryInput>) {
  const current = await prisma.financialTransaction.findUniqueOrThrow({ where: { id } });
  const description = input.description?.trim() ?? current.originalDescription;
  const transactionDate = input.date ? parseDate(input.date) : current.transactionDate;
  const financialNature = input.type ? kindToNature(input.type) : (current.financialNature as FinancialNature);
  const transactionType = natureToTransactionType(financialNature);
  const sourceType: SourceType = input.cardName !== undefined ? (input.cardName ? "Cartao" : "Conta") : (current.sourceType as SourceType);
  const normalizedDescription = normalizeDescription(description);

  const updated = await prisma.financialTransaction.update({
    where: { id },
    data: {
      transactionDate,
      competence: input.competence || toCompetence(transactionDate),
      sourceType,
      institution: input.institution?.trim() || current.institution,
      accountName: input.accountName?.trim() || input.cardName?.trim() || current.accountName,
      cardName: input.cardName === undefined ? current.cardName : input.cardName?.trim() || null,
      transactionType,
      financialNature,
      originalDescription: description,
      normalizedDescription,
      personCompany: titleName(normalizedDescription) || normalizedDescription,
      amount: input.amount === undefined ? current.amount : new Prisma.Decimal(Math.abs(parseAmount(input.amount))),
      category: input.category?.trim() || current.category,
      subcategory: input.subcategory?.trim() || current.subcategory,
      origin: input.origin?.trim() || current.origin,
      paymentMethod: input.paymentMethod?.trim() || current.paymentMethod,
      reviewStatus: input.status ? entryStatus(input.status) : current.reviewStatus,
      notes: input.notes === undefined ? current.notes : input.notes?.trim() || null,
      transferInternal: financialNature === "Transferencia",
      cashFlowImpact: sourceType === "Conta",
      realConsumptionImpact: financialNature === "Despesa"
    }
  });

  return toEntry(updated);
}

export async function ignoreFinancialEntry(id: string) {
  const current = await prisma.financialTransaction.findUniqueOrThrow({ where: { id } });
  const updated = await prisma.financialTransaction.update({
    where: { id },
    data: {
      reviewStatus: "Ignored",
      cashFlowImpact: false,
      realConsumptionImpact: false,
      notes: [current.notes, "Lancamento ignorado manualmente."].filter(Boolean).join("\n")
    }
  });
  return toEntry(updated);
}
