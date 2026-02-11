// ──────────────────────────────────────────────
// REX - Data Cleaning Module
// ──────────────────────────────────────────────

import type {
  CleaningConfig,
  CleaningOperation,
  CleaningResult,
  CaseType,
  PIIMatch,
} from "@rex/types";

// PII Patterns
const EMAIL_PATTERN = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
const PHONE_PATTERN = /(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g;
const CREDIT_CARD_PATTERN = /\b(?:\d{4}[-\s]?){3}\d{4}\b/g;

function trimValue(value: unknown): unknown {
  if (typeof value === "string") {
    return value.trim();
  }
  if (Array.isArray(value)) {
    return value.map(trimValue);
  }
  if (value !== null && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([k, v]) => [k, trimValue(v)])
    );
  }
  return value;
}

function normalizeCase(value: unknown, caseType: CaseType): unknown {
  if (typeof value === "string") {
    switch (caseType) {
      case "lowercase":
        return value.toLowerCase();
      case "uppercase":
        return value.toUpperCase();
      case "titlecase":
        return value.replace(
          /\w\S*/g,
          (txt) => txt.charAt(0).toUpperCase() + txt.slice(1).toLowerCase()
        );
    }
  }
  if (Array.isArray(value)) {
    return value.map((v) => normalizeCase(v, caseType));
  }
  if (value !== null && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([k, v]) => [
        k,
        normalizeCase(v, caseType),
      ])
    );
  }
  return value;
}

function removeSpecialChars(value: unknown): unknown {
  if (typeof value === "string") {
    return value.replace(/[^a-zA-Z0-9\s.,!?@#$%&*()\-_=+[\]{}|;:'"<>/\\]/g, "");
  }
  if (Array.isArray(value)) {
    return value.map(removeSpecialChars);
  }
  if (value !== null && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([k, v]) => [
        k,
        removeSpecialChars(v),
      ])
    );
  }
  return value;
}

function removeDuplicates(value: unknown): unknown {
  if (Array.isArray(value)) {
    const seen = new Set<string>();
    return value.filter((item) => {
      const key = JSON.stringify(item);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }
  return value;
}

function validateJson(value: unknown): { valid: boolean; error?: string } {
  if (typeof value === "string") {
    try {
      JSON.parse(value);
      return { valid: true };
    } catch (err) {
      return {
        valid: false,
        error: err instanceof Error ? err.message : "Invalid JSON",
      };
    }
  }
  if (typeof value === "object" && value !== null) {
    return { valid: true };
  }
  return { valid: false, error: "Value is not a JSON object or string" };
}

function maskPII(value: unknown): { result: unknown; matches: PIIMatch[] } {
  const matches: PIIMatch[] = [];

  if (typeof value === "string") {
    let masked = value;

    // Mask emails
    const emailMatches = value.matchAll(EMAIL_PATTERN);
    for (const match of emailMatches) {
      const original = match[0];
      const maskedValue = original.replace(/(.{2})(.*)(@.*)/, "$1***$3");
      matches.push({
        type: "email",
        original,
        masked: maskedValue,
        position: match.index ?? 0,
      });
      masked = masked.replace(original, maskedValue);
    }

    // Mask phone numbers
    const phoneMatches = value.matchAll(PHONE_PATTERN);
    for (const match of phoneMatches) {
      const original = match[0];
      const maskedValue = original.replace(/\d(?=\d{4})/g, "*");
      matches.push({
        type: "phone",
        original,
        masked: maskedValue,
        position: match.index ?? 0,
      });
      masked = masked.replace(original, maskedValue);
    }

    // Mask credit cards
    const ccMatches = value.matchAll(CREDIT_CARD_PATTERN);
    for (const match of ccMatches) {
      const original = match[0];
      const digitsOnly = original.replace(/[-\s]/g, "");
      const maskedValue = `****-****-****-${digitsOnly.slice(-4)}`;
      matches.push({
        type: "credit-card",
        original,
        masked: maskedValue,
        position: match.index ?? 0,
      });
      masked = masked.replace(original, maskedValue);
    }

    return { result: masked, matches };
  }

  if (Array.isArray(value)) {
    const results = value.map((v) => maskPII(v));
    return {
      result: results.map((r) => r.result),
      matches: results.flatMap((r) => r.matches),
    };
  }

  if (value !== null && typeof value === "object") {
    const entries = Object.entries(value as Record<string, unknown>);
    const processedEntries: [string, unknown][] = [];
    const allMatches: PIIMatch[] = [];

    for (const [key, val] of entries) {
      const { result, matches: entryMatches } = maskPII(val);
      processedEntries.push([key, result]);
      allMatches.push(...entryMatches);
    }

    return {
      result: Object.fromEntries(processedEntries),
      matches: allMatches,
    };
  }

  return { result: value, matches: [] };
}

export function cleanData(data: unknown, config: CleaningConfig): CleaningResult {
  let cleaned = data;
  const appliedOperations: CleaningOperation[] = [];
  let piiMatches: PIIMatch[] = [];

  for (const operation of config.operations) {
    switch (operation) {
      case "trim":
        cleaned = trimValue(cleaned);
        appliedOperations.push("trim");
        break;

      case "normalize-case":
        cleaned = normalizeCase(cleaned, config.caseType ?? "lowercase");
        appliedOperations.push("normalize-case");
        break;

      case "remove-special-chars":
        cleaned = removeSpecialChars(cleaned);
        appliedOperations.push("remove-special-chars");
        break;

      case "remove-duplicates":
        cleaned = removeDuplicates(cleaned);
        appliedOperations.push("remove-duplicates");
        break;

      case "validate-json": {
        const validation = validateJson(cleaned);
        if (!validation.valid) {
          throw new Error(`JSON validation failed: ${validation.error}`);
        }
        appliedOperations.push("validate-json");
        break;
      }

      case "mask-pii": {
        const piiResult = maskPII(cleaned);
        cleaned = piiResult.result;
        piiMatches = piiResult.matches;
        appliedOperations.push("mask-pii");
        break;
      }
    }
  }

  return {
    original: data,
    cleaned,
    operationsApplied: appliedOperations,
    piiFound: piiMatches.length > 0 ? piiMatches : undefined,
  };
}
