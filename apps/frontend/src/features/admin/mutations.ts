"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { updateAdminTenant } from "./api";
import { adminQueryKeys } from "./queries";

export function useUpdateAdminTenantMutation() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: ({ tenantId, input }: { tenantId: string; input: Parameters<typeof updateAdminTenant>[1] }) =>
			updateAdminTenant(tenantId, input),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: adminQueryKeys.all });
			toast.success("Tenant updated successfully");
		},
		onError: () => {
			toast.error("Failed to update tenant");
		},
	});
}
