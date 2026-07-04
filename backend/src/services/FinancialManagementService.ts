import { Prisma } from "@prisma/client";
import { prisma } from "../shared/database/prisma.js";
import { parseAmount, parseDate } from "../shared/utils/format.js";
import { createFinancialEntry } from "./TransactionService.js";
import { signedAmount } from "./shared/FinancialMathService.js";

export async function listAccounts() {
  const [accounts, rows] = await Promise.all([
    prisma.account.findMany({ orderBy: { name: "asc" } }),
    prisma.financialTransaction.findMany({ where: { cashFlowImpact: true } })
  ]);

  return accounts.map((account) => {
    const movement = rows
      .filter((row) => row.accountName === account.name)
      .reduce((total, row) => total + signedAmount(row), 0);
    return { ...account, currentBalance: Number(account.initialBalance) + movement };
  });
}

export async function createAccount(data: Record<string, unknown>) {
  return prisma.account.create({
    data: {
      name: String(data.name || ""),
      bank: data.bank ? String(data.bank) : null,
      type: String(data.type || "Conta Corrente"),
      initialBalance: new Prisma.Decimal(parseAmount(data.initialBalance ?? 0)),
      currentBalance: new Prisma.Decimal(parseAmount(data.currentBalance ?? data.initialBalance ?? 0)),
      color: data.color ? String(data.color) : null,
      icon: data.icon ? String(data.icon) : null,
      status: String(data.status || "Active"),
      defaultAccount: Boolean(data.defaultAccount)
    }
  });
}

export async function updateAccount(id: number, data: Record<string, unknown>) {
  return prisma.account.update({
    where: { id },
    data: {
      ...(data.name !== undefined ? { name: String(data.name) } : {}),
      ...(data.bank !== undefined ? { bank: String(data.bank || "") || null } : {}),
      ...(data.type !== undefined ? { type: String(data.type) } : {}),
      ...(data.initialBalance !== undefined ? { initialBalance: new Prisma.Decimal(parseAmount(data.initialBalance)) } : {}),
      ...(data.currentBalance !== undefined ? { currentBalance: new Prisma.Decimal(parseAmount(data.currentBalance)) } : {}),
      ...(data.color !== undefined ? { color: String(data.color || "") || null } : {}),
      ...(data.icon !== undefined ? { icon: String(data.icon || "") || null } : {}),
      ...(data.status !== undefined ? { status: String(data.status) } : {}),
      ...(data.defaultAccount !== undefined ? { defaultAccount: Boolean(data.defaultAccount) } : {})
    }
  });
}

export async function archiveAccount(id: number) {
  return updateAccount(id, { status: "Archived" });
}

export async function listCards() {
  const [cards, rows] = await Promise.all([
    prisma.card.findMany({ include: { paymentAccount: true }, orderBy: { name: "asc" } }),
    prisma.financialTransaction.findMany({ where: { sourceType: "Cartao", realConsumptionImpact: true } })
  ]);

  return cards.map((card) => {
    const used = rows.filter((row) => row.cardName === card.name || row.accountName === card.name).reduce((total, row) => total + Number(row.amount), 0);
    const limit = card.limitAmount ? Number(card.limitAmount) : 0;
    return {
      ...card,
      usedLimit: used,
      availableLimit: card.availableLimit ? Number(card.availableLimit) : Math.max(0, limit - used),
      utilization: limit ? Math.min(100, Math.round((used / limit) * 100)) : 0
    };
  });
}

export async function createCard(data: Record<string, unknown>) {
  return prisma.card.create({
    data: {
      name: String(data.name || ""),
      bank: data.bank ? String(data.bank) : null,
      brand: data.brand ? String(data.brand) : null,
      color: data.color ? String(data.color) : null,
      limitAmount: data.limitAmount !== undefined ? new Prisma.Decimal(parseAmount(data.limitAmount)) : null,
      availableLimit: data.availableLimit !== undefined ? new Prisma.Decimal(parseAmount(data.availableLimit)) : null,
      closingDay: data.closingDay ? Number(data.closingDay) : null,
      dueDay: data.dueDay ? Number(data.dueDay) : null,
      status: String(data.status || "Active"),
      paymentAccountId: data.paymentAccountId ? Number(data.paymentAccountId) : null
    }
  });
}

export async function updateCard(id: number, data: Record<string, unknown>) {
  return prisma.card.update({
    where: { id },
    data: {
      ...(data.name !== undefined ? { name: String(data.name) } : {}),
      ...(data.bank !== undefined ? { bank: String(data.bank || "") || null } : {}),
      ...(data.brand !== undefined ? { brand: String(data.brand || "") || null } : {}),
      ...(data.color !== undefined ? { color: String(data.color || "") || null } : {}),
      ...(data.limitAmount !== undefined ? { limitAmount: new Prisma.Decimal(parseAmount(data.limitAmount)) } : {}),
      ...(data.availableLimit !== undefined ? { availableLimit: new Prisma.Decimal(parseAmount(data.availableLimit)) } : {}),
      ...(data.closingDay !== undefined ? { closingDay: data.closingDay ? Number(data.closingDay) : null } : {}),
      ...(data.dueDay !== undefined ? { dueDay: data.dueDay ? Number(data.dueDay) : null } : {}),
      ...(data.status !== undefined ? { status: String(data.status) } : {}),
      ...(data.paymentAccountId !== undefined ? { paymentAccountId: data.paymentAccountId ? Number(data.paymentAccountId) : null } : {})
    }
  });
}

export async function archiveCard(id: number) {
  return updateCard(id, { status: "Archived" });
}

export async function listPaymentMethods() {
  return prisma.paymentMethod.findMany({ orderBy: [{ sortOrder: "asc" }, { name: "asc" }] });
}

export async function upsertPaymentMethod(data: Record<string, unknown>) {
  const payload = {
    name: String(data.name || ""),
    type: String(data.type || "Other"),
    icon: data.icon ? String(data.icon) : null,
    color: data.color ? String(data.color) : null,
    status: String(data.status || "Active"),
    sortOrder: data.sortOrder ? Number(data.sortOrder) : 0
  };
  if (data.id) return prisma.paymentMethod.update({ where: { id: Number(data.id) }, data: payload });
  return prisma.paymentMethod.create({ data: payload });
}

export async function listTags() {
  return prisma.tag.findMany({ orderBy: { name: "asc" } });
}

export async function createTag(data: Record<string, unknown>) {
  return prisma.tag.create({ data: { name: String(data.name || ""), color: data.color ? String(data.color) : null } });
}

export async function listSavedFilters() {
  return prisma.savedFilter.findMany({ orderBy: { createdAt: "desc" } });
}

export async function createSavedFilter(data: Record<string, unknown>) {
  return prisma.savedFilter.create({
    data: {
      name: String(data.name || ""),
      scope: String(data.scope || "financial_entries"),
      filters: (data.filters || {}) as Prisma.InputJsonObject,
      favorite: Boolean(data.favorite)
    }
  });
}

export async function listRecurringEntries() {
  return prisma.recurringEntry.findMany({ include: { paymentMethod: true }, orderBy: { nextDate: "asc" } });
}

export async function createRecurringEntry(data: Record<string, unknown>) {
  return prisma.recurringEntry.create({
    data: {
      name: String(data.name || ""),
      description: String(data.description || data.name || ""),
      amount: new Prisma.Decimal(parseAmount(data.amount ?? 0)),
      frequency: String(data.frequency || "Mensal"),
      nextDate: parseDate(data.nextDate || new Date()),
      endDate: data.endDate ? parseDate(data.endDate) : null,
      status: String(data.status || "Active"),
      category: data.category ? String(data.category) : null,
      subcategory: data.subcategory ? String(data.subcategory) : null,
      accountName: data.accountName ? String(data.accountName) : null,
      cardName: data.cardName ? String(data.cardName) : null,
      paymentMethodId: data.paymentMethodId ? Number(data.paymentMethodId) : null,
      notes: data.notes ? String(data.notes) : null
    }
  });
}

export async function createTransfer(data: Record<string, unknown>) {
  const amount = parseAmount(data.amount ?? 0);
  const date = String(data.date || new Date().toISOString().slice(0, 10));
  const from = String(data.fromAccount || "");
  const to = String(data.toAccount || "");
  const notes = String(data.notes || "");
  const out = await createFinancialEntry({
    type: "Transferencia",
    date,
    description: `Transferencia para ${to}`,
    amount,
    accountName: from,
    paymentMethod: "Transferencia",
    status: "cleared",
    origin: "Transferencia",
    institution: "Manual",
    notes
  });
  const incoming = await createFinancialEntry({
    type: "Receita",
    date,
    description: `Transferencia de ${from}`,
    amount,
    accountName: to,
    paymentMethod: "Transferencia",
    status: "cleared",
    origin: "Transferencia",
    institution: "Manual",
    notes
  });
  return { out, incoming };
}

export async function globalSearch(q: string) {
  if (!q.trim()) return { entries: [], accounts: [], cards: [], categories: [] };
  const [entries, accounts, cards, categories] = await Promise.all([
    prisma.financialTransaction.findMany({
      where: {
        OR: [
          { originalDescription: { contains: q } },
          { normalizedDescription: { contains: q } },
          { category: { contains: q } },
          { accountName: { contains: q } },
          { cardName: { contains: q } },
          { institution: { contains: q } },
          { notes: { contains: q } }
        ]
      },
      orderBy: { transactionDate: "desc" },
      take: 20
    }),
    prisma.account.findMany({ where: { OR: [{ name: { contains: q } }, { bank: { contains: q } }] }, take: 10 }),
    prisma.card.findMany({ where: { OR: [{ name: { contains: q } }, { bank: { contains: q } }, { brand: { contains: q } }] }, take: 10 }),
    prisma.category.findMany({ where: { name: { contains: q } }, take: 10 })
  ]);
  return { entries, accounts, cards, categories };
}
