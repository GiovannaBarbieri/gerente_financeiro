import { compressContext } from "./ContextCompressor.js";
import { FinancialContext } from "./FinancialContextService.js";
import { detectIntent, promptTemplates } from "./PromptTemplates.js";

export function buildPrompt(question: string, context: FinancialContext, contextLimit: number) {
  const intent = detectIntent(question);
  return {
    intent,
    system: [
      "Voce e um Assistente Financeiro pessoal.",
      "Use somente o contexto financeiro resumido fornecido.",
      "Nao invente dados e nao afirme informacoes ausentes.",
      "Responda em portugues do Brasil, com orientacoes praticas.",
      "Nao forneca recomendacao de investimento especifica; explique cenarios e cuidados."
    ].join("\n"),
    user: [
      `Tarefa: ${promptTemplates[intent]}`,
      `Pergunta do usuario: ${question}`,
      "Contexto financeiro resumido:",
      compressContext(context, contextLimit)
    ].join("\n\n")
  };
}
