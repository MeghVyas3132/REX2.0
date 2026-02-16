"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api";
import { useRouter } from "next/navigation";
import { WorkflowEditor } from "@/components/workflow-editor";
import type { CanvasNode, CanvasEdge } from "@/components/workflow-editor";
import {
  loadWorkflowDraft,
  saveWorkflowDraft,
  clearWorkflowDraft,
  type WorkflowDraft,
} from "@/lib/workflow-draft";

export default function CurrentWorkflowPage() {
  const { token, loading: authLoading } = useAuth();
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
      <div style={styles.emptyWrap}>
        <h1 style={styles.emptyTitle}>Current Workflow</h1>
        <p style={styles.emptyText}>No unsaved workflow draft found.</p>
        <button style={styles.emptyBtn} onClick={() => router.push("/dashboard/workflows/new")}>Create New Workflow</button>
      </div>
    );
  }

  return (
    <>
      {error ? <div style={styles.errorBanner}>{error}</div> : null}
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

const styles: Record<string, React.CSSProperties> = {
  emptyWrap: {
    minHeight: "100vh",
    background: "#0a0a0a",
    color: "#e5e5e5",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: "10px",
  },
  emptyTitle: {
    margin: 0,
    fontSize: "28px",
  },
  emptyText: {
    margin: 0,
    color: "#999",
  },
  emptyBtn: {
    marginTop: "8px",
    padding: "10px 14px",
    border: "1px solid #333",
    background: "#111",
    color: "#e5e5e5",
    borderRadius: "6px",
    cursor: "pointer",
  },
  errorBanner: {
    position: "fixed",
    top: 8,
    left: 8,
    right: 8,
    zIndex: 1000,
    background: "#2a1010",
    border: "1px solid #6a2222",
    color: "#ef4444",
    padding: "10px 12px",
    borderRadius: "8px",
    fontSize: "13px",
  },
};
