// ──────────────────────────────────────────────
// REX - Business Workflow View (read-only canvas)
// ──────────────────────────────────────────────

"use client";

import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api";
import type { WorkflowDetail } from "@/lib/api";
import { useRouter, useParams } from "next/navigation";
import { WorkflowEditor } from "@/components/workflow-editor";
import type { CanvasNode, CanvasEdge } from "@/components/workflow-editor";
import type { ExecutionPollResult } from "@/components/workflow-editor/WorkflowEditor";
import { convertTriggersFromBackend } from "@/lib/trigger-converter";
import { PageContainer } from "@/components/layout";

export default function BusinessWorkflowViewPage() {
  const { token, loading: authLoading } = useAuth();
  const [workflow, setWorkflow] = useState<WorkflowDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const params = useParams();
  const workflowId = params.id as string;

  useEffect(() => {
    if (authLoading) return;
    if (!token) {
      router.push("/login");
      return;
    }
    loadWorkflow();
  }, [authLoading, token, workflowId]);

  async function loadWorkflow() {
    if (!token) return;
    try {
      const res = await api.workflows.get(token, workflowId);
      setWorkflow(res.data);
    } catch {
      router.push("/business/workflows");
    } finally {
      setLoading(false);
    }
  }

  const handleExecute = useCallback(async (): Promise<string | undefined> => {
    if (!token) return undefined;
    try {
      const res = await api.workflows.execute(token, workflowId, {});
      return res.data.executionId;
    } catch {
      return undefined;
    }
  }, [token, workflowId]);

  const handlePollExecution = useCallback(async (executionId: string): Promise<ExecutionPollResult | null> => {
    if (!token) return null;
    try {
      const res = await api.executions.get(token, executionId);
      return {
        status: res.data.status,
        steps: res.data.steps.map((s) => ({
          nodeId: s.nodeId,
          nodeType: s.nodeType,
          status: s.status,
          durationMs: s.durationMs,
          error: s.error,
          output: s.output,
        })),
        errorMessage: res.data.errorMessage,
      };
    } catch {
      return null;
    }
  }, [token]);

  if (authLoading || !token) return null;
  if (loading)
    return (
      <PageContainer>
        <div style={{ textAlign: "center", padding: "40px", color: "rgba(255,255,255,0.6)" }}>Loading...</div>
      </PageContainer>
    );
  if (!workflow)
    return (
      <PageContainer>
        <div style={{ textAlign: "center", padding: "40px", color: "rgba(255,255,255,0.6)" }}>
          Workflow not found.
        </div>
      </PageContainer>
    );

  const nodes: CanvasNode[] = convertTriggersFromBackend(workflow.nodes ?? []);
  const edges: CanvasEdge[] = workflow.edges?.map((e) => ({
    id: e.id,
    source: e.source,
    target: e.target,
    condition: e.condition,
  })) ?? [];

  return (
    <PageContainer maxWidth="full">
      <WorkflowEditor
        initialNodes={nodes}
        initialEdges={edges}
        workflowName={workflow.name}
        workflowDescription={workflow.description}
        workflowId={workflowId}
        token={token}
        onSave={() => {}}
        onBack={() => router.push("/business/workflows")}
        onExecute={handleExecute}
        onPollExecution={handlePollExecution}
        showExecute={true}
      />
    </PageContainer>
  );
}
