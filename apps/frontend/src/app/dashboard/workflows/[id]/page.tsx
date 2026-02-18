// ──────────────────────────────────────────────
// REX - Workflow Detail / Edit Page (visual editor)
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
import { saveWorkflowDraft, clearWorkflowDraft } from "@/lib/workflow-draft";

export default function WorkflowDetailPage() {
  const { token, loading: authLoading } = useAuth();
  const [workflow, setWorkflow] = useState<WorkflowDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
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
      router.push("/dashboard");
    } finally {
      setLoading(false);
    }
  }

  async function handleSave(data: {
    name: string;
    description: string;
    nodes: CanvasNode[];
    edges: CanvasEdge[];
  }) {
    if (!token) return;
    setSaving(true);
    setSaveStatus("saving");

    try {
      await api.workflows.update(token, workflowId, {
        name: data.name.trim(),
        description: data.description.trim(),
        nodes: data.nodes.map((n) => ({
          id: n.id,
          type: n.type,
          label: n.label,
          position: n.position,
          config: n.config,
        })),
        edges: data.edges.map((e) => ({
          id: e.id,
          source: e.source,
          target: e.target,
          condition: e.condition,
        })),
      });
      setSaveStatus("saved");
      clearWorkflowDraft();
      setTimeout(() => setSaveStatus("idle"), 2000);
    } catch {
      setSaveStatus("error");
    } finally {
      setSaving(false);
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

  const handleStopExecution = useCallback(async (executionId: string): Promise<boolean> => {
    if (!token) return false;
    try {
      await api.executions.stop(token, executionId);
      return true;
    } catch {
      return false;
    }
  }, [token]);

  if (authLoading || loading || !workflow) return null;

  return (
    <WorkflowEditor
      initialNodes={workflow.nodes.map((n) => ({
        id: n.id,
        type: n.type,
        label: n.label || n.type,
        position: n.position ?? { x: 100, y: 100 },
        config: n.config ?? {},
      }))}
      initialEdges={workflow.edges.map((e) => ({
        id: e.id,
        source: e.source,
        target: e.target,
        condition: e.condition,
      }))}
      workflowName={workflow.name}
      workflowDescription={workflow.description}
      workflowId={workflowId}
      token={token || undefined}
      saving={saving}
      saveStatus={saveStatus}
      onSave={handleSave}
      onStateChange={(data) => {
        saveWorkflowDraft({
          mode: "update",
          workflowId,
          name: data.name,
          description: data.description,
          nodes: data.nodes,
          edges: data.edges,
        });
      }}
      onExecute={handleExecute}
      onPollExecution={handlePollExecution}
      onStopExecution={handleStopExecution}
      onBack={() => router.push("/dashboard")}
      showExecute
    />
  );
}
