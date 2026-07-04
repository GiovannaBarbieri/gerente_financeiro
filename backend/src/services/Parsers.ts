import { GenericRow, pick } from "./FileParserService.js";
import { inferPaymentMethod, inferTransactionType, ParsedTransaction, SourceType } from "./NormalizationEngine.js";
import { parseAmount, parseDate } from "../shared/utils/format.js";
import { parserRegistry } from "./ParserRegistry.js";

export type ParserContext = {
  sourceType: SourceType;
  institution?: string;
  accountName?: string;
  invoiceCompetence?: string;
};

export interface BankParser {
  name: string;
  sourceType: SourceType;
  parse(rows: GenericRow[], context: ParserContext): ParsedTransaction[];
}

function readDescription(row: GenericRow) {
  return String(pick(row, ["descricao", "description", "titulo", "lancamento", "historico", "estabelecimento"]) ?? "").trim();
}

function readDate(row: GenericRow, sourceType: SourceType) {
  const candidates =
    sourceType === "Cartao"
      ? ["data_compra", "data", "data da compra", "date", "transaction date"]
      : ["data_movimentacao", "data", "data da movimentacao", "date", "transaction date"];
  return parseDate(pick(row, candidates));
}

function readAmount(row: GenericRow) {
  return parseAmount(pick(row, ["valor", "amount", "value", "valor original"]));
}

function readInstallments(row: GenericRow) {
  const text = String(pick(row, ["parcela", "parcelamento", "installment"]) ?? "");
  const match = text.match(/(\d+)\s*\/\s*(\d+)/);
  return {
    installment: match ? Number(match[1]) : undefined,
    totalInstallments: match ? Number(match[2]) : undefined
  };
}

function readCardName(row: GenericRow, context: ParserContext) {
  return String(pick(row, ["cartao", "card", "nome do cartao"]) ?? context.accountName ?? "Cartao de Credito").trim();
}

function readCompetence(row: GenericRow, context: ParserContext) {
  return String(pick(row, ["competencia", "fatura", "invoice", "invoice month"]) ?? context.invoiceCompetence ?? "").trim();
}

export class GenericAccountParser implements BankParser {
  name = "GenericAccountParser";
  sourceType: SourceType = "Conta";

  parse(rows: GenericRow[], context: ParserContext): ParsedTransaction[] {
    return rows.map((row) => {
      const originalDescription = readDescription(row);
      const amount = readAmount(row);
      return {
        transactionDate: readDate(row, "Conta"),
        sourceType: "Conta",
        institution: context.institution ?? "Banco",
        accountName: context.accountName ?? "Conta Corrente",
        transactionType: inferTransactionType(originalDescription, amount, "Conta"),
        originalDescription,
        amount,
        paymentMethod: String(pick(row, ["tipo_movimentacao", "origem_dados"]) ?? inferPaymentMethod(originalDescription, "Conta"))
      };
    });
  }
}

export class GenericCreditCardParser implements BankParser {
  name = "GenericCreditCardParser";
  sourceType: SourceType = "Cartao";

  parse(rows: GenericRow[], context: ParserContext): ParsedTransaction[] {
    return rows.map((row) => {
      const originalDescription = readDescription(row);
      const amount = readAmount(row);
      const installments = readInstallments(row);
      const cardName = readCardName(row, context);
      const competence = readCompetence(row, context);
      return {
        transactionDate: readDate(row, "Cartao"),
        sourceType: "Cartao",
        institution: context.institution ?? "Banco",
        accountName: cardName,
        cardName,
        transactionType: inferTransactionType(originalDescription, amount, "Cartao"),
        originalDescription,
        amount,
        paymentMethod: inferPaymentMethod(originalDescription, "Cartao"),
        ...installments,
        notes: competence ? `Fatura: ${competence}` : undefined
      };
    });
  }
}

export class NubankAccountParser extends GenericAccountParser {
  name = "NubankAccountParser";
}

export class NubankCreditCardParser extends GenericCreditCardParser {
  name = "NubankCreditCardParser";
}

function createParser(name: string) {
  if (name === "NubankAccountParser") return new NubankAccountParser();
  if (name === "NubankCreditCardParser") return new NubankCreditCardParser();
  if (name === "GenericCreditCardParser") return new GenericCreditCardParser();
  return new GenericAccountParser();
}

export function identifyParser(rows: GenericRow[], context: ParserContext): BankParser {
  const selected = parserRegistry
    .filter((item) => item.supportedTypes.includes(context.sourceType))
    .sort((a, b) => a.priority - b.priority)
    .find((item) => item.canParse(rows, context));

  return createParser(selected?.name ?? (context.sourceType === "Conta" ? "GenericAccountParser" : "GenericCreditCardParser"));
}
