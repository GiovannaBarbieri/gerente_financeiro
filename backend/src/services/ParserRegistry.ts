import type { GenericRow } from "./FileParserService.js";
import type { SourceType } from "./NormalizationEngine.js";
import type { ParserContext } from "./Parsers.js";

export type ParserRegistryItem = {
  name: "NubankAccountParser" | "NubankCreditCardParser" | "GenericAccountParser" | "GenericCreditCardParser";
  institution: string;
  priority: number;
  supportedTypes: SourceType[];
  canParse: (rows: GenericRow[], context: ParserContext) => boolean;
};

function hasInstitution(context: ParserContext, institution: string) {
  return (context.institution ?? "").toLowerCase().includes(institution.toLowerCase());
}

export const parserRegistry: ParserRegistryItem[] = [
  {
    name: "NubankAccountParser",
    institution: "Nubank",
    priority: 10,
    supportedTypes: ["Conta"],
    canParse: (_rows, context) => context.sourceType === "Conta" && hasInstitution(context, "nubank")
  },
  {
    name: "NubankCreditCardParser",
    institution: "Nubank",
    priority: 10,
    supportedTypes: ["Cartao"],
    canParse: (_rows, context) => context.sourceType === "Cartao" && hasInstitution(context, "nubank")
  },
  {
    name: "GenericAccountParser",
    institution: "Outros",
    priority: 100,
    supportedTypes: ["Conta"],
    canParse: (_rows, context) => context.sourceType === "Conta"
  },
  {
    name: "GenericCreditCardParser",
    institution: "Outros",
    priority: 100,
    supportedTypes: ["Cartao"],
    canParse: (_rows, context) => context.sourceType === "Cartao"
  }
];
