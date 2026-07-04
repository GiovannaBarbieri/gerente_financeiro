import { FinancialContext } from "./FinancialContextService.js";

export type AIProviderRequest = {
  system: string;
  user: string;
  question: string;
  context: FinancialContext;
  model: string;
  temperature: number;
};

export interface AIProvider {
  name: string;
  complete(request: AIProviderRequest): Promise<string>;
}

export class LocalFinanceProvider implements AIProvider {
  name = "local";

  async complete(request: AIProviderRequest) {
    const dashboard = request.context.summary as any;
    const summary = dashboard.summary ?? [];
    const indicators = dashboard.indicators ?? {};
    const categories = dashboard.categories ?? {};
    const cards = dashboard.creditCards ?? [];
    const recommendations = request.context.recommendations ?? [];
    const get = (key: string) => summary.find((item: any) => item.key === key)?.value ?? 0;

    const lines = [
      "Analisei seus dados consolidados e encontrei estes pontos principais:",
      "",
      `- Saldo atual: ${money(get("saldoAtual"))}.`,
      `- Receitas do periodo: ${money(get("receitas"))}.`,
      `- Despesas do periodo: ${money(get("despesas"))}.`,
      `- Resultado do mes: ${money(get("resultado"))}.`,
      `- Ticket medio de despesa: ${money(indicators.averageTicket ?? 0)}.`,
      `- Gasto medio diario: ${money(indicators.dailyAverageExpense ?? 0)}.`,
      "",
      "Leitura do comportamento:"
    ];

    if (categories.biggest) lines.push(`- A categoria que mais consumiu dinheiro foi ${categories.biggest.name}, com ${money(categories.biggest.amount)}.`);
    if (categories.growth?.variation > 0) lines.push(`- A maior alta foi em ${categories.growth.name}, com variacao de ${categories.growth.variation}%.`);
    const mostUsedCard = cards.slice().sort((a: any, b: any) => b.used - a.used)[0];
    if (mostUsedCard) lines.push(`- O cartao mais utilizado foi ${mostUsedCard.name}, com ${money(mostUsedCard.used)} em aberto/uso.`);

    if (recommendations.length) {
      lines.push("", "Recomendacoes:");
      for (const item of recommendations.slice(0, 4)) {
        lines.push(`- ${item.title}: ${item.message}${item.impact ? ` Impacto estimado: ${money(item.impact)}.` : ""}`);
      }
    }

    lines.push("", "Proximo passo sugerido: revise as maiores categorias e defina uma meta mensal para a categoria com maior crescimento.");
    return lines.join("\n");
  }
}

export function createProvider(provider: string) {
  switch (provider) {
    case "openai":
    case "claude":
    case "gemini":
    case "ollama":
    case "lmstudio":
    case "azure-openai":
      return new LocalFinanceProvider();
    default:
      return new LocalFinanceProvider();
  }
}

function money(value: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(value || 0));
}
