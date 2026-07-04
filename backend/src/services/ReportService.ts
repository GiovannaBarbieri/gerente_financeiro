import { Prisma } from "@prisma/client";
import { prisma } from "../shared/database/prisma.js";
import { fromMonthInput, money, normalizeText } from "../shared/utils/format.js";

type FinancialRow = Awaited<ReturnType<typeof prisma.financialTransaction.findMany>>[number];

function competenceWhere(month?: string) {
  const competence = fromMonthInput(month);
  return competence ? { competence } : {};
}

function sum(values: Array<{ amount: unknown }>) {
  return values.reduce((total, item) => total + money(item.amount), 0);
}

function signedAmount(item: FinancialRow) {
  const amount = money(item.amount);
  if (item.transactionType === "Entrada" || item.transactionType === "Estorno") return amount;
  return -amount;
}

function groupBy<T>(rows: T[], key: (row: T) => string, value: (row: T) => number) {
  const map = new Map<string, number>();
  for (const row of rows) map.set(key(row), (map.get(key(row)) ?? 0) + value(row));
  return Array.from(map.entries()).map(([name, amount]) => ({ name, amount }));
}

function isCashOut(item: FinancialRow) {
  return item.cashFlowImpact && ["Saida", "Compra"].includes(item.transactionType);
}

function isCashIn(item: FinancialRow) {
  return item.cashFlowImpact && ["Entrada", "Estorno"].includes(item.transactionType);
}

function isRealExpense(item: FinancialRow) {
  return item.realConsumptionImpact && item.financialNature === "Despesa";
}

function isCreditCardPayment(item: FinancialRow) {
  return item.sourceType === "Conta" && item.financialNature === "Transferencia" && normalizeText(item.category).includes("CARTAO");
}

function monthKeyToDate(competence: string) {
  const [month, year] = competence.split("/");
  return new Date(Number(year), Number(month) - 1, 1);
}

function lastTwelveCompetences(rows: FinancialRow[]) {
  const sorted = Array.from(new Set(rows.map((item) => item.competence))).sort((a, b) => monthKeyToDate(a).getTime() - monthKeyToDate(b).getTime());
  return sorted.slice(-12);
}

function distribution(rows: FinancialRow[], field: keyof Pick<FinancialRow, "category" | "origin" | "sourceType" | "financialNature">) {
  return groupBy(rows, (row) => String(row[field] ?? "Outros"), (row) => money(row.amount))
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 8);
}

export async function executiveDashboard() {
  const [rows, importFiles, accounts, cards, invoices] = await Promise.all([
    prisma.financialTransaction.findMany({ orderBy: { transactionDate: "asc" } }),
    prisma.importFile.findMany(),
    prisma.account.findMany(),
    prisma.card.findMany(),
    prisma.creditCardInvoice.findMany()
  ]);

  const last12 = lastTwelveCompetences(rows);
  const last12Rows = rows.filter((item) => last12.includes(item.competence));
  const cashRows = rows.filter((item) => item.cashFlowImpact);
  const realExpenseRows = rows.filter(isRealExpense);
  const cardOpenRows = rows.filter((item) => item.sourceType === "Cartao" && item.realConsumptionImpact && !item.reconciled);
  const investments = rows.filter((item) => item.financialNature === "Investimento");
  const pendingRows = rows.filter((item) => item.reviewStatus === "Pending" || item.category === "Outros" || item.origin === "Outro");

  const metrics = {
    saldoAtual: cashRows.reduce((total, item) => total + signedAmount(item), 0),
    saldoDisponivel: cashRows.reduce((total, item) => total + signedAmount(item), 0) - sum(cardOpenRows),
    receitas12Meses: sum(last12Rows.filter((item) => item.financialNature === "Receita")),
    despesas12Meses: sum(last12Rows.filter(isRealExpense)),
    resultadoFazenda:
      sum(rows.filter((item) => item.origin === "Fazenda" && item.financialNature === "Receita")) -
      sum(rows.filter((item) => item.origin === "Fazenda" && item.financialNature === "Despesa")),
    resultadoPessoal:
      sum(rows.filter((item) => item.origin === "Pessoal" && item.financialNature === "Receita")) -
      sum(rows.filter((item) => item.origin === "Pessoal" && item.financialNature === "Despesa")),
    cartaoEmAberto: sum(cardOpenRows),
    investimentos: sum(investments.filter((item) => item.transactionType === "Entrada")) - sum(investments.filter((item) => item.transactionType === "Saida"))
  };

  const evolution = last12.map((competence) => {
    const monthRows = rows.filter((item) => item.competence === competence);
    const receitas = sum(monthRows.filter((item) => item.financialNature === "Receita"));
    const despesas = sum(monthRows.filter(isRealExpense));
    const fluxo = monthRows.filter((item) => item.cashFlowImpact).reduce((total, item) => total + signedAmount(item), 0);
    return { month: competence, receitas, despesas, saldo: receitas - despesas, fluxo };
  });

  const latestTransactions = rows
    .slice()
    .sort((a, b) => b.transactionDate.getTime() - a.transactionDate.getTime())
    .slice(0, 10)
    .map((item) => ({
      id: item.id,
      date: item.transactionDate,
      description: item.originalDescription,
      category: item.category,
      origin: item.origin,
      amount: signedAmount(item)
    }));

  const alerts = [];
  if (pendingRows.length) alerts.push({ priority: "Alta", title: "Categorias pendentes", message: `${pendingRows.length} movimentacao(oes) precisam de revisao.` });
  const unreconciled = rows.filter((item) => isCreditCardPayment(item) && !item.reconciled);
  if (unreconciled.length) alerts.push({ priority: "Alta", title: "Faturas nao conciliadas", message: `${unreconciled.length} pagamento(s) de fatura pendentes.` });
  const failedImports = importFiles.filter((item) => item.status === "Error");
  if (failedImports.length) alerts.push({ priority: "Media", title: "Importacoes com erro", message: `${failedImports.length} arquivo(s) falharam na importacao.` });
  if (metrics.saldoDisponivel < 0) alerts.push({ priority: "Alta", title: "Saldo disponivel negativo", message: "O saldo disponivel esta abaixo de zero." });
  const uber = await uberReport();
  const avgUber = uber.byMonth.length ? uber.byMonth.reduce((total, item) => total + item.amount, 0) / uber.byMonth.length : 0;
  const lastUber = uber.byMonth.at(-1)?.amount ?? 0;
  if (avgUber && lastUber > avgUber * 1.25) alerts.push({ priority: "Baixa", title: "Uber acima da media", message: "Gasto recente com Uber ficou acima da media historica." });

  return {
    metrics,
    evolution,
    distribution: {
      categories: distribution(realExpenseRows, "category"),
      origin: distribution(realExpenseRows, "origin"),
      personalFarm: [
        { name: "Pessoal", amount: sum(realExpenseRows.filter((item) => item.origin === "Pessoal")) },
        { name: "Fazenda", amount: sum(realExpenseRows.filter((item) => item.origin === "Fazenda")) }
      ],
      cardAccount: [
        { name: "Cartao", amount: sum(realExpenseRows.filter((item) => item.sourceType === "Cartao")) },
        { name: "Conta", amount: sum(realExpenseRows.filter((item) => item.sourceType === "Conta")) }
      ],
      investments: distribution(investments, "category")
    },
    indicators: {
      transactions: rows.length,
      accounts: accounts.length,
      cards: cards.length,
      imports: importFiles.length,
      pendingTransactions: pendingRows.length,
      pendingCategories: rows.filter((item) => item.category === "Outros").length,
      openInvoices: invoices.filter((item) => item.status === "Open").length,
      reconciledInvoices: invoices.filter((item) => item.status === "Reconciled").length
    },
    latestTransactions,
    alerts: alerts.slice(0, 8)
  };
}

export async function dashboard(month?: string) {
  const [periodRows, allRows] = await Promise.all([
    prisma.financialTransaction.findMany({
      where: competenceWhere(month),
      orderBy: { transactionDate: "desc" }
    }),
    prisma.financialTransaction.findMany({
      orderBy: { competence: "asc" }
    })
  ]);

  const entries = periodRows.filter((item) => item.financialNature === "Receita" && isCashIn(item));
  const cashOutflows = periodRows.filter(isCashOut);
  const transfers = periodRows.filter((item) => item.transferInternal || item.financialNature === "Transferencia");
  const cardPurchases = periodRows.filter((item) => item.sourceType === "Cartao" && item.realConsumptionImpact);
  const realExpensesRows = periodRows.filter(isRealExpense);

  const income = sum(entries);
  const cashOut = sum(cashOutflows);
  const cardTotal = sum(cardPurchases);
  const realExpenses = sum(realExpensesRows);

  const monthly = Array.from(new Set(allRows.map((item) => item.competence))).map((competence) => {
    const rows = allRows.filter((item) => item.competence === competence);
    return {
      month: competence,
      entradas: sum(rows.filter((item) => item.financialNature === "Receita" && isCashIn(item))),
      saidas: sum(rows.filter(isCashOut))
    };
  });

  return {
    cards: {
      entradasMes: income,
      saidasMes: cashOut,
      saldoMes: income - cashOut,
      saldoAcumulado: allRows.filter((item) => item.cashFlowImpact).reduce((total, item) => total + signedAmount(item), 0),
      totalCartao: cardTotal,
      totalGastosReais: realExpenses,
      resultadoPessoal:
        sum(periodRows.filter((item) => item.origin === "Pessoal" && item.financialNature === "Receita")) -
        sum(periodRows.filter((item) => item.origin === "Pessoal" && item.financialNature === "Despesa")),
      resultadoFazenda:
        sum(periodRows.filter((item) => item.origin === "Fazenda" && item.financialNature === "Receita")) -
        sum(periodRows.filter((item) => item.origin === "Fazenda" && item.financialNature === "Despesa")),
      transferenciasInternas: sum(transfers)
    },
    monthly,
    expensesByCategory: groupBy(realExpensesRows, (row) => row.category, (row) => money(row.amount)).sort((a, b) => b.amount - a.amount),
    cardByCategory: groupBy(cardPurchases, (row) => row.category, (row) => money(row.amount)).sort((a, b) => b.amount - a.amount),
    topOutflows: cashOutflows
      .slice()
      .sort((a, b) => money(b.amount) - money(a.amount))
      .slice(0, 10)
      .map((item) => ({ id: item.id, date: item.transactionDate, description: item.originalDescription, amount: money(item.amount) })),
    topInflows: entries
      .slice()
      .sort((a, b) => money(b.amount) - money(a.amount))
      .slice(0, 10)
      .map((item) => ({ id: item.id, date: item.transactionDate, description: item.originalDescription, amount: money(item.amount) })),
    topPeople: groupBy(periodRows, (row) => row.personCompany, (row) => money(row.amount))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 10),
    uberHighlight: await uberReport(month)
  };
}

export async function consolidatedTransactions(filters: { month?: string; source?: string; q?: string }) {
  const sourceType = filters.source === "Conta" ? "Conta" : filters.source === "Cartao" ? "Cartao" : undefined;
  const rows = await prisma.financialTransaction.findMany({
    where: {
      ...competenceWhere(filters.month),
      ...(sourceType ? { sourceType } : {}),
      ...(filters.q ? { originalDescription: { contains: filters.q } } : {})
    },
    orderBy: { transactionDate: "desc" }
  });

  return rows.map((item) => ({
    id: item.id,
    rawId: item.id,
    date: item.transactionDate,
    month: item.competence,
    type: item.transactionType,
    source: item.sourceType,
    institution: item.institution,
    accountName: item.accountName,
    description: item.originalDescription,
    normalizedDescription: item.normalizedDescription,
    personName: item.personCompany,
    category: item.category,
    subcategory: item.subcategory,
    financialNature: item.financialNature,
    origin: item.origin,
    paymentMethod: item.paymentMethod,
    amount: signedAmount(item),
    isInternalTransfer: item.transferInternal,
    isCreditCardPayment: isCreditCardPayment(item),
    isReconciled: item.reconciled,
    notes: item.notes,
    hash: item.hash
  }));
}

export async function uberReport(month?: string) {
  const rows = await prisma.financialTransaction.findMany({
    where: {
      ...competenceWhere(month),
      sourceType: "Cartao",
      OR: [
        { normalizedDescription: { contains: "UBER" } },
        { originalDescription: { contains: "Uber" } },
        { originalDescription: { contains: "UBER" } },
        { originalDescription: { contains: "Uberrides" } },
        { originalDescription: { contains: "UBERRIDES" } }
      ]
    },
    orderBy: { transactionDate: "desc" }
  });

  const rides = rows.filter((item) => !normalizeText(item.normalizedDescription).includes("UBER ONE"));
  const membership = rows.filter((item) => normalizeText(item.normalizedDescription).includes("UBER ONE"));
  const total = sum(rides);
  const byMonth = groupBy(rides, (row) => row.competence, (row) => money(row.amount)).sort((a, b) => a.name.localeCompare(b.name));
  const sorted = rides.slice().sort((a, b) => money(a.amount) - money(b.amount));

  return {
    total,
    quantity: rides.length,
    averageTicket: rides.length ? total / rides.length : 0,
    maxRide: sorted.at(-1)
      ? { id: sorted.at(-1)!.id, date: sorted.at(-1)!.transactionDate, description: sorted.at(-1)!.originalDescription, amount: money(sorted.at(-1)!.amount) }
      : null,
    minRide: sorted[0]
      ? { id: sorted[0].id, date: sorted[0].transactionDate, description: sorted[0].originalDescription, amount: money(sorted[0].amount) }
      : null,
    byMonth,
    rides: rides.map((item) => ({
      id: item.id,
      date: item.transactionDate,
      description: item.originalDescription,
      normalizedDescription: item.normalizedDescription,
      amount: money(item.amount)
    })),
    membership: membership.map((item) => ({
      id: item.id,
      date: item.transactionDate,
      description: item.originalDescription,
      normalizedDescription: item.normalizedDescription,
      amount: money(item.amount)
    })),
    originalDescriptions: rows.map((item) => item.originalDescription)
  };
}

export async function reconcileInvoices(invoiceMonth?: string) {
  const competence = fromMonthInput(invoiceMonth);
  const payments = await prisma.financialTransaction.findMany({
    where: {
      sourceType: "Conta",
      financialNature: "Transferencia",
      category: "Cartao de Credito",
      ...(competence ? { competence } : {})
    },
    orderBy: { transactionDate: "desc" }
  });

  const results = [];
  for (const payment of payments) {
    const purchases = await prisma.financialTransaction.findMany({
      where: {
        sourceType: "Cartao",
        financialNature: "Despesa",
        ...(competence ? { notes: { contains: competence } } : { competence: payment.competence })
      }
    });
    const purchasesAmount = sum(purchases);
    const invoiceAmount = money(payment.amount);
    const differenceAmount = invoiceAmount - purchasesAmount;
    const status = Math.abs(differenceAmount) <= 1 ? "conciliada" : "divergente";

    await prisma.financialTransaction.update({
      where: { id: payment.id },
      data: { reconciled: status === "conciliada" }
    });

    results.push({
      accountTransactionId: payment.id,
      invoiceMonth: competence ?? payment.competence,
      invoiceAmount: new Prisma.Decimal(invoiceAmount),
      purchasesAmount: new Prisma.Decimal(purchasesAmount),
      differenceAmount: new Prisma.Decimal(differenceAmount),
      status
    });
  }

  return results;
}
