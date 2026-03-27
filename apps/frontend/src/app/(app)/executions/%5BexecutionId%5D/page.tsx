"use client";

import { use, useEffect } from "react";
import { useExecutionQuery } from "@/features/executions/queries";
import { useStopExecutionMutation } from "@/features/executions/mutations";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { PermissionGate } from "@/components/shared/PermissionGate";
import { useSession } from "@/lib/auth/session-context";
import { telemetry, useTelemetryPageView } from "@/lib/telemetry/observability";

export default function ExecutionDetailPage({ params }: { params: Promise<{ executionId: string }> }) {
  const { executionId: rawExecutionId } = use(params);
  const executionId = decodeURIComponent(rawExecutionId);
  const { user } = useSession();
  const query = useExecutionQuery(executionId);
  const stopMutation = useStopExecutionMutation();
  useTelemetryPageView("executions.detail", { executionId });

  useEffect(() => {
    if (query.isError) {
      telemetry.trackQueryError("execution", `Failed to load execution ${executionId}`);
    }
  }, [executionId, query.isError]);

  if (query.isLoading) return <div className="page-state">Loading execution...</div>;
  if (query.isError || !query.data) return <div className="page-state">Failed to load execution.</div>;

  const execution = query.data;

  const progress = execution.stepsTotal > 0 ? Math.round((execution.stepsCompleted / execution.stepsTotal) * 100) : 0;

  return (
    <section>
      <h1>Execution {execution.id}</h1>
      <p>Workflow: {execution.workflowId}</p>

      <Card title="Execution Status">
        <p>Status: {execution.status}</p>
        <p>Progress: {execution.stepsCompleted}/{execution.stepsTotal} ({progress}%)</p>
        <p>Started: {execution.startedAt}</p>
        <p>Completed: {execution.completedAt ?? "-"}</p>

        <PermissionGate user={user} requireEdit fallback={null}>
          <Button
            variant="danger"
            onClick={() => {
              telemetry.trackAction("execution_stop_click", "execution", execution.id);
              stopMutation.mutate(execution.id);
            }}
            loading={stopMutation.isPending}
            disabled={execution.status !== "running"}
          >
            Stop Execution
          </Button>
        </PermissionGate>
      </Card>
    </section>
  );
}
