// ──────────────────────────────────────────────
// REX - Zod Validation Schemas
// ──────────────────────────────────────────────

import { z } from "zod";

// Auth schemas
export const registerSchema = z.object({
  email: z.string().email("Invalid email address"),
  name: z.string().min(2, "Name must be at least 2 characters").max(255),
  password: z.string().min(8, "Password must be at least 8 characters").max(128),
});

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

// API Key schemas
export const createApiKeySchema = z.object({
  provider: z.enum(["gemini", "groq"]),
  key: z.string().min(10, "API key must be at least 10 characters"),
  label: z.string().min(1, "Label is required").max(255),
});

// Workflow schemas
export const workflowNodeSchema = z.object({
  id: z.string().uuid(),
  type: z.string().min(1),
  label: z.string().min(1),
  position: z.object({
    x: z.number(),
    y: z.number(),
  }),
  config: z.record(z.unknown()),
});

export const workflowEdgeSchema = z.object({
  id: z.string().uuid(),
  source: z.string().uuid(),
  target: z.string().uuid(),
  condition: z.union([z.string().min(1), z.boolean()]).optional(),
});

const workflowTemplateRuntimeParamsSchema = z.object({
  queryPath: z.string().min(1).max(255).optional(),
  topK: z.coerce.number().int().min(1).max(50).optional(),
  corpusId: z.string().uuid().optional(),
  scopeType: z.enum(["user", "workflow", "execution"]).optional(),
  workflowId: z.string().uuid().optional(),
  executionId: z.string().uuid().optional(),
}).strict().superRefine((value, ctx) => {
  if (value.scopeType === "workflow" && !value.workflowId) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["workflowId"],
      message: "workflowId is required when scopeType is workflow",
    });
  }
  if (value.scopeType === "execution" && !value.executionId) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["executionId"],
      message: "executionId is required when scopeType is execution",
    });
  }
});

export const createWorkflowSchema = z.object({
  name: z.string().min(1, "Name is required").max(255),
  description: z.string().max(2048).default(""),
  nodes: z.array(workflowNodeSchema).min(1, "At least one node is required"),
  edges: z.array(workflowEdgeSchema).default([]),
});

export const updateWorkflowSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  description: z.string().max(2048).optional(),
  status: z.enum(["active", "inactive"]).optional(),
  nodes: z.array(workflowNodeSchema).min(1).optional(),
  edges: z.array(workflowEdgeSchema).optional(),
});

export const instantiateWorkflowTemplateSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  description: z.string().max(2048).optional(),
  params: workflowTemplateRuntimeParamsSchema.optional(),
});

// Execution schemas
export const triggerWorkflowSchema = z.object({
  payload: z.record(z.unknown()).default({}),
});

// Knowledge schemas
export const createKnowledgeCorpusSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().max(2048).optional(),
  scopeType: z.enum(["user", "workflow", "execution"]).default("user"),
  workflowId: z.string().uuid().optional(),
  executionId: z.string().uuid().optional(),
  metadata: z.record(z.unknown()).optional(),
}).superRefine((value, ctx) => {
  if (value.scopeType === "workflow" && !value.workflowId) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["workflowId"],
      message: "workflowId is required when scopeType is workflow",
    });
  }
  if (value.scopeType === "execution" && !value.executionId) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["executionId"],
      message: "executionId is required when scopeType is execution",
    });
  }
});

export const ingestKnowledgeDocumentSchema = z.object({
  corpusId: z.string().uuid(),
  title: z.string().min(1).max(255),
  contentText: z.string().min(1, "contentText is required"),
  sourceType: z.enum(["upload", "inline", "api"]).default("upload"),
  mimeType: z.string().max(100).optional(),
  metadata: z.record(z.unknown()).optional(),
});

export const listKnowledgeCorporaQuerySchema = z.object({
  scopeType: z.enum(["user", "workflow", "execution"]).optional(),
  workflowId: z.string().uuid().optional(),
  executionId: z.string().uuid().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export const listKnowledgeDocumentsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export const listKnowledgeChunksQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(200).default(50),
});

export const queryKnowledgeSchema = z.object({
  query: z.string().min(1, "query is required"),
  topK: z.coerce.number().int().min(1).max(50).default(8),
  corpusId: z.string().uuid().optional(),
  scopeType: z.enum(["user", "workflow", "execution"]).optional(),
  workflowId: z.string().uuid().optional(),
  executionId: z.string().uuid().optional(),
}).superRefine((value, ctx) => {
  if (value.scopeType === "workflow" && !value.workflowId) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["workflowId"],
      message: "workflowId is required when scopeType is workflow",
    });
  }
  if (value.scopeType === "execution" && !value.executionId) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["executionId"],
      message: "executionId is required when scopeType is execution",
    });
  }
});

export const listExecutionRetrievalEventsQuerySchema = z.object({
  nodeId: z.string().min(1).max(255).optional(),
  status: z.enum(["success", "empty", "failed"]).optional(),
  strategy: z
    .enum(["single", "merge", "first-non-empty", "best-score", "adaptive"])
    .optional(),
  retrieverKey: z.string().min(1).max(100).optional(),
  selected: z
    .enum(["true", "false"])
    .transform((value) => value === "true")
    .optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(200).default(50),
});

export const listExecutionStepAttemptsQuerySchema = z.object({
  nodeId: z.string().min(1).max(255).optional(),
  status: z.enum(["completed", "retry", "failed"]).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(200).default(50),
});

export const listExecutionContextSnapshotsQuerySchema = z.object({
  reason: z.enum(["init", "step", "final", "error"]).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(200).default(50),
});

// Pagination
export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});
