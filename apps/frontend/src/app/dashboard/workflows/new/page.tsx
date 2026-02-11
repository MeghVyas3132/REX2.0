// ──────────────────────────────────────────────
// REX - New Workflow Page (visual editor)
// ──────────────────────────────────────────────

"use client";

import { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api";
import { useRouter } from "next/navigation";
import { WorkflowEditor } from "@/components/workflow-editor";
import type { CanvasNode, CanvasEdge } from "@/components/workflow-editor";

export default function NewWorkflowPage() {
  const { token, loading: authLoading } = useAuth();
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const router = useRouter();

  async function handleSave(data: {
    name: string;
    description: string;
    nodes: CanvasNode[];
    edges: CanvasEdge[];
  }) {
    if (!token || !data.name.trim()) return;
    setSaving(true);
    setSaveStatus("saving");

    try {
      const res = await api.workflows.create(token, {
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
        })),
      });
      setSaveStatus("saved");
      setTimeout(() => {
        router.push(`/dashboard/workflows/${res.data.id}`);
      }, 500);
    } catch {
      setSaveStatus("error");
    } finally {
      setSaving(false);
    }
  }

  if (authLoading || !token) return null;

  return (
    <WorkflowEditor
      onSave={handleSave}
      onBack={() => router.push("/dashboard")}
      saving={saving}
      saveStatus={saveStatus}
      token={token || undefined}
    />
  );
}
