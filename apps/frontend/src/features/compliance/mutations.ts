"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { updateComplianceRecord } from "./api";
import { complianceQueryKeys } from "./queries";

export function useUpdateComplianceRecordMutation() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: ({ recordId, input }: { recordId: string; input: Parameters<typeof updateComplianceRecord>[1] }) =>
			updateComplianceRecord(recordId, input),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: complianceQueryKeys.all });
			toast.success("Compliance record updated");
		},
		onError: () => {
			toast.error("Failed to update compliance record");
		},
	});
}
