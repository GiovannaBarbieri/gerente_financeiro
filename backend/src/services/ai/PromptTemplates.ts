export type PromptIntent = "summary" | "spending" | "planning" | "investment" | "saving" | "comparison" | "forecast" | "explanation";

export const promptTemplates: Record<PromptIntent, string> = {
  summary: "Explique a situação financeira de forma objetiva, destacando saldo, receitas, despesas e riscos.",
  spending: "Analise gastos, categorias que cresceram, despesas reduzíveis e padrões de consumo.",
  planning: "Ajude a planejar um objetivo financeiro com metas mensais e impacto no orçamento.",
  investment: "Explique quanto sobra e como pensar em reserva/investimentos sem recomendar produto específico.",
  saving: "Sugira economias realistas com base nas maiores despesas e recorrências.",
  comparison: "Compare períodos, categorias, cartões ou contas usando variações e valores.",
  forecast: "Projete cenários simples usando média histórica e próximos vencimentos.",
  explanation: "Responda a pergunta usando apenas o contexto financeiro resumido."
};

export function detectIntent(question: string): PromptIntent {
  const text = question.toLowerCase();
  if (/(viajar|carro|casa|reserva|planej)/.test(text)) return "planning";
  if (/(invest|guardar|sobra|economizar por mes|economizar por mês)/.test(text)) return "investment";
  if (/(reduzir|cancelar|economizar|desnecess)/.test(text)) return "saving";
  if (/(compar|aument|redu|mudou|ano passado|mes anterior|mês anterior)/.test(text)) return "comparison";
  if (/(e se|simul|cenar|previs|projet)/.test(text)) return "forecast";
  if (/(gastei|gasto|categoria|uber|cartao|cartão|assinatura)/.test(text)) return "spending";
  if (/(resumo|situa|saldo|receita|despesa)/.test(text)) return "summary";
  return "explanation";
}
