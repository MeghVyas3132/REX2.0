"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  applyRexFixes,
  createWorkflow,
  executeWorkflow,
  previewRexFixes,
  removeWorkflow,
  updateWorkflow,
} from "./api";
import { workflowQueryKeys } from "./queries";
import { useTelemetryMutation } from "@/lib/telemetry/observability";

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Unknown error";
}

export function useCreateWorkflowMutation() {
  const queryClient = useQueryClient();
  const telemetry = useTelemetryMutation("create_workflow", "workflow");

  return useMutation({
    mutationFn: createWorkflow,
    onMutate: () => ({ startedAt: telemetry.start() }),
    onSuccess: (_workflow, _input, context) => {
      queryClient.invalidateQueries({ queryKey: workflowQueryKeys.all });
      telemetry.success(context?.startedAt ?? Date.now());
      toast.success("Workflow created successfully");
    },
    onError: (error, _input, context) => {
      telemetry.error(context?.startedAt ?? Date.now(), getErrorMessage(error));
      toast.error("Failed to create workflow");
    },
  });
}

export function useUpdateWorkflowMutation() {
  const queryClient = useQueryClient();
  const telemetry = useTelemetryMutation("update_workflow", "workflow");

  return useMutation({
    mutationFn: ({ workflowId, input }: { workflowId: string; input: Parameters<typeof updateWorkflow>[1] }) =>
      updateWorkflow(workflowId, input),
    onMutate: () => ({ startedAt: telemetry.start() }),
    onSuccess: (workflow, _input, context) => {
      queryClient.invalidateQueries({ queryKey: workflowQueryKeys.all });
      queryClient.setQueryData(workflowQueryKeys.detail(workflow.id), workflow);
      telemetry.success(context?.startedAt ?? Date.now(), { workflowId: workflow.id });
      toast.success("Workflow updated successfully");
    },
    onError: (error, _input, context) => {
      telemetry.error(context?.startedAt ?? Date.now(), getErrorMessage(error));
      toast.error("Failed to update workflow");
    },
  });
}

export function useRemoveWorkflowMutation() {
  const queryClient = useQueryClient();
  const telemetry = useTelemetryMutation("delete_workflow", "workflow");

  return useMutation({
    mutationFn: removeWorkflow,
    onMutate: () => ({ startedAt: telemetry.start() }),
    onSuccess: (_result, _workflowId, context) => {
      queryClient.invalidateQueries({ queryKey: workflowQueryKeys.all });
      telemetry.success(context?.startedAt ?? Date.now());
      toast.success("Workflow deleted successfully");
    },
    onError: (error, _input, context) => {
      telemetry.error(context?.startedAt ?? Date.now(), getErrorMessage(error));
      toast.error("Failed to delete workflow");
    },
  });
}

export function useExecuteWorkflowMutation() {
  const queryClient = useQueryClient();
  const telemetry = useTelemetryMutation("execute_workflow", "execution");

  return useMutation({
    mutationFn: ({ workflowId, input }: { workflowId: string; input?: Parameters<typeof executeWorkflow>[1] }) =>
      executeWorkflow(workflowId, input),
    onMutate: () => ({ startedAt: telemetry.start() }),
    onSuccess: (_execution, { workflowId }, context) => {
      queryClient.invalidateQueries({ queryKey: workflowQueryKeys.active() });
      queryClient.invalidateQueries({ queryKey: workflowQueryKeys.executions(workflowId) });
      telemetry.success(context?.startedAt ?? Date.now(), { workflowId });
      toast.success("Workflow execution started");
    },
    onError: (error, _input, context) => {
      telemetry.error(context?.startedAt ?? Date.now(), getErrorMessage(error));
      toast.error("Failed to start workflow execution");
    },
  });
}

export function usePreviewRexFixesMutation() {
  return useMutation({
    mutationFn: previewRexFixes,
  });
}

export function useApplyRexFixesMutation() {
  const queryClient = useQueryClient();
  const telemetry = useTelemetryMutation("apply_rex_fixes", "workflow");

  return useMutation({
    mutationFn: applyRexFixes,
    onMutate: () => ({ startedAt: telemetry.start() }),
    onSuccess: (workflow, _input, context) => {
      queryClient.invalidateQueries({ queryKey: workflowQueryKeys.detail(workflow.id) });
      queryClient.invalidateQueries({ queryKey: workflowQueryKeys.rexScores(workflow.id) });
      telemetry.success(context?.startedAt ?? Date.now(), { workflowId: workflow.id });
      toast.success("REX fixes applied");
    },
    onError: (error, _input, context) => {
      telemetry.error(context?.startedAt ?? Date.now(), getErrorMessage(error));
      toast.error("Failed to apply REX fixes");
    },
  });
}
