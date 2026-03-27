import { z } from "zod";

export const createPublicationSchema = z.object({
  name: z.string().min(1, "Publication name is required").max(255),
  workflowId: z.string().min(1, "Workflow ID is required"),
});

export type CreatePublicationInput = z.infer<typeof createPublicationSchema>;
