// ──────────────────────────────────────────────
// REX - Structured Logger (Pino)
// ──────────────────────────────────────────────

import pino from "pino";
import { randomUUID } from "node:crypto";

const LOG_LEVEL = process.env["LOG_LEVEL"] ?? "info";

export const rootLogger = pino({
  level: LOG_LEVEL,
  timestamp: pino.stdTimeFunctions.isoTime,
  formatters: {
    level(label: string) {
      return { level: label };
    },
  },
  redact: {
    paths: [
      "apiKey",
      "password",
      "passwordHash",
      "encryptedKey",
      "authorization",
      "cookie",
    ],
    censor: "[REDACTED]",
  },
});

export function createLogger(module: string, extra?: Record<string, unknown>): pino.Logger {
  return rootLogger.child({ module, ...extra });
}

export function createCorrelationId(): string {
  return randomUUID();
}

export function createExecutionLogger(
  executionId: string,
  workflowId: string,
  correlationId: string
): pino.Logger {
  return rootLogger.child({
    module: "execution",
    executionId,
    workflowId,
    correlationId,
  });
}
