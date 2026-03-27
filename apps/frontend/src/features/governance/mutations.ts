"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
	createAlertRule,
	createPolicy,
	createWorkspace,
	updateAlertRule,
	updatePolicy,
	updateWorkspace,
} from "./api";
import { governanceQueryKeys } from "./queries";
import { useTelemetryMutation } from "@/lib/telemetry/observability";

function getErrorMessage(error: unknown): string {
	return error instanceof Error ? error.message : "Unknown error";
}

export function useCreateWorkspaceMutation() {
	const queryClient = useQueryClient();
	const telemetry = useTelemetryMutation("create_workspace", "governance");
	return useMutation({
		mutationFn: createWorkspace,
		onMutate: () => ({ startedAt: telemetry.start() }),
		onSuccess: (_workspace, _input, context) => {
			queryClient.invalidateQueries({ queryKey: governanceQueryKeys.all });
			telemetry.success(context?.startedAt ?? Date.now());
			toast.success("Workspace created successfully");
		},
		onError: (error, _input, context) => {
			telemetry.error(context?.startedAt ?? Date.now(), getErrorMessage(error));
			toast.error("Failed to create workspace");
		},
	});
}

export function useUpdateWorkspaceMutation() {
	const queryClient = useQueryClient();
	const telemetry = useTelemetryMutation("update_workspace", "governance");
	return useMutation({
		mutationFn: ({ workspaceId, input }: { workspaceId: string; input: Parameters<typeof updateWorkspace>[1] }) =>
			updateWorkspace(workspaceId, input),
		onMutate: () => ({ startedAt: telemetry.start() }),
		onSuccess: (_workspace, { workspaceId }, context) => {
			queryClient.invalidateQueries({ queryKey: governanceQueryKeys.all });
			telemetry.success(context?.startedAt ?? Date.now(), { workspaceId });
			toast.success("Workspace updated successfully");
		},
		onError: (error, _input, context) => {
			telemetry.error(context?.startedAt ?? Date.now(), getErrorMessage(error));
			toast.error("Failed to update workspace");
		},
	});
}

export function useCreatePolicyMutation() {
	const queryClient = useQueryClient();
	const telemetry = useTelemetryMutation("create_policy", "governance");
	return useMutation({
		mutationFn: createPolicy,
		onMutate: () => ({ startedAt: telemetry.start() }),
		onSuccess: (_policy, _input, context) => {
			queryClient.invalidateQueries({ queryKey: governanceQueryKeys.all });
			telemetry.success(context?.startedAt ?? Date.now());
			toast.success("Policy created successfully");
		},
		onError: (error, _input, context) => {
			telemetry.error(context?.startedAt ?? Date.now(), getErrorMessage(error));
			toast.error("Failed to create policy");
		},
	});
}

export function useUpdatePolicyMutation() {
	const queryClient = useQueryClient();
	const telemetry = useTelemetryMutation("update_policy", "governance");
	return useMutation({
		mutationFn: ({ policyId, input }: { policyId: string; input: Parameters<typeof updatePolicy>[1] }) =>
			updatePolicy(policyId, input),
		onMutate: () => ({ startedAt: telemetry.start() }),
		onSuccess: (_policy, { policyId }, context) => {
			queryClient.invalidateQueries({ queryKey: governanceQueryKeys.all });
			telemetry.success(context?.startedAt ?? Date.now(), { policyId });
			toast.success("Policy updated successfully");
		},
		onError: (error, _input, context) => {
			telemetry.error(context?.startedAt ?? Date.now(), getErrorMessage(error));
			toast.error("Failed to update policy");
		},
	});
}

export function useCreateAlertRuleMutation() {
	const queryClient = useQueryClient();
	const telemetry = useTelemetryMutation("create_alert_rule", "governance");
	return useMutation({
		mutationFn: createAlertRule,
		onMutate: () => ({ startedAt: telemetry.start() }),
		onSuccess: (_alertRule, _input, context) => {
			queryClient.invalidateQueries({ queryKey: governanceQueryKeys.all });
			telemetry.success(context?.startedAt ?? Date.now());
			toast.success("Alert rule created successfully");
		},
		onError: (error, _input, context) => {
			telemetry.error(context?.startedAt ?? Date.now(), getErrorMessage(error));
			toast.error("Failed to create alert rule");
		},
	});
}

export function useUpdateAlertRuleMutation() {
	const queryClient = useQueryClient();
	const telemetry = useTelemetryMutation("update_alert_rule", "governance");
	return useMutation({
		mutationFn: ({ alertRuleId, input }: { alertRuleId: string; input: Parameters<typeof updateAlertRule>[1] }) =>
			updateAlertRule(alertRuleId, input),
		onMutate: () => ({ startedAt: telemetry.start() }),
		onSuccess: (_alertRule, { alertRuleId }, context) => {
			queryClient.invalidateQueries({ queryKey: governanceQueryKeys.all });
			telemetry.success(context?.startedAt ?? Date.now(), { alertRuleId });
			toast.success("Alert rule updated successfully");
		},
		onError: (error, _input, context) => {
			telemetry.error(context?.startedAt ?? Date.now(), getErrorMessage(error));
			toast.error("Failed to update alert rule");
		},
	});
}
