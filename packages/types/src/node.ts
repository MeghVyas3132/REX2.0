// ──────────────────────────────────────────────
// REX - Node Types
// ──────────────────────────────────────────────

export interface NodeExecutionContext {
  executionId: string;
  workflowId: string;
  userId: string;
  correlationId: string;
  nodeId: string;
  logger: NodeLogger;
  getApiKey: (provider: LLMProviderType) => Promise<string>;
}

export interface NodeLogger {
  info: (message: string, data?: Record<string, unknown>) => void;
  warn: (message: string, data?: Record<string, unknown>) => void;
  error: (message: string, data?: Record<string, unknown>) => void;
  debug: (message: string, data?: Record<string, unknown>) => void;
}

export interface NodeInput {
  data: Record<string, unknown>;
  metadata?: Record<string, unknown>;
}

export interface NodeOutput {
  data: Record<string, unknown>;
  metadata?: Record<string, unknown>;
}

export interface BaseNodeDefinition {
  type: string;
  validate: (config: Record<string, unknown>) => ValidationResult;
  execute: (input: NodeInput, context: NodeExecutionContext) => Promise<NodeOutput>;
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

export type NodeType =
  | "webhook-trigger"
  | "manual-trigger"
  | "schedule-trigger"
  | "data-cleaner"
  | "llm"
  | "json-validator"
  | "storage"
  | "log"
  | "http-request"
  | "condition"
  | "code"
  | "transformer"
  | "output"
  | "file-upload";

export const NODE_TYPES: NodeType[] = [
  "webhook-trigger",
  "manual-trigger",
  "schedule-trigger",
  "data-cleaner",
  "llm",
  "json-validator",
  "storage",
  "log",
  "http-request",
  "condition",
  "code",
  "transformer",
  "output",
  "file-upload",
];

export type LLMProviderType = "gemini" | "groq";

export const LLM_PROVIDERS: LLMProviderType[] = ["gemini", "groq"];
