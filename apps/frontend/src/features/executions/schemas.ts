import { z } from "zod";

export const executionStatusSchema = z.enum([
  "pending",
  "running",
  "completed",
  "failed",
  "stopped",
]);

export const stopExecutionSchema = z.object({
  reason: z.string().max(1_000).optional(),
});

export type StopExecutionInput = z.infer<typeof stopExecutionSchema>;
