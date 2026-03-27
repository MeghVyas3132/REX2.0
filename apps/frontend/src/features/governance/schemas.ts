import { z } from "zod";

export const upsertWorkspaceSchema = z.object({
	name: z.string().min(1).max(255),
	description: z.string().max(2_000).optional(),
});

export const upsertPolicySchema = z.object({
	name: z.string().min(1).max(255),
	effect: z.enum(["allow", "deny"]),
	definition: z.record(z.unknown()),
});

export const upsertAlertRuleSchema = z.object({
	name: z.string().min(1).max(255),
	severity: z.enum(["low", "medium", "high"]),
	enabled: z.boolean().default(true),
	condition: z.record(z.unknown()),
});

export type UpsertWorkspaceInput = z.infer<typeof upsertWorkspaceSchema>;
export type UpsertPolicyInput = z.infer<typeof upsertPolicySchema>;
export type UpsertAlertRuleInput = z.infer<typeof upsertAlertRuleSchema>;
