import { useMutation, useQueryClient } from "@tanstack/react-query";
import { stopExecution } from "./api";
import { toast } from "sonner";
import { executionQueryKeys } from "./queries";
import { useTelemetryMutation } from "@/lib/telemetry/observability";

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Unknown error";
}

export const useStopExecutionMutation = () => {
  const queryClient = useQueryClient();
  const telemetry = useTelemetryMutation("stop_execution", "execution");

  return useMutation({
    mutationFn: stopExecution,
    onMutate: () => ({ startedAt: telemetry.start() }),
    onSuccess: (_result, executionId, context) => {
      queryClient.invalidateQueries({ queryKey: executionQueryKeys.all });
      telemetry.success(context?.startedAt ?? Date.now(), { executionId });
      toast.success("Execution stopped successfully");
    },
    onError: (error, _executionId, context) => {
      telemetry.error(context?.startedAt ?? Date.now(), getErrorMessage(error));
      toast.error("Failed to stop execution");
    },
  });
};
