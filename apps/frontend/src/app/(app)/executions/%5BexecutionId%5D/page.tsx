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
    <section className="detail-page-shell execution-detail-shell">
      <header className="detail-page-header">
        <p className="detail-page-eyebrow">Execution Detail</p>
        <h1>Execution {execution.id}</h1>
        <p className="detail-page-subtitle">Workflow: {execution.workflowId}</p>
      </header>

      <Card className="detail-card" title="Execution Status">
        <div className="detail-kv-list">
          <p className="detail-kv-item">Status: {execution.status}</p>
          <p className="detail-kv-item">Progress: {execution.stepsCompleted}/{execution.stepsTotal} ({progress}%)</p>
          <p className="detail-kv-item">Started: {execution.startedAt}</p>
          <p className="detail-kv-item">Completed: {execution.completedAt ?? "-"}</p>
        </div>

        <div className="execution-progress" role="presentation" aria-hidden="true">
          <div className="execution-progress-fill" style={{ width: `${progress}%` }} />
        </div>

        <PermissionGate user={user} requireEdit fallback={null}>
          <Button
            className="execution-stop-button"
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
