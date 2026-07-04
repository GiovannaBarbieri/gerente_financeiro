import { money } from "../../shared/utils/format.js";

type AmountLike = {
  amount: unknown;
};

type TransactionTypeLike = AmountLike & {
  transactionType?: string | null;
};

type ReviewLike = {
  reviewStatus?: string | null;
  status?: string | null;
  category?: string | null;
  origin?: string | null;
};

type NatureLike = {
  financialNature?: string | null;
  transactionType?: string | null;
  realConsumptionImpact?: boolean | null;
};

export function signedAmount(item: TransactionTypeLike) {
  const amount = money(item.amount);
  if (item.transactionType === "Entrada" || item.transactionType === "Estorno") return amount;
  return -amount;
}

export function absoluteAmount(item: AmountLike) {
  return Math.abs(money(item.amount));
}

export function sumAmounts<T extends AmountLike>(rows: T[]) {
  return rows.reduce((total, row) => total + money(row.amount), 0);
}

export function sumAbsoluteAmounts<T extends AmountLike>(rows: T[], value: (row: T) => number = absoluteAmount) {
  return rows.reduce((total, row) => total + value(row), 0);
}

export function isIncome(item: NatureLike) {
  return item.financialNature === "Receita" || item.transactionType === "Entrada";
}

export function isExpense(item: NatureLike) {
  return Boolean(item.realConsumptionImpact) && item.financialNature === "Despesa";
}

export function isPendingReview(item: ReviewLike) {
  return item.reviewStatus === "Pending" || item.status === "pending" || item.category === "Outros" || item.origin === "Outro";
}
