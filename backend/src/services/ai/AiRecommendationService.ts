import { Prisma } from "@prisma/client";
import { prisma } from "../../shared/database/prisma.js";
import { buildFinancialContext } from "./FinancialContextService.js";

export async function listAIRecommendations() {
  const context = await buildFinancialContext();
  const generated = context.recommendations;
  const stored = await prisma.aIRecommendation.findMany({ orderBy: { createdAt: "desc" }, take: 20 });

  if (!stored.length && generated.length) {
    await prisma.aIRecommendation.createMany({
      data: generated.map((item) => ({
        title: item.title,
        message: item.message,
        impact: new Prisma.Decimal(item.impact || 0),
        priority: item.priority,
        source: "SYSTEM"
      }))
    });
  }

  return prisma.aIRecommendation.findMany({ orderBy: { createdAt: "desc" }, take: 20 });
}
