import { FinancialContext } from "./FinancialContextService.js";

export function compressContext(context: FinancialContext, limit = 6000) {
  const summary = JSON.stringify(context, (_key, value) => {
    if (Array.isArray(value) && value.length > 12) return value.slice(0, 12);
    return value;
  });

  if (summary.length <= limit) return summary;
  return `${summary.slice(0, limit)}\n[contexto resumido por limite de tamanho]`;
}
