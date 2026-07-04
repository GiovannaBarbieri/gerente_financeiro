import { prisma } from "../shared/database/prisma.js";
import { normalizeText } from "../shared/utils/format.js";
import { FinancialNature, NormalizedTransaction, Origin } from "./NormalizationEngine.js";

export type Classification = {
  categoryId?: number;
  subcategoryId?: number;
  origin: string;
  isInternalTransfer: boolean;
  isCreditCardPayment: boolean;
};

export type NormalizedClassification = {
  category: string;
  subcategory: string;
  financialNature: FinancialNature;
  origin: Origin;
};

function fuzzyIncludes(text: string, keyword: string) {
  const compactText = text.replace(/\s+/g, "");
  const compactKeyword = keyword.replace(/\s+/g, "");
  return compactText.includes(compactKeyword);
}

function ruleMatches(text: string, keyword: string, matchType?: string) {
  const normalizedKeyword = normalizeText(keyword);
  switch (matchType) {
    case "EXACT":
      return text === normalizedKeyword;
    case "REGEX":
      try {
        return new RegExp(keyword, "i").test(text);
      } catch {
        return false;
      }
    case "FUZZY":
      return fuzzyIncludes(text, normalizedKeyword);
    case "CONTAINS":
    default:
      return text.includes(normalizedKeyword);
  }
}

export async function classify(description: string, sourceType: "account" | "card"): Promise<Classification> {
  const normalized = normalizeText(description);
  const rules = await prisma.classificationRule.findMany({
    where: { active: true, OR: [{ sourceType }, { sourceType: "all" }] },
    orderBy: [{ priority: "asc" }]
  });

  const matched = rules.find((rule) => normalized.includes(normalizeText(rule.keyword)));
  const isCreditCardPayment = normalized.includes("PAGAMENTO DE FATURA") || normalized.includes("PAGTO FATURA");
  const isInternalTransfer =
    normalized.includes("TRANSFERENCIA") || normalized.includes("RDB") || normalized.includes("APLICACAO") || normalized.includes("RESGATE");

  return {
    categoryId: matched?.categoryId ?? undefined,
    subcategoryId: matched?.subcategoryId ?? undefined,
    origin: matched?.origin ?? (sourceType === "card" ? "Cartao" : "Outros"),
    isInternalTransfer: isInternalTransfer && !isCreditCardPayment,
    isCreditCardPayment
  };
}

export async function classifyNormalized(item: NormalizedTransaction): Promise<NormalizedTransaction> {
  const normalized = normalizeText(item.normalizedDescription);
  const rules = await prisma.classificationRule.findMany({
    where: { active: true, OR: [{ sourceType: item.sourceType === "Conta" ? "account" : "card" }, { sourceType: "all" }] },
    include: { category: true, subcategory: true },
    orderBy: [{ priority: "asc" }]
  });

  const matched = rules.find((rule) => {
    const keyword = rule.normalizedKeyword || rule.keyword;
    return ruleMatches(normalized, keyword, rule.matchType);
  });

  if (!matched) return item;

  const financialNature = (matched.financialNature as FinancialNature) ?? item.financialNature;
  const category = matched.categoryName ?? matched.category?.name ?? item.category;
  const transferInternal = financialNature === "Transferencia" || financialNature === "Investimento" || item.transferInternal;
  const isCardPayment = financialNature === "Transferencia" && normalizeText(category).includes("CARTAO");

  return {
    ...item,
    category,
    subcategory: matched.subcategoryName ?? matched.subcategory?.name ?? item.subcategory,
    financialNature,
    origin: (matched.origin as Origin) ?? item.origin,
    transferInternal,
    cashFlowImpact: item.sourceType === "Conta",
    realConsumptionImpact: financialNature === "Despesa" && !transferInternal && !isCardPayment,
    classificationConfidence: matched.confidence,
    classificationSource: (matched.createdBy as "SYSTEM" | "USER" | "RULE" | "AI") ?? "RULE"
  };
}
