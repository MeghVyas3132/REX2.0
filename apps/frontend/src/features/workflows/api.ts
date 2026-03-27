import { apiRequest } from "@/lib/api/client";
import type {
  CreateWorkflowInput,
  ExecuteWorkflowInput,
  UpdateWorkflowInput,
  WorkflowExecution,
  WorkflowListResponse,
  WorkflowRexScores,
  WorkflowSummary,
} from "./types";

export async function listWorkflows(page = 1, limit = 20): Promise<WorkflowListResponse> {
  return apiRequest<WorkflowListResponse>(`/api/workflows?page=${page}&limit=${limit}`);
}

export async function getWorkflow(workflowId: string): Promise<WorkflowSummary> {
  return apiRequest<WorkflowSummary>(`/api/workflows/${workflowId}`);
}

export async function createWorkflow(input: CreateWorkflowInput): Promise<WorkflowSummary> {
  return apiRequest<WorkflowSummary>("/api/workflows", {
    method: "POST",
    body: input,
  });
}

export async function updateWorkflow(workflowId: string, input: UpdateWorkflowInput): Promise<WorkflowSummary> {
  return apiRequest<WorkflowSummary>(`/api/workflows/${workflowId}`, {
    method: "PATCH",
    body: input,
  });
}

export async function removeWorkflow(workflowId: string): Promise<void> {
  await apiRequest<void>(`/api/workflows/${workflowId}`, {
    method: "DELETE",
  });
}

export async function executeWorkflow(workflowId: string, input?: ExecuteWorkflowInput): Promise<WorkflowExecution> {
  return apiRequest<WorkflowExecution>(`/api/workflows/${workflowId}/execute`, {
    method: "POST",
    body: input ?? {},
  });
}

export async function listWorkflowExecutions(workflowId: string, page = 1, limit = 20): Promise<WorkflowExecution[]> {
  return apiRequest<WorkflowExecution[]>(`/api/workflows/${workflowId}/executions?page=${page}&limit=${limit}`);
}

export async function listActiveWorkflows(): Promise<WorkflowExecution[]> {
  return apiRequest<WorkflowExecution[]>("/api/workflows/active");
}

export async function getRexScores(workflowId: string): Promise<WorkflowRexScores> {
  return apiRequest<WorkflowRexScores>(`/api/workflows/${workflowId}/rex/scores`);
}

export async function previewRexFixes(workflowId: string): Promise<WorkflowRexScores> {
  return apiRequest<WorkflowRexScores>(`/api/workflows/${workflowId}/rex/preview`);
}

export async function applyRexFixes(workflowId: string): Promise<WorkflowSummary> {
  return apiRequest<WorkflowSummary>(`/api/workflows/${workflowId}/rex/apply`, {
    method: "POST",
  });
}

export const workflowsApi = {
  list: listWorkflows,
  get: getWorkflow,
  create: createWorkflow,
  update: updateWorkflow,
  remove: removeWorkflow,
  execute: executeWorkflow,
  listExecutions: listWorkflowExecutions,
  listActive: listActiveWorkflows,
  getRexScores,
  previewRexFixes,
  applyRexFixes,
};
