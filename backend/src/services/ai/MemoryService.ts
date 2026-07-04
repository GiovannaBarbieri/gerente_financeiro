import { prisma } from "../../shared/database/prisma.js";

export async function rememberFromQuestion(question: string) {
  const text = question.toLowerCase();
  const goalSignals = ["quero", "meta", "objetivo", "viajar", "comprar", "reserva", "carro", "casa"];
  if (!goalSignals.some((signal) => text.includes(signal))) return null;

  return prisma.aIMemory.create({
    data: {
      kind: "goal",
      content: question.slice(0, 500)
    }
  });
}

export async function listMemories() {
  return prisma.aIMemory.findMany({ where: { active: true }, orderBy: { updatedAt: "desc" } });
}
