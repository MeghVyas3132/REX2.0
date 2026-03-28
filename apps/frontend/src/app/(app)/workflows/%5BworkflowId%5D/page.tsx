"use client";

import { use } from "react";
import { useRouter } from "next/navigation";
import { useWorkflowQuery, useWorkflowRexScoresQuery } from "@/features/workflows/queries";
import { useExecuteWorkflowMutation } from "@/features/workflows/mutations";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { PermissionGate } from "@/components/shared/PermissionGate";
import { useSession } from "@/lib/auth/session-context";

export default function WorkflowDetailPage({ params }: { params: Promise<{ workflowId: string }> }) {
  const router = useRouter();
  const { workflowId: rawWorkflowId } = use(params);
  const workflowId = decodeURIComponent(rawWorkflowId);
  const { user } = useSession();
  const workflowQuery = useWorkflowQuery(workflowId);
  const rexQuery = useWorkflowRexScoresQuery(workflowId);
  const executeMutation = useExecuteWorkflowMutation();

  const handleExecute = async () => {
    const execution = await executeMutation.mutateAsync({ workflowId });
    router.push(`/executions/${encodeURIComponent(execution.id)}`);
  };

  if (workflowQuery.isLoading) return <div className="page-state">Loading workflow...</div>;
  if (workflowQuery.isError || !workflowQuery.data) return <div className="page-state">Failed to load workflow.</div>;

  const workflow = workflowQuery.data;

  return (
    <section className="detail-page-shell workflow-detail-shell">
      <header className="detail-page-header">
        <p className="detail-page-eyebrow">Workflow Detail</p>
        <h1>{workflow.name}</h1>
        <p className="detail-page-subtitle">Workflow ID: {workflow.id}</p>
      </header>

      <div className="detail-page-actions workflow-detail-actions" style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12 }}>
        <Button variant="secondary" onClick={() => router.push(`/workflows/${encodeURIComponent(workflow.id)}/editor`)}>
          Open Editor
        </Button>
        <Button
          variant="secondary"
          onClick={() => router.push(`/workflows/${encodeURIComponent(workflow.id)}/executions`)}
        >
          View Executions
        </Button>
        <PermissionGate user={user} requireEdit fallback={null}>
          <Button variant="primary" loading={executeMutation.isPending} onClick={handleExecute}>
            Execute Workflow
          </Button>
        </PermissionGate>
      </div>

      <div className="detail-card-grid" style={{ display: "grid", gap: 12 }}>
        <Card className="detail-card" title="Workflow Summary">
          <div className="detail-kv-list">
            <p className="detail-kv-item">Status: {workflow.status}</p>
            <p className="detail-kv-item">Version: {workflow.version}</p>
            <p className="detail-kv-item">Updated: {workflow.updatedAt}</p>
          </div>
        </Card>

        <Card className="detail-card" title="REX Scores">
          {rexQuery.isLoading ? <p className="detail-inline-state">Loading REX scores...</p> : null}
          {rexQuery.isError ? <p className="detail-inline-state detail-inline-state-error">Unable to load REX scores.</p> : null}
          {rexQuery.data ? <pre className="detail-json-block" style={{ margin: 0 }}>{JSON.stringify(rexQuery.data, null, 2)}</pre> : null}
        </Card>
      </div>
    </section>
  );
}
