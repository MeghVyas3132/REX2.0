// ──────────────────────────────────────────────
// REX - Node Types
// ──────────────────────────────────────────────

import type { ExecutionContextPatch, ExecutionContextState } from "./execution.js";
import type {
  RuntimeKnowledgeNodeQueryInput,
  RuntimeKnowledgeQueryResult,
  RuntimeKnowledgeNodeIngestionInput,
  RuntimeKnowledgeIngestionResult,
} from "./knowledge.js";

export interface NodeExecutionContext {
  executionId: string;
  workflowId: string;
  userId: string;
  correlationId: string;
  nodeId: string;
  logger: NodeLogger;
  getApiKey: (provider: LLMProviderType) => Promise<string>;
  getExecutionContext: () => Readonly<ExecutionContextState>;
  updateExecutionContext: (patch: ExecutionContextPatch) => void;
  getMemory: <T = unknown>(key: string) => T | undefined;
  setMemory: (key: string, value: unknown) => void;
  retrieveKnowledge?: (
    query: RuntimeKnowledgeNodeQueryInput
  ) => Promise<RuntimeKnowledgeQueryResult>;
  ingestKnowledge?: (
    input: RuntimeKnowledgeNodeIngestionInput
  ) => Promise<RuntimeKnowledgeIngestionResult>;
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
  | "file-upload"
  | "memory-write"
  | "memory-read"
  | "execution-control"
  | "evaluation"
  | "knowledge-ingest"
  | "knowledge-retrieve";

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
  "memory-write",
  "memory-read",
  "execution-control",
  "evaluation",
  "knowledge-ingest",
  "knowledge-retrieve",
];

export type LLMProviderType = "gemini" | "groq";

export const LLM_PROVIDERS: LLMProviderType[] = ["gemini", "groq"];
