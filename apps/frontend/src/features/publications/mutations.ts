import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createPublication, updatePublication, deletePublication } from "./api";
import { toast } from "sonner";
import { publicationQueryKeys } from "./queries";
import { useTelemetryMutation } from "@/lib/telemetry/observability";

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Unknown error";
}

export const useCreatePublicationMutation = () => {
  const queryClient = useQueryClient();
  const telemetry = useTelemetryMutation("create_publication", "publication");

  return useMutation({
    mutationFn: createPublication,
    onMutate: () => ({ startedAt: telemetry.start() }),
    onSuccess: (publication, _input, context) => {
      queryClient.invalidateQueries({ queryKey: publicationQueryKeys.all });
      telemetry.success(context?.startedAt ?? Date.now(), { publicationId: publication.id });
      toast.success("Publication created successfully");
    },
    onError: (error, _input, context) => {
      telemetry.error(context?.startedAt ?? Date.now(), getErrorMessage(error));
      toast.error("Failed to create publication");
    },
  });
};

export const useUpdatePublicationMutation = () => {
  const queryClient = useQueryClient();
  const telemetry = useTelemetryMutation("update_publication", "publication");

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Parameters<typeof updatePublication>[1]> }) =>
      updatePublication(id, data),
    onMutate: () => ({ startedAt: telemetry.start() }),
    onSuccess: (_publication, { id }, context) => {
      queryClient.invalidateQueries({ queryKey: publicationQueryKeys.all });
      telemetry.success(context?.startedAt ?? Date.now(), { publicationId: id });
      toast.success("Publication updated successfully");
    },
    onError: (error, _input, context) => {
      telemetry.error(context?.startedAt ?? Date.now(), getErrorMessage(error));
      toast.error("Failed to update publication");
    },
  });
};

export const useDeletePublicationMutation = () => {
  const queryClient = useQueryClient();
  const telemetry = useTelemetryMutation("delete_publication", "publication");

  return useMutation({
    mutationFn: deletePublication,
    onMutate: () => ({ startedAt: telemetry.start() }),
    onSuccess: (_result, publicationId, context) => {
      queryClient.invalidateQueries({ queryKey: publicationQueryKeys.all });
      telemetry.success(context?.startedAt ?? Date.now(), { publicationId });
      toast.success("Publication deleted successfully");
    },
    onError: (error, _publicationId, context) => {
      telemetry.error(context?.startedAt ?? Date.now(), getErrorMessage(error));
      toast.error("Failed to delete publication");
    },
  });
};
