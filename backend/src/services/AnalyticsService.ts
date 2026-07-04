import { prisma } from "../shared/database/prisma.js";
import { fromMonthInput } from "../shared/utils/format.js";
import { absoluteAmount, isExpense, isIncome, isPendingReview, signedAmount, sumAbsoluteAmounts } from "./shared/FinancialMathService.js";

type Row = Awaited<ReturnType<typeof prisma.financialTransaction.findMany>>[number];

type AnalyticsFilters = {
  month?: string;
  range?: string;
  account?: string;
  card?: string;
  category?: string;
  type?: string;
  institution?: string;
  tag?: string;
};

type CacheEntry = {
  expiresAt: number;
  data: unknown;
};

const cache = new Map<string, CacheEntry>();
const CACHE_MS = 45_000;

function sum(rows: Row[], value = absoluteAmount) {
  return sumAbsoluteAmounts(rows, value);
}

function parseCompetence(competence: string) {
  const [month, year] = competence.split("/");
  return new Date(Number(year), Number(month) - 1, 1);
}

function competenceFromInput(month?: string) {
  return fromMonthInput(month) ?? new Date().toLocaleDateString("pt-BR", { month: "2-digit", year: "numeric" });
}

function previousCompetence(competence: string) {
  const date = parseCompetence(competence);
  date.setMonth(date.getMonth() - 1);
  return date.toLocaleDateString("pt-BR", { month: "2-digit", year: "numeric" });
}

function dateRange(range: string | undefined, month?: string) {
  const now = new Date();
  if (range === "7d" || range === "30d" || range === "90d") {
    const days = range === "7d" ? 7 : range === "30d" ? 30 : 90;
    const start = new Date(now);
    start.setDate(start.getDate() - days + 1);
    return { start, end: now };
  }
  if (range === "12m") {
    const start = new Date(now);
    start.setMonth(start.getMonth() - 11);
    start.setDate(1);
    return { start, end: now };
  }
  const competence = competenceFromInput(month);
  const start = parseCompetence(competence);
  const end = new Date(start.getFullYear(), start.getMonth() + 1, 0, 23, 59, 59);
  return { start, end };
}

function pct(current: number, previous: number) {
  if (!previous && !current) return 0;
  if (!previous) return 100;
  return Number((((current - previous) / Math.abs(previous)) * 100).toFixed(1));
}

function groupBy<T>(rows: T[], key: (row: T) => string, value: (row: T) => number) {
  const map = new Map<string, number>();
  for (const row of rows) map.set(key(row) || "Nao informado", (map.get(key(row) || "Nao informado") ?? 0) + value(row));
  return Array.from(map.entries()).map(([name, amount]) => ({ name, amount }));
}

function spark(rows: Row[]) {
  const grouped = groupBy(rows, (row) => row.transactionDate.toISOString().slice(0, 10), signedAmount).sort((a, b) => a.name.localeCompare(b.name));
  return grouped.slice(-12).map((item) => item.amount);
}

function flow(rows: Row[], range?: string) {
  const by = range === "12m" ? (row: Row) => row.competence : (row: Row) => row.transactionDate.toISOString().slice(0, 10);
  return Array.from(new Set(rows.map(by)))
    .sort((a, b) => a.localeCompare(b))
    .map((period) => {
      const periodRows = rows.filter((row) => by(row) === period);
      const receitas = sum(periodRows.filter(isIncome));
      const despesas = sum(periodRows.filter(isExpense));
      return { period, receitas, despesas, resultado: receitas - despesas };
    });
}

function topRows(rows: Row[], predicate: (row: Row) => boolean, take = 10) {
  return rows
    .filter(predicate)
    .slice()
    .sort((a, b) => absoluteAmount(b) - absoluteAmount(a))
    .slice(0, take)
    .map((row) => ({
      id: row.id,
      date: row.transactionDate,
      description: row.originalDescription,
      category: row.category,
      establishment: row.personCompany,
      amount: signedAmount(row)
    }));
}

function applyFilters(rows: Row[], filters: AnalyticsFilters, start: Date, end: Date) {
  return rows.filter((row) => {
    const dateOk = row.transactionDate >= start && row.transactionDate <= end;
    return (
      dateOk &&
      (!filters.account || row.accountName === filters.account) &&
      (!filters.card || row.cardName === filters.card || row.accountName === filters.card) &&
      (!filters.category || row.category === filters.category) &&
      (!filters.type || row.financialNature === filters.type || row.transactionType === filters.type) &&
      (!filters.institution || row.institution === filters.institution)
    );
  });
}

export async function analyticsDashboard(filters: AnalyticsFilters) {
  const cacheKey = JSON.stringify(filters);
  const cached = cache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) return cached.data;

  const [{ start, end }, allRows, accounts, cards, recurring] = await Promise.all([
    Promise.resolve(dateRange(filters.range, filters.month)),
    prisma.financialTransaction.findMany({ orderBy: { transactionDate: "asc" } }),
    prisma.account.findMany({ orderBy: { name: "asc" } }),
    prisma.card.findMany({ orderBy: { name: "asc" } }),
    prisma.recurringEntry.findMany({ where: { status: "Active" }, orderBy: { nextDate: "asc" }, take: 20 })
  ]);

  const rows = applyFilters(allRows, filters, start, end);
  const competence = competenceFromInput(filters.month);
  const previous = previousCompetence(competence);
  const monthRows = applyFilters(allRows, { ...filters, range: undefined }, parseCompetence(competence), new Date(parseCompetence(competence).getFullYear(), parseCompetence(competence).getMonth() + 1, 0, 23, 59, 59));
  const previousRows = allRows.filter((row) => row.competence === previous);

  const receitas = sum(monthRows.filter(isIncome));
  const despesas = sum(monthRows.filter(isExpense));
  const previousReceitas = sum(previousRows.filter(isIncome));
  const previousDespesas = sum(previousRows.filter(isExpense));
  const cashRows = allRows.filter((row) => row.cashFlowImpact);
  const saldoAtual = cashRows.reduce((total, row) => total + signedAmount(row), 0);
  const cardRows = allRows.filter((row) => row.sourceType === "Cartao" && row.realConsumptionImpact && !row.reconciled);
  const today = new Date();
  const overdue = allRows.filter((row) => row.dueDate && row.dueDate < today && !["paid", "cleared", "reviewed"].includes(String(row.status ?? "").toLowerCase()));
  const pendingRows = allRows.filter(isPendingReview);

  const categories = groupBy(rows.filter(isExpense), (row) => row.category, absoluteAmount).sort((a, b) => b.amount - a.amount);
  const previousCategories = groupBy(previousRows.filter(isExpense), (row) => row.category, absoluteAmount);
  const categoryComparison = categories.map((item) => {
    const previousAmount = previousCategories.find((prev) => prev.name === item.name)?.amount ?? 0;
    return { ...item, previousAmount, variation: pct(item.amount, previousAmount) };
  });

  const accountWidgets = accounts.map((account) => {
    const accountRows = allRows.filter((row) => row.accountName === account.name && row.cashFlowImpact);
    const periodRows = rows.filter((row) => row.accountName === account.name);
    const entradas = sum(periodRows.filter(isIncome));
    const saidas = sum(periodRows.filter((row) => row.cashFlowImpact && signedAmount(row) < 0));
    const saldo = Number(account.initialBalance ?? 0) + accountRows.reduce((total, row) => total + signedAmount(row), 0);
    return { id: account.id, name: account.name, bank: account.bank, type: account.type, color: account.color, saldo, movimentacao: entradas - saidas, entradas, saidas, saldoPrevisto: saldo + entradas - saidas };
  });

  const creditCards = cards.map((card) => {
    const purchases = allRows.filter((row) => row.sourceType === "Cartao" && (row.cardName === card.name || row.accountName === card.name) && row.realConsumptionImpact);
    const monthPurchases = monthRows.filter((row) => row.sourceType === "Cartao" && (row.cardName === card.name || row.accountName === card.name));
    const limit = Number(card.limitAmount ?? 0);
    const used = sum(purchases.filter((row) => !row.reconciled));
    return {
      id: card.id,
      name: card.name,
      bank: card.bank,
      brand: card.brand,
      color: card.color,
      limit,
      used,
      available: Math.max(0, limit - used),
      currentInvoice: sum(monthPurchases),
      nextInvoice: sum(purchases.filter((row) => row.competence !== competence && !row.reconciled)),
      monthPurchases: monthPurchases.length,
      dueDay: card.dueDay,
      closingDay: card.closingDay
    };
  });

  const upcoming = [
    ...allRows
      .filter((row) => row.dueDate && row.dueDate >= today)
      .slice(0, 10)
      .map((row) => ({ type: "Vencimento", date: row.dueDate, title: row.originalDescription, amount: signedAmount(row), status: row.status || row.reviewStatus })),
    ...recurring.slice(0, 10).map((item) => ({ type: "Recorrencia", date: item.nextDate, title: item.name, amount: Number(item.amount), status: item.status })),
    ...cards
      .filter((card) => card.dueDay)
      .map((card) => {
        const date = new Date(today.getFullYear(), today.getMonth(), Number(card.dueDay));
        if (date < today) date.setMonth(date.getMonth() + 1);
        return { type: "Fatura", date, title: card.name, amount: creditCards.find((item) => item.id === card.id)?.currentInvoice ?? 0, status: "Open" };
      })
  ]
    .sort((a, b) => new Date(a.date ?? 0).getTime() - new Date(b.date ?? 0).getTime())
    .slice(0, 12);

  const expenseRows = rows.filter(isExpense);
  const incomeRows = rows.filter(isIncome);
  const days = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / 86400000));
  const data = {
    filters: {
      accounts: Array.from(new Set(allRows.map((row) => row.accountName).filter(Boolean))),
      cards: Array.from(new Set(allRows.map((row) => row.cardName || (row.sourceType === "Cartao" ? row.accountName : "")).filter(Boolean))),
      categories: Array.from(new Set(allRows.map((row) => row.category).filter(Boolean))),
      types: Array.from(new Set(allRows.flatMap((row) => [row.financialNature, row.transactionType]).filter(Boolean))),
      institutions: Array.from(new Set(allRows.map((row) => row.institution).filter(Boolean))),
      tags: []
    },
    summary: [
      { key: "saldoAtual", title: "Saldo Atual", value: saldoAtual, variation: pct(saldoAtual, saldoAtual - (receitas - despesas)), sparkline: spark(cashRows), tone: "neutral" },
      { key: "receitas", title: "Receitas do mês", value: receitas, variation: pct(receitas, previousReceitas), sparkline: spark(monthRows.filter(isIncome)), tone: "green" },
      { key: "despesas", title: "Despesas do mês", value: despesas, variation: pct(despesas, previousDespesas), sparkline: spark(monthRows.filter(isExpense)), tone: "red" },
      { key: "resultado", title: "Resultado do mês", value: receitas - despesas, variation: pct(receitas - despesas, previousReceitas - previousDespesas), sparkline: spark(monthRows), tone: receitas - despesas >= 0 ? "green" : "red" },
      { key: "cartao", title: "Cartão a pagar", value: sum(cardRows), variation: 0, sparkline: spark(cardRows), tone: "blue" },
      { key: "vencidas", title: "Contas vencidas", value: overdue.length, variation: 0, sparkline: [], tone: overdue.length ? "red" : "neutral", format: "number" },
      { key: "pendentes", title: "Lançamentos pendentes", value: pendingRows.length, variation: 0, sparkline: [], tone: pendingRows.length ? "red" : "neutral", format: "number" },
      { key: "comparacao", title: "Comparação mês anterior", value: receitas - despesas - (previousReceitas - previousDespesas), variation: pct(receitas - despesas, previousReceitas - previousDespesas), sparkline: [], tone: receitas - despesas >= previousReceitas - previousDespesas ? "green" : "red" }
    ],
    flow: flow(rows, filters.range),
    categories: {
      ranking: categoryComparison.slice(0, 10),
      biggest: categoryComparison[0] ?? null,
      growth: categoryComparison.slice().sort((a, b) => b.variation - a.variation)[0] ?? null,
      reduction: categoryComparison.slice().sort((a, b) => a.variation - b.variation)[0] ?? null,
      pie: categories.slice(0, 8),
      bars: categoryComparison.slice(0, 10)
    },
    accounts: accountWidgets,
    creditCards,
    calendar: {
      upcoming,
      overdue: overdue.slice(0, 10).map((row) => ({ type: "Vencida", date: row.dueDate, title: row.originalDescription, amount: signedAmount(row), status: row.status || row.reviewStatus }))
    },
    top: {
      expenses: topRows(rows, isExpense),
      revenues: topRows(rows, isIncome),
      establishments: groupBy(expenseRows, (row) => row.personCompany, absoluteAmount).sort((a, b) => b.amount - a.amount).slice(0, 10),
      categories: categories.slice(0, 10)
    },
    indicators: {
      averageTicket: expenseRows.length ? sum(expenseRows) / expenseRows.length : 0,
      dailyAverageExpense: sum(expenseRows) / days,
      averageRevenue: incomeRows.length ? sum(incomeRows) / incomeRows.length : 0,
      monthlySavings: receitas - despesas,
      largestPurchase: topRows(rows, isExpense, 1)[0] ?? null,
      largestRevenue: topRows(rows, isIncome, 1)[0] ?? null,
      transactionCount: rows.length
    }
  };

  cache.set(cacheKey, { data, expiresAt: Date.now() + CACHE_MS });
  return data;
}
