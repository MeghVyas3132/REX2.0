import { z } from "zod";

export const workflowStatusSchema = z.enum(["draft", "active", "paused", "archived"]);

export const createWorkflowSchema = z.object({
  name: z.string().min(1, "Workflow name is required").max(255),
  description: z.string().max(2_000).optional(),
  status: workflowStatusSchema.default("draft"),
  definition: z.record(z.unknown()).optional(),
});

export const updateWorkflowSchema = createWorkflowSchema.partial().extend({
  nodes: z.array(z.any()).optional(),
  edges: z.array(z.any()).optional(),
});

export const executeWorkflowSchema = z.object({
  inputs: z.record(z.unknown()).optional(),
  dryRun: z.boolean().optional(),
});

export type CreateWorkflowInput = z.infer<typeof createWorkflowSchema>;
export type UpdateWorkflowInput = z.infer<typeof updateWorkflowSchema>;
export type ExecuteWorkflowInput = z.infer<typeof executeWorkflowSchema>;
