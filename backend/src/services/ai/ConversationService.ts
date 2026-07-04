import { Prisma } from "@prisma/client";
import { prisma } from "../../shared/database/prisma.js";

export async function listConversations() {
  return prisma.aIConversation.findMany({
    include: { messages: { orderBy: { createdAt: "asc" }, take: 2 } },
    orderBy: { updatedAt: "desc" }
  });
}

export async function getConversation(id: string) {
  return prisma.aIConversation.findUniqueOrThrow({
    where: { id },
    include: { messages: { orderBy: { createdAt: "asc" } } }
  });
}

export async function ensureConversation(conversationId: string | undefined, question: string) {
  if (conversationId) return prisma.aIConversation.findUniqueOrThrow({ where: { id: conversationId } });
  return prisma.aIConversation.create({
    data: { title: question.slice(0, 70) || "Nova conversa" }
  });
}

export async function addMessage(conversationId: string, role: string, content: string, metadata?: Prisma.InputJsonObject) {
  return prisma.aIMessage.create({
    data: { conversationId, role, content, metadata }
  });
}
