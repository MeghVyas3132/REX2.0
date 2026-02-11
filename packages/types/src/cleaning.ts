// ──────────────────────────────────────────────
// REX - Data Cleaning Types
// ──────────────────────────────────────────────

export type CleaningOperation =
  | "trim"
  | "normalize-case"
  | "remove-special-chars"
  | "remove-duplicates"
  | "validate-json"
  | "mask-pii";

export type CaseType = "lowercase" | "uppercase" | "titlecase";

export interface CleaningConfig {
  operations: CleaningOperation[];
  caseType?: CaseType;
  customPattern?: string;
}

export interface CleaningResult {
  original: unknown;
  cleaned: unknown;
  operationsApplied: CleaningOperation[];
  piiFound?: PIIMatch[];
}

export interface PIIMatch {
  type: "email" | "phone" | "credit-card";
  original: string;
  masked: string;
  position: number;
}
