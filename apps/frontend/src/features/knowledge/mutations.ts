import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createCorpus, deleteCorpus } from "./api";
import { toast } from "sonner";
import { knowledgeQueryKeys } from "./queries";
import { useTelemetryMutation } from "@/lib/telemetry/observability";

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Unknown error";
}

export const useCreateCorpusMutation = () => {
  const queryClient = useQueryClient();
  const telemetry = useTelemetryMutation("create_corpus", "knowledge");

  return useMutation({
    mutationFn: createCorpus,
    onMutate: () => ({ startedAt: telemetry.start() }),
    onSuccess: (_corpus, _input, context) => {
      queryClient.invalidateQueries({ queryKey: knowledgeQueryKeys.all });
      telemetry.success(context?.startedAt ?? Date.now());
      toast.success("Corpus created successfully");
    },
    onError: (error, _input, context) => {
      telemetry.error(context?.startedAt ?? Date.now(), getErrorMessage(error));
      toast.error("Failed to create corpus");
    },
  });
};

export const useDeleteCorpusMutation = () => {
  const queryClient = useQueryClient();
  const telemetry = useTelemetryMutation("delete_corpus", "knowledge");

  return useMutation({
    mutationFn: deleteCorpus,
    onMutate: () => ({ startedAt: telemetry.start() }),
    onSuccess: (_result, corpusId, context) => {
      queryClient.invalidateQueries({ queryKey: knowledgeQueryKeys.all });
      telemetry.success(context?.startedAt ?? Date.now(), { corpusId });
      toast.success("Corpus deleted successfully");
    },
    onError: (error, _corpusId, context) => {
      telemetry.error(context?.startedAt ?? Date.now(), getErrorMessage(error));
      toast.error("Failed to delete corpus");
    },
  });
};
