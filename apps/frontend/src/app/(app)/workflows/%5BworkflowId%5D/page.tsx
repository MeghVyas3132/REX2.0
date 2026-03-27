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
    <section>
      <h1>{workflow.name}</h1>
      <p>Workflow ID: {workflow.id}</p>

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12 }}>
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

      <div style={{ display: "grid", gap: 12 }}>
        <Card title="Workflow Summary">
          <p>Status: {workflow.status}</p>
          <p>Version: {workflow.version}</p>
          <p>Updated: {workflow.updatedAt}</p>
        </Card>

        <Card title="REX Scores">
          {rexQuery.isLoading ? <p>Loading REX scores...</p> : null}
          {rexQuery.isError ? <p>Unable to load REX scores.</p> : null}
          {rexQuery.data ? <pre style={{ margin: 0 }}>{JSON.stringify(rexQuery.data, null, 2)}</pre> : null}
        </Card>
      </div>
    </section>
  );
}
