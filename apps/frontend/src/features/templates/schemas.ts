import { z } from "zod";

export const createTemplateSchema = z.object({
  name: z.string().min(1, "Template name is required").max(255),
  description: z.string().max(1000).optional(),
  workflowId: z.string().min(1, "Workflow ID is required"),
});

export type CreateTemplateInput = z.infer<typeof createTemplateSchema>;
