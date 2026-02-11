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

// Execution schemas
export const triggerWorkflowSchema = z.object({
  payload: z.record(z.unknown()).default({}),
});

// Pagination
export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});
