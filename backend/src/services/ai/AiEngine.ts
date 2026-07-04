import { Prisma } from "@prisma/client";
import { prisma } from "../../shared/database/prisma.js";
import { createProvider } from "./AiProvider.js";
import { addMessage, ensureConversation, getConversation, listConversations } from "./ConversationService.js";
import { buildFinancialContext } from "./FinancialContextService.js";
import { rememberFromQuestion } from "./MemoryService.js";
import { buildPrompt } from "./PromptBuilder.js";
import { formatAIResponse } from "./ResponseFormatter.js";

export async function getAISettings() {
  const existing = await prisma.aISetting.findFirst({ orderBy: { id: "asc" } });
  if (existing) return existing;
  return prisma.aISetting.create({ data: {} });
}

export async function updateAISettings(data: Record<string, unknown>) {
  const current = await getAISettings();
  return prisma.aISetting.update({
    where: { id: current.id },
    data: {
      provider: data.provider ? String(data.provider) : current.provider,
      model: data.model ? String(data.model) : current.model,
      temperature: data.temperature !== undefined ? new Prisma.Decimal(Number(data.temperature)) : current.temperature,
      language: data.language ? String(data.language) : current.language,
      contextLimit: data.contextLimit ? Number(data.contextLimit) : current.contextLimit,
      apiKeyMasked: data.apiKey ? maskKey(String(data.apiKey)) : current.apiKeyMasked
    }
  });
}

export async function chatWithAI(input: { conversationId?: string; message: string }) {
  const settings = await getAISettings();
  const conversation = await ensureConversation(input.conversationId, input.message);
  await addMessage(conversation.id, "user", input.message);

  const context = await buildFinancialContext();
  const prompt = buildPrompt(input.message, context, settings.contextLimit);
  const provider = createProvider(settings.provider);
  const raw = await provider.complete({
    system: prompt.system,
    user: prompt.user,
    question: input.message,
    context,
    model: settings.model,
    temperature: Number(settings.temperature)
  });
  const answer = formatAIResponse(raw);
  await addMessage(conversation.id, "assistant", answer, {
    provider: provider.name,
    model: settings.model,
    intent: prompt.intent,
    privacy: context.privacy
  });
  await rememberFromQuestion(input.message);

  return {
    conversationId: conversation.id,
    answer,
    intent: prompt.intent,
    provider: provider.name,
    contextPrivacy: context.privacy
  };
}

export { buildFinancialContext as getAIContext, listConversations, getConversation };

function maskKey(key: string) {
  if (key.length <= 8) return "********";
  return `${key.slice(0, 4)}...${key.slice(-4)}`;
}
