import { SourceType } from "./NormalizationEngine.js";

type InferenceInput = {
  sourceType: SourceType;
  fileName?: string;
  institution?: string;
  accountName?: string;
  parserName?: string;
};

function hasNubankSignal(input: InferenceInput) {
  const text = [input.fileName, input.institution, input.accountName, input.parserName].filter(Boolean).join(" ").toLowerCase();
  return text.includes("nubank");
}

export function inferInstitution(input: InferenceInput) {
  if (input.institution?.trim()) return input.institution.trim();
  if (hasNubankSignal(input)) return "Nubank";
  return "Banco";
}

export function inferAccountName(input: InferenceInput) {
  if (input.accountName?.trim()) return input.accountName.trim();
  if (hasNubankSignal(input)) {
    return input.sourceType === "Cartao" ? "Nubank Credit" : "Nubank Conta Corrente";
  }
  return input.sourceType === "Cartao" ? "Cartao de Credito" : "Conta Corrente";
}
