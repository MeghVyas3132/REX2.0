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
  provider: z.enum(["gemini", "groq", "openai", "cohere"]),
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

export const upsertDomainConfigSchema = z.object({
  workflowId: z.string().uuid().optional(),
  domain: z.string().min(1).max(80).optional(),
  isActive: z.boolean().optional(),
  config: z.record(z.unknown()),
});

export const listModelsQuerySchema = z.object({
  provider: z.string().min(1).max(40).optional(),
  includeInactive: z
    .enum(["true", "false"])
    .transform((value) => value === "true")
    .optional(),
});

export const upsertModelSchema = z.object({
  provider: z.string().min(1).max(40),
  model: z.string().min(1).max(120),
  displayName: z.string().min(1).max(160),
  contextWindow: z.coerce.number().int().min(1).optional(),
  maxOutputTokens: z.coerce.number().int().min(1).optional(),
  supportsStreaming: z.boolean().optional(),
  supportsTools: z.boolean().optional(),
  qualityTier: z.enum(["fast", "standard", "premium"]).optional(),
  costInputPer1k: z.string().optional().nullable(),
  costOutputPer1k: z.string().optional().nullable(),
  capabilities: z.record(z.unknown()).optional(),
  metadata: z.record(z.unknown()).optional(),
  isActive: z.boolean().optional(),
});

export const kpiQuerySchema = z.object({
  days: z.coerce.number().int().min(1).max(90).default(7),
  latencyThresholdMs: z.coerce.number().int().min(100).max(120000).default(5000),
});

export const deleteMeSchema = z.object({
  confirmEmail: z.string().email(),
});

// Governance schemas
export const createWorkspaceSchema = z.object({
  name: z.string().min(1).max(255),
});

export const addWorkspaceMemberSchema = z.object({
  memberUserId: z.string().uuid(),
  role: z.enum(["admin", "editor", "viewer"]),
});

export const assignWorkflowWorkspaceSchema = z.object({
  workflowId: z.string().uuid(),
  workspaceId: z.string().uuid(),
});

export const workflowPermissionSchema = z.object({
  userId: z.string().uuid(),
  role: z.enum(["viewer", "editor"]),
  attributes: z.record(z.unknown()).optional(),
  expiresAt: z.string().datetime().nullable().optional(),
});

export const iamPolicySchema = z.object({
  id: z.string().uuid().optional(),
  userId: z.string().uuid().nullable().optional(),
  workflowId: z.string().uuid().nullable().optional(),
  action: z.string().min(1).max(40),
  effect: z.enum(["allow", "deny"]),
  conditions: z.record(z.unknown()).optional(),
  isActive: z.boolean().optional(),
});

export const listHyperparameterProfilesQuerySchema = z.object({
  workflowId: z.string().uuid().optional(),
});

export const upsertHyperparameterProfileSchema = z.object({
  id: z.string().uuid().optional(),
  workflowId: z.string().uuid().optional(),
  name: z.string().min(1).max(255),
  description: z.string().max(2048).optional(),
  config: z.record(z.unknown()),
  isDefault: z.boolean().optional(),
  isActive: z.boolean().optional(),
});

export const compareHyperparameterProfilesSchema = z.object({
  workflowId: z.string().uuid(),
  profileAId: z.string().uuid(),
  profileBId: z.string().uuid(),
});

export const upsertAlertRuleSchema = z.object({
  id: z.string().uuid().optional(),
  workflowId: z.string().uuid().nullable().optional(),
  ruleType: z.enum(["latency-breach", "guardrail-triggered", "corpus-health-alert"]),
  severity: z.enum(["warn", "critical"]).optional(),
  threshold: z.coerce.number().int().min(1).optional(),
  windowMinutes: z.coerce.number().int().min(1).max(7 * 24 * 60).optional(),
  config: z.record(z.unknown()).optional(),
  isActive: z.boolean().optional(),
});

export const listAlertEventsQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(500).default(100),
});

export const setConsentSchema = z.object({
  consentType: z.string().min(1).max(80),
  policyVersion: z.string().min(1).max(40),
  granted: z.boolean(),
  metadata: z.record(z.unknown()).optional(),
});

export const upsertRetentionPolicySchema = z.object({
  id: z.string().uuid().optional(),
  resourceType: z.enum([
    "executions",
    "knowledge_documents",
    "guardrail_events",
    "audit_logs",
    "alert_events",
  ]),
  retentionDays: z.coerce.number().int().min(1).max(3650),
  config: z.record(z.unknown()).optional(),
  isActive: z.boolean().optional(),
});

// Publication schemas
export const createPublicationSchema = z.object({
  workflowId: z.string().uuid(),
  title: z.string().min(1).max(255),
  description: z.string().max(4000).optional(),
  icon: z.string().max(80).optional(),
  inputSchema: z.record(z.unknown()),
  outputDisplay: z.record(z.unknown()),
  category: z.string().max(100).optional(),
  tags: z.array(z.string().min(1).max(80)).max(50).optional(),
});

export const updatePublicationSchema = createPublicationSchema.partial().omit({ workflowId: true });

export const executePublicationSchema = z.object({
  inputs: z.record(z.unknown()).default({}),
});

// Legal basis schemas
export const setWorkflowLegalBasisSchema = z.object({
  workflowId: z.string().uuid(),
  gdprBasis: z
    .enum([
      "consent",
      "legitimate_interest",
      "contract",
      "legal_obligation",
      "vital_interests",
      "public_task",
    ])
    .nullable()
    .optional(),
  dpdpBasis: z
    .enum(["consent", "legitimate_use", "legal_obligation", "medical_emergency"])
    .nullable()
    .optional(),
  purposeDescription: z.string().min(1).max(4000),
  dataCategories: z.array(z.string().min(1).max(120)).max(100).default([]),
  crossBorderTransfer: z.boolean().optional(),
  transferSafeguards: z.string().max(4000).nullable().optional(),
  retentionDays: z.coerce.number().int().min(1).max(3650).nullable().optional(),
});

// Data subject request schemas
export const createDataSubjectRequestSchema = z.object({
  requestType: z.enum([
    "access",
    "rectification",
    "erasure",
    "restriction",
    "portability",
    "objection",
  ]),
  description: z.string().min(1).max(4000),
  dueDate: z.string().datetime().optional(),
});

export const respondDataSubjectRequestSchema = z.object({
  status: z.enum(["in_progress", "completed", "rejected"]),
  response: z.string().max(8000).optional(),
});
