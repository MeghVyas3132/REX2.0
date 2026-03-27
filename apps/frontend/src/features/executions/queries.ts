import { useQuery } from "@tanstack/react-query";
import { listExecutions, getExecution } from "./api";
import type { Execution } from "./api";

export const executionQueryKeys = {
  all: ["executions"] as const,
  list: (page = 1, limit = 20) => ["executions", "list", { page, limit }] as const,
  detail: (id: string) => ["executions", "detail", id] as const,
};

const EXECUTION_POLLING_MS = 5000;

export function shouldPollExecution(status: Execution["status"] | undefined): boolean {
  return status === "pending" || status === "running";
}

export function getExecutionRefetchInterval(status: Execution["status"] | undefined): number | false {
  return shouldPollExecution(status) ? EXECUTION_POLLING_MS : false;
}

export const useExecutionsQuery = (page: number = 1, limit: number = 20) => {
  return useQuery({
    queryKey: executionQueryKeys.list(page, limit),
    queryFn: () => listExecutions(page, limit),
    staleTime: 30000,
  });
};

export const useExecutionQuery = (id: string) => {
  return useQuery({
    queryKey: executionQueryKeys.detail(id),
    queryFn: () => getExecution(id),
    staleTime: 10000,
    refetchInterval: (query) => {
      const status = (query.state.data as Execution | undefined)?.status;
      return getExecutionRefetchInterval(status);
    },
    enabled: Boolean(id),
  });
};
