import type { CreateWorkflowInput, ExecuteWorkflowInput, UpdateWorkflowInput } from "./schemas";

export type WorkflowSummary = {
  id: string;
  name: string;
  description?: string;
  status: string;
  version: number;
  nodes?: any[];
  edges?: any[];
  updatedAt: string;
  createdAt?: string;
};

export type WorkflowListResponse = {
  data: WorkflowSummary[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
};

export type WorkflowExecution = {
  id: string;
  workflowId: string;
  status: "pending" | "running" | "completed" | "failed";
  startedAt: string;
  finishedAt?: string;
};

export type WorkflowRexScores = {
  workflowId: string;
  score: number;
  issues: Array<{
    id: string;
    severity: "low" | "medium" | "high";
    message: string;
  }>;
};

export type { CreateWorkflowInput, UpdateWorkflowInput, ExecuteWorkflowInput };
