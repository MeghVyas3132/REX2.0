import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";

/**
 * Creates a test wrapper with QueryClient for testing hooks
 */
export function createTestQueryWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return function Wrapper({ children }: { children: React.ReactNode }) {
    return React.createElement(QueryClientProvider, { client: queryClient }, children);
  };
}

/**
 * Mock response factory for common list page responses
 */
export const mockResponses = {
  workflowList: (page = 1, total = 25) => ({
    data: [
      {
        id: `wf-${page}-1`,
        name: `Workflow ${page}-1`,
        status: "active",
        version: 1,
      },
      {
        id: `wf-${page}-2`,
        name: `Workflow ${page}-2`,
        status: "draft",
        version: 2,
      },
    ],
    total,
    page,
    limit: 20,
  }),

  emptyList: () => ({
    data: [],
    total: 0,
    page: 1,
    limit: 20,
  }),

  errorMessage: () => new Error("Failed to fetch"),
};

/**
 * Test data for common scenarios
 */
export const testDataScenarios = {
  loading: { isLoading: true, isError: false, data: null },
  error: { isLoading: false, isError: true, data: null },
  empty: { isLoading: false, isError: false, data: { data: [], total: 0 } },
  withData: { isLoading: false, isError: false, data: mockResponses.workflowList() },
};
