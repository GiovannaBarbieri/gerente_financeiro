import { analyticsDashboard } from "../AnalyticsService.js";
import { prisma } from "../../shared/database/prisma.js";

export type FinancialContext = {
  generatedAt: string;
  summary: unknown;
  recommendations: Array<{ title: string; message: string; impact: number; priority: string }>;
  memories: Array<{ kind: string; content: string }>;
  privacy: {
    rawTransactionsIncluded: false;
    compression: "aggregated";
  };
};

export async function buildFinancialContext() {
  const [dashboard, memories] = await Promise.all([
    analyticsDashboard({ range: "12m" }),
    prisma.aIMemory.findMany({ where: { active: true }, orderBy: { updatedAt: "desc" }, take: 20 })
  ]);

  return {
    generatedAt: new Date().toISOString(),
    summary: dashboard,
    recommendations: buildContextRecommendations(dashboard as any),
    memories: memories.map((item) => ({ kind: item.kind, content: item.content })),
    privacy: {
      rawTransactionsIncluded: false,
      compression: "aggregated"
    }
  } satisfies FinancialContext;
}

function buildContextRecommendations(dashboard: any) {
  const recommendations = [];
  const largestCategory = dashboard.categories?.biggest;
  const growth = dashboard.categories?.growth;
  const cardNearLimit = dashboard.creditCards?.find((card: any) => card.limit && card.used / card.limit > 0.8);
  const savings = dashboard.indicators?.monthlySavings ?? 0;

  if (largestCategory) {
    recommendations.push({
      title: "Revisar maior categoria",
      message: `${largestCategory.name} concentra ${formatMoney(largestCategory.amount)} em gastos no período.`,
      impact: largestCategory.amount * 0.1,
      priority: "Media"
    });
  }
  if (growth && growth.variation > 20) {
    recommendations.push({
      title: "Categoria em crescimento",
      message: `${growth.name} cresceu ${growth.variation}% em relação ao período anterior.`,
      impact: growth.amount - growth.previousAmount,
      priority: "Alta"
    });
  }
  if (cardNearLimit) {
    recommendations.push({
      title: "Limite do cartão próximo",
      message: `${cardNearLimit.name} já utiliza mais de 80% do limite disponível.`,
      impact: cardNearLimit.used,
      priority: "Alta"
    });
  }
  if (savings < 0) {
    recommendations.push({
      title: "Resultado negativo",
      message: "As despesas superaram as receitas no período analisado.",
      impact: Math.abs(savings),
      priority: "Alta"
    });
  }

  return recommendations.slice(0, 8);
}

function formatMoney(value: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(value || 0));
}
