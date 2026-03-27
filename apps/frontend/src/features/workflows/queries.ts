"use client";

import { useQuery } from "@tanstack/react-query";
import {
  getRexScores,
  getWorkflow,
  listActiveWorkflows,
  listWorkflowExecutions,
  listWorkflows,
} from "@/features/workflows/api";

export const workflowQueryKeys = {
  all: ["workflows"] as const,
  list: (page = 1, limit = 20) => ["workflows", "list", { page, limit }] as const,
  detail: (workflowId: string) => ["workflows", "detail", workflowId] as const,
  active: () => ["workflows", "active"] as const,
  executions: (workflowId: string, page = 1, limit = 20) =>
    ["workflows", "detail", workflowId, "executions", { page, limit }] as const,
  rexScores: (workflowId: string) => ["workflows", "detail", workflowId, "rex", "scores"] as const,
};

export function useWorkflowsQuery(page = 1, limit = 20) {
  return useQuery({
    queryKey: workflowQueryKeys.list(page, limit),
    queryFn: () => listWorkflows(page, limit),
  });
}

export function useWorkflowQuery(workflowId: string) {
  return useQuery({
    queryKey: workflowQueryKeys.detail(workflowId),
    queryFn: () => getWorkflow(workflowId),
    enabled: Boolean(workflowId),
  });
}

export function useWorkflowExecutionsQuery(workflowId: string, page = 1, limit = 20) {
  return useQuery({
    queryKey: workflowQueryKeys.executions(workflowId, page, limit),
    queryFn: () => listWorkflowExecutions(workflowId, page, limit),
    enabled: Boolean(workflowId),
  });
}

export function useActiveWorkflowsQuery() {
  return useQuery({
    queryKey: workflowQueryKeys.active(),
    queryFn: listActiveWorkflows,
    refetchInterval: 5_000,
  });
}

export function useWorkflowRexScoresQuery(workflowId: string) {
  return useQuery({
    queryKey: workflowQueryKeys.rexScores(workflowId),
    queryFn: () => getRexScores(workflowId),
    enabled: Boolean(workflowId),
  });
}
