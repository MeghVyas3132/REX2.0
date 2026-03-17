"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { WorkflowEditor } from "@/components/workflow-editor";
import type { CanvasNode, CanvasEdge } from "@/components/workflow-editor";
import { AppShell, getDashboardNavItems } from "@/components/layout";
import { Button, Card } from "@/components/ui";
import {
  loadWorkflowDraft,
  saveWorkflowDraft,
  clearWorkflowDraft,
  type WorkflowDraft,
} from "@/lib/workflow-draft";

export default function CurrentWorkflowPage() {
  const { user, token, loading: authLoading, logout } = useAuth();
  const [draft, setDraft] = useState<WorkflowDraft | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [error, setError] = useState("");
  const router = useRouter();

  useEffect(() => {
    if (authLoading) return;
    if (!token) {
      router.push("/login");
      return;
    }

    setDraft(loadWorkflowDraft());
  }, [authLoading, token, router]);

  async function handleSave(data: {
    name: string;
    description: string;
    nodes: CanvasNode[];
    edges: CanvasEdge[];
  }) {
    if (!token) return;

    setSaving(true);
    setSaveStatus("saving");
    setError("");

    try {
      if (draft?.mode === "update" && draft.workflowId) {
        await api.workflows.update(token, draft.workflowId, {
          name: data.name.trim(),
          description: data.description.trim(),
          nodes: data.nodes,
          edges: data.edges,
        });
        clearWorkflowDraft();
        setSaveStatus("saved");
        router.push(`/dashboard/workflows/${draft.workflowId}`);
        return;
      }

      const created = await api.workflows.create(token, {
        name: data.name.trim() || "Recovered Workflow",
        description: data.description.trim(),
        nodes: data.nodes,
        edges: data.edges,
      });

      clearWorkflowDraft();
      setSaveStatus("saved");
      router.push(`/dashboard/workflows/${created.data.id}`);
    } catch (err) {
      setSaveStatus("error");
      setError(err instanceof Error ? err.message : "Failed to save current workflow");
    } finally {
      setSaving(false);
    }
  }

  if (authLoading || !token) return null;

  if (!draft) {
    return (
      <AppShell
        title="Current Workflow"
        subtitle="Recover unsaved draft state and continue editing without creating duplicate workflows."
        navItems={getDashboardNavItems("current-workflow")}
        userName={user?.name}
        onSignOut={logout}
      >
        <Card title="No unsaved draft" subtitle="Start a new workflow or edit an existing one to create a recoverable draft state.">
          <Link href="/dashboard/workflows/new" className="rex-link-reset">
            <Button variant="primary">Create New Workflow</Button>
          </Link>
        </Card>
      </AppShell>
    );
  }

  return (
    <>
      {error ? <div className="rex-workflow-error-banner">{error}</div> : null}
      <WorkflowEditor
        key={`current-${draft.updatedAt}`}
        initialNodes={draft.nodes}
        initialEdges={draft.edges}
        workflowName={draft.name}
        workflowDescription={draft.description}
        saving={saving}
        saveStatus={saveStatus}
        onSave={handleSave}
        onStateChange={(data) => {
          saveWorkflowDraft({
            mode: draft.mode,
            workflowId: draft.workflowId,
            name: data.name,
            description: data.description,
            nodes: data.nodes,
            edges: data.edges,
          });
        }}
        onBack={() => router.push("/dashboard")}
      />
    </>
  );
}
