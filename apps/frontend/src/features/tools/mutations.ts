import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createApiKey, deleteApiKey } from "./api";
import { toast } from "sonner";
import { toolsQueryKeys } from "./queries";

export const useCreateApiKeyMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createApiKey,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: toolsQueryKeys.apiKeys() });
      toast.success("API key created successfully");
    },
    onError: () => {
      toast.error("Failed to create API key");
    },
  });
};

export const useDeleteApiKeyMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteApiKey,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: toolsQueryKeys.apiKeys() });
      toast.success("API key deleted successfully");
    },
    onError: () => {
      toast.error("Failed to delete API key");
    },
  });
};
