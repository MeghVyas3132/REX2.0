import { useQuery } from "@tanstack/react-query";
import { listApiKeys } from "./api";

export const toolsQueryKeys = {
  all: ["tools"] as const,
  apiKeys: () => ["tools", "api-keys"] as const,
};

export const useApiKeysQuery = () => {
  return useQuery({
    queryKey: toolsQueryKeys.apiKeys(),
    queryFn: listApiKeys,
    staleTime: 60000,
  });
};
