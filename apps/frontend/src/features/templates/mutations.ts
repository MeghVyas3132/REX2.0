import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createTemplate, deleteTemplate } from "./api";
import { toast } from "sonner";
import { templateQueryKeys } from "./queries";

export const useCreateTemplateMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createTemplate,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: templateQueryKeys.all });
      toast.success("Template created successfully");
    },
    onError: () => {
      toast.error("Failed to create template");
    },
  });
};

export const useDeleteTemplateMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteTemplate,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: templateQueryKeys.all });
      toast.success("Template deleted successfully");
    },
    onError: () => {
      toast.error("Failed to delete template");
    },
  });
};
