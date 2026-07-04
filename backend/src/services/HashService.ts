import { fingerprint } from "../shared/utils/format.js";

export function createStrictHash(parts: {
  transactionDate: Date;
  amount: number;
  originalDescription: string;
  institution: string;
  accountName: string;
}) {
  return fingerprint([parts.transactionDate, parts.amount, parts.originalDescription, parts.institution, parts.accountName]);
}

export function createSoftHash(parts: {
  transactionDate: Date;
  amount: number;
  normalizedDescription: string;
  personCompany: string;
}) {
  return fingerprint([parts.transactionDate, parts.amount, parts.normalizedDescription, parts.personCompany]);
}

export function createRawHash(parts: {
  importBatchId: number;
  sourceType: string;
  institution: string;
  originalRowNumber: number;
  rawJson: unknown;
}) {
  return fingerprint([parts.importBatchId, parts.sourceType, parts.institution, parts.originalRowNumber, JSON.stringify(parts.rawJson)]);
}
