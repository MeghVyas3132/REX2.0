import { QueryClient } from "@tanstack/react-query";
import { isAppApiError } from "@/lib/api/types";

export function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        retry: (failureCount, error) => {
          if (failureCount >= 2) return false;
          if (isAppApiError(error)) {
            if (error.retryable) return true;
            if (error.status >= 400 && error.status < 500) return false;
          }
          return true;
        },
      },
      mutations: {
        retry: 0,
      },
    },
  });
}
