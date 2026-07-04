import { Router } from "express";
import { z } from "zod";
import { prisma } from "../shared/database/prisma.js";
import { analyticsDashboard } from "../services/AnalyticsService.js";
import {
  createFinancialEntry,
  getFinancialEntry,
  ignoreFinancialEntry,
  listFinancialEntries,
  updateFinancialEntry
} from "../services/TransactionService.js";
import {
  archiveAccount,
  archiveCard,
  createAccount,
  createCard,
  createRecurringEntry,
  createSavedFilter,
  createTag,
  createTransfer,
  globalSearch,
  listAccounts,
  listCards,
  listPaymentMethods,
  listRecurringEntries,
  listSavedFilters,
  listTags,
  updateAccount,
  updateCard,
  upsertPaymentMethod
} from "../services/FinancialManagementService.js";
import { consolidatedTransactions, dashboard, executiveDashboard, reconcileInvoices, uberReport } from "../services/ReportService.js";

export const financeRouter = Router();

financeRouter.get("/dashboard", async (req, res, next) => {
  try {
    res.json(await dashboard(String(req.query.month || "") || undefined));
  } catch (error) {
    next(error);
  }
});

financeRouter.get("/executive-dashboard", async (_req, res, next) => {
  try {
    res.json(await executiveDashboard());
  } catch (error) {
    next(error);
  }
});

financeRouter.get("/analytics-dashboard", async (req, res, next) => {
  try {
    res.json(
      await analyticsDashboard({
        month: String(req.query.month || "") || undefined,
        range: String(req.query.range || "") || undefined,
        account: String(req.query.account || "") || undefined,
        card: String(req.query.card || "") || undefined,
        category: String(req.query.category || "") || undefined,
        type: String(req.query.type || "") || undefined,
        institution: String(req.query.institution || "") || undefined,
        tag: String(req.query.tag || "") || undefined
      })
    );
  } catch (error) {
    next(error);
  }
});

financeRouter.get("/transactions", async (req, res, next) => {
  try {
    res.json(
      await consolidatedTransactions({
        month: String(req.query.month || "") || undefined,
        source: String(req.query.source || "") || undefined,
        q: String(req.query.q || "") || undefined
      })
    );
  } catch (error) {
    next(error);
  }
});

financeRouter.get("/financial-entries", async (req, res, next) => {
  try {
    res.json(
      await listFinancialEntries({
        month: String(req.query.month || "") || undefined,
        source: String(req.query.source || "") || undefined,
        q: String(req.query.q || "") || undefined,
        category: String(req.query.category || "") || undefined,
        subcategory: String(req.query.subcategory || "") || undefined,
        type: String(req.query.type || "") || undefined,
        nature: String(req.query.nature || "") || undefined,
        status: String(req.query.status || "") || undefined,
        origin: String(req.query.origin || "") || undefined,
        institution: String(req.query.institution || "") || undefined,
        account: String(req.query.account || "") || undefined,
        card: String(req.query.card || "") || undefined
      })
    );
  } catch (error) {
    next(error);
  }
});

financeRouter.post("/financial-entries", async (req, res, next) => {
  try {
    const schema = z.object({
      type: z.string().optional(),
      date: z.string().min(1),
      competence: z.string().optional(),
      description: z.string().min(1),
      amount: z.union([z.number(), z.string()]),
      accountName: z.string().optional(),
      cardName: z.string().optional(),
      category: z.string().optional(),
      subcategory: z.string().optional(),
      paymentMethod: z.string().optional(),
      status: z.string().optional(),
      origin: z.string().optional(),
      institution: z.string().optional(),
      notes: z.string().optional()
    });
    res.status(201).json(await createFinancialEntry(schema.parse(req.body)));
  } catch (error) {
    next(error);
  }
});

financeRouter.get("/financial-entries/:id", async (req, res, next) => {
  try {
    res.json(await getFinancialEntry(req.params.id));
  } catch (error) {
    next(error);
  }
});

financeRouter.patch("/financial-entries/:id", async (req, res, next) => {
  try {
    const schema = z.object({
      type: z.string().optional(),
      date: z.string().optional(),
      competence: z.string().optional(),
      description: z.string().optional(),
      amount: z.union([z.number(), z.string()]).optional(),
      accountName: z.string().optional(),
      cardName: z.string().optional(),
      category: z.string().optional(),
      subcategory: z.string().optional(),
      paymentMethod: z.string().optional(),
      status: z.string().optional(),
      origin: z.string().optional(),
      institution: z.string().optional(),
      notes: z.string().optional()
    });
    res.json(await updateFinancialEntry(req.params.id, schema.parse(req.body)));
  } catch (error) {
    next(error);
  }
});

financeRouter.delete("/financial-entries/:id", async (req, res, next) => {
  try {
    res.json(await ignoreFinancialEntry(req.params.id));
  } catch (error) {
    next(error);
  }
});

financeRouter.get("/categories", async (_req, res, next) => {
  try {
    res.json(await prisma.category.findMany({ include: { subcategories: true }, orderBy: { name: "asc" } }));
  } catch (error) {
    next(error);
  }
});

financeRouter.get("/accounts", async (_req, res, next) => {
  try {
    res.json(await listAccounts());
  } catch (error) {
    next(error);
  }
});

financeRouter.post("/accounts", async (req, res, next) => {
  try {
    res.status(201).json(await createAccount(req.body ?? {}));
  } catch (error) {
    next(error);
  }
});

financeRouter.patch("/accounts/:id", async (req, res, next) => {
  try {
    res.json(await updateAccount(Number(req.params.id), req.body ?? {}));
  } catch (error) {
    next(error);
  }
});

financeRouter.delete("/accounts/:id", async (req, res, next) => {
  try {
    res.json(await archiveAccount(Number(req.params.id)));
  } catch (error) {
    next(error);
  }
});

financeRouter.get("/cards", async (_req, res, next) => {
  try {
    res.json(await listCards());
  } catch (error) {
    next(error);
  }
});

financeRouter.post("/cards", async (req, res, next) => {
  try {
    res.status(201).json(await createCard(req.body ?? {}));
  } catch (error) {
    next(error);
  }
});

financeRouter.patch("/cards/:id", async (req, res, next) => {
  try {
    res.json(await updateCard(Number(req.params.id), req.body ?? {}));
  } catch (error) {
    next(error);
  }
});

financeRouter.delete("/cards/:id", async (req, res, next) => {
  try {
    res.json(await archiveCard(Number(req.params.id)));
  } catch (error) {
    next(error);
  }
});

financeRouter.get("/payment-methods", async (_req, res, next) => {
  try {
    res.json(await listPaymentMethods());
  } catch (error) {
    next(error);
  }
});

financeRouter.post("/payment-methods", async (req, res, next) => {
  try {
    res.status(201).json(await upsertPaymentMethod(req.body ?? {}));
  } catch (error) {
    next(error);
  }
});

financeRouter.get("/tags", async (_req, res, next) => {
  try {
    res.json(await listTags());
  } catch (error) {
    next(error);
  }
});

financeRouter.post("/tags", async (req, res, next) => {
  try {
    res.status(201).json(await createTag(req.body ?? {}));
  } catch (error) {
    next(error);
  }
});

financeRouter.get("/saved-filters", async (_req, res, next) => {
  try {
    res.json(await listSavedFilters());
  } catch (error) {
    next(error);
  }
});

financeRouter.post("/saved-filters", async (req, res, next) => {
  try {
    res.status(201).json(await createSavedFilter(req.body ?? {}));
  } catch (error) {
    next(error);
  }
});

financeRouter.get("/recurring-entries", async (_req, res, next) => {
  try {
    res.json(await listRecurringEntries());
  } catch (error) {
    next(error);
  }
});

financeRouter.post("/recurring-entries", async (req, res, next) => {
  try {
    res.status(201).json(await createRecurringEntry(req.body ?? {}));
  } catch (error) {
    next(error);
  }
});

financeRouter.post("/transfers", async (req, res, next) => {
  try {
    res.status(201).json(await createTransfer(req.body ?? {}));
  } catch (error) {
    next(error);
  }
});

financeRouter.get("/search", async (req, res, next) => {
  try {
    res.json(await globalSearch(String(req.query.q || "")));
  } catch (error) {
    next(error);
  }
});

financeRouter.patch("/transactions/:source/:id", async (req, res, next) => {
  try {
    const schema = z.object({
      categoryId: z.number().optional(),
      subcategoryId: z.number().nullable().optional(),
      category: z.string().optional(),
      subcategory: z.string().optional(),
      financialNature: z.string().optional(),
      origin: z.string().optional(),
      notes: z.string().optional(),
      saveRule: z.boolean().optional()
    });
    const body = schema.parse(req.body);
    const id = req.params.id;
    const category = body.category ?? (body.categoryId ? (await prisma.category.findUnique({ where: { id: body.categoryId } }))?.name : undefined);
    const subcategory = body.subcategory ?? (body.subcategoryId ? (await prisma.subcategory.findUnique({ where: { id: body.subcategoryId } }))?.name : undefined);
    const current = await prisma.financialTransaction.findUniqueOrThrow({ where: { id } });
    const data = {
      category,
      subcategory,
      financialNature: body.financialNature,
      origin: body.origin,
      notes: body.notes,
      classificationSource: body.category || body.categoryId || body.origin ? "USER" : undefined,
      classificationConfidence: body.category || body.categoryId || body.origin ? 100 : undefined,
      reviewStatus: body.category || body.categoryId || body.origin ? "Reviewed" : undefined
    };

    const updated = await prisma.financialTransaction.update({ where: { id }, data });

    if (body.saveRule && category) {
      const keyword = updated.normalizedDescription.split(/\s+/).slice(0, 2).join(" ");
      await prisma.classificationFeedback.create({
        data: {
          originalDescription: updated.originalDescription,
          normalizedDescription: updated.normalizedDescription,
          oldCategory: current.category,
          newCategory: category,
          oldOrigin: current.origin,
          newOrigin: body.origin ?? updated.origin
        }
      });
      await prisma.classificationRule.create({
        data: {
          keyword,
          normalizedKeyword: keyword,
          matchType: "CONTAINS",
          sourceType: updated.sourceType === "Conta" ? "account" : "card",
          categoryName: category,
          subcategoryName: subcategory,
          financialNature: body.financialNature ?? updated.financialNature,
          origin: body.origin ?? "Outros",
          priority: 60,
          confidence: 100,
          createdBy: "USER"
        }
      });
    }

    res.json(updated);
  } catch (error) {
    next(error);
  }
});

financeRouter.get("/reports/uber", async (req, res, next) => {
  try {
    res.json(await uberReport(String(req.query.month || "") || undefined));
  } catch (error) {
    next(error);
  }
});

financeRouter.get("/reports/farm-personal", async (req, res, next) => {
  try {
    const month = String(req.query.month || "") || undefined;
    const transactions = await consolidatedTransactions({ month });
    const totals = transactions.reduce(
      (acc, item) => {
        const amount = Number(item.amount);
        const key = item.origin === "Fazenda" ? "fazenda" : item.origin === "Investimento" ? "investimentos" : "pessoal";
        if (amount > 0) acc[key].entradas += amount;
        if (amount < 0) acc[key].saidas += Math.abs(amount);
        return acc;
      },
      {
        fazenda: { entradas: 0, saidas: 0 },
        pessoal: { entradas: 0, saidas: 0 },
        investimentos: { entradas: 0, saidas: 0 }
      }
    );
    res.json(totals);
  } catch (error) {
    next(error);
  }
});

financeRouter.post("/reconcile", async (req, res, next) => {
  try {
    res.json(await reconcileInvoices(req.body?.invoiceMonth));
  } catch (error) {
    next(error);
  }
});

financeRouter.get("/reconciliations", async (_req, res, next) => {
  try {
    res.json(
      await prisma.financialTransaction.findMany({
        where: { sourceType: "Conta", financialNature: "Transferencia", category: "Cartao de Credito" },
        orderBy: { transactionDate: "desc" }
      })
    );
  } catch (error) {
    next(error);
  }
});

financeRouter.post("/categories", async (req, res, next) => {
  try {
    const schema = z.object({ name: z.string().min(2), type: z.string().default("expense") });
    const body = schema.parse(req.body);
    res.json(await prisma.category.create({ data: body }));
  } catch (error) {
    next(error);
  }
});
