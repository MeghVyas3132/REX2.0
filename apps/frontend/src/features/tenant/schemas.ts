import { z } from "zod";

export const tenantSettingsSchema = z.object({
	name: z.string().min(1).max(255),
	email: z.string().email(),
	billing: z.record(z.unknown()).optional(),
});

export const tenantUserRoleSchema = z.enum(["owner", "admin", "editor", "viewer"]);

export const inviteTenantUserSchema = z.object({
	email: z.string().email(),
	role: tenantUserRoleSchema,
});

export type TenantSettingsInput = z.infer<typeof tenantSettingsSchema>;
export type InviteTenantUserInput = z.infer<typeof inviteTenantUserSchema>;
