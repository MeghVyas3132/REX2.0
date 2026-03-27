import { apiRequest } from "@/lib/api/client";

export interface Execution {
  id: string;
  workflowId: string;
  status: "pending" | "running" | "completed" | "failed" | "stopped";
  startedAt: string;
  completedAt?: string;
  stepsTotal: number;
  stepsCompleted: number;
}

export interface ListExecutionsResponse {
  executions: Execution[];
  total: number;
  page: number;
  limit: number;
}

export const listExecutions = async (page: number = 1, limit: number = 20): Promise<ListExecutionsResponse> => {
  return apiRequest<ListExecutionsResponse>(`/api/executions?page=${page}&limit=${limit}`);
};

export const getExecution = async (id: string): Promise<Execution> => {
  return apiRequest<Execution>(`/api/executions/${id}`);
};

export const stopExecution = async (id: string): Promise<void> => {
  await apiRequest(`/api/executions/${id}/stop`, {
    method: "POST",
  });
};
