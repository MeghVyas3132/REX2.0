import { z } from "zod";

export const adminTenantStatusSchema = z.enum(["active", "suspended", "archived"]);

export const updateAdminTenantSchema = z.object({
	name: z.string().min(1).max(255).optional(),
	status: adminTenantStatusSchema.optional(),
});

export type UpdateAdminTenantInput = z.infer<typeof updateAdminTenantSchema>;
