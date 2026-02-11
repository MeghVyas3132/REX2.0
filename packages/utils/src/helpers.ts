// ──────────────────────────────────────────────
// REX - Utility Helpers
// ──────────────────────────────────────────────

import { randomUUID } from "node:crypto";

export function generateId(): string {
  return randomUUID();
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function safeJsonParse(text: string): { success: true; data: unknown } | { success: false; error: string } {
  try {
    return { success: true, data: JSON.parse(text) };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Invalid JSON" };
  }
}

export function truncateString(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str;
  return str.slice(0, maxLength - 3) + "...";
}

export function measureDuration(startTime: bigint): number {
  const duration = process.hrtime.bigint() - startTime;
  return Number(duration / 1_000_000n); // Convert nanoseconds to milliseconds
}

export function startTimer(): bigint {
  return process.hrtime.bigint();
}

export function sanitizeErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    // Strip potential API key leaks from error messages
    return error.message
      .replace(/key[=:]\s*["']?[a-zA-Z0-9_-]{20,}["']?/gi, "key=[REDACTED]")
      .replace(/Bearer\s+[a-zA-Z0-9._-]+/gi, "Bearer [REDACTED]");
  }
  return "An unexpected error occurred";
}

export function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

export function omitKeys<T extends Record<string, unknown>>(
  obj: T,
  keys: string[]
): Partial<T> {
  const result = { ...obj };
  for (const key of keys) {
    delete result[key];
  }
  return result;
}
