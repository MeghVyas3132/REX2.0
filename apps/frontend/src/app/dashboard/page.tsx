"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { PageContainer, PageHeader, PageSection } from "@/components/layout";
import type { WorkflowListItem } from "@/lib/api";

export default function DashboardPage() {
  const { token, loading: authLoading } = useAuth();
  const router = useRouter();
  const [workflows, setWorkflows] = useState<WorkflowListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!token) {
      router.push("/login");
      return;
    }

    const load = async () => {
      try {
        setError(null);
        const workflowsRes = await api.workflows.list(token, 1, 100);
        setWorkflows(workflowsRes.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load workflows");
      } finally {
        setIsLoading(false);
      }
    };

    void load();
  }, [authLoading, token, router]);

  const handleDelete = async (workflowId: string, workflowName: string) => {
    if (!token) return;
    const confirmed = window.confirm(
      `Delete workflow "${workflowName}"? This will also remove all related executions.`
    );
    if (!confirmed) return;

    try {
      await api.workflows.delete(token, workflowId);
      setWorkflows((prev) => prev.filter((wf) => wf.id !== workflowId));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete workflow");
    }
  };

  if (authLoading || !token) return null;

  return (
    <PageContainer>
      <PageHeader
        title="Workflows"
        description="Design, build, and run intelligent orchestration graphs"
        action={
          <Link
            href="/dashboard/workflows/new"
            style={{
              padding: "10px 20px",
              background: "#3b82f6",
              color: "#fff",
              borderRadius: "6px",
              textDecoration: "none",
            }}
          >
            + New Workflow
          </Link>
        }
      />

      {error && <p style={{ color: "#f87171", marginBottom: "20px" }}>{error}</p>}

      <PageSection title="Workflows">
        {isLoading ? (
          <div style={{ textAlign: "center", padding: "40px", color: "rgba(255,255,255,0.6)" }}>
            Loading workflows...
          </div>
        ) : workflows.length === 0 ? (
          <div style={{ textAlign: "center", padding: "40px 20px", color: "rgba(255,255,255,0.6)" }}>
            <p style={{ fontSize: "18px", marginBottom: "20px" }}>No workflows yet</p>
            <p style={{ marginBottom: "20px" }}>Create your first workflow to get started</p>
            <Link
              href="/dashboard/workflows/new"
              style={{
                padding: "12px 24px",
                background: "#3b82f6",
                color: "#fff",
                borderRadius: "6px",
                textDecoration: "none",
                display: "inline-block",
              }}
            >
              Create Workflow
            </Link>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "16px" }}>
            {workflows.map((workflow) => (
              <div
                key={workflow.id}
                style={{
                  padding: "20px",
                  background: "rgba(255,255,255,0.05)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: "8px",
                  transition: "all 0.2s ease",
                }}
                onMouseEnter={(e) => {
                  const el = e.currentTarget;
                  el.style.background = "rgba(59, 130, 246, 0.1)";
                  el.style.borderColor = "#3b82f6";
                }}
                onMouseLeave={(e) => {
                  const el = e.currentTarget;
                  el.style.background = "rgba(255,255,255,0.05)";
                  el.style.borderColor = "rgba(255,255,255,0.1)";
                }}
              >
                <div style={{ marginBottom: "16px" }}>
                  <h3 style={{ margin: "0 0 8px 0", color: "#fff" }}>{workflow.name}</h3>
                  <p style={{ margin: "0 0 12px 0", fontSize: "14px", color: "rgba(255,255,255,0.6)" }}>
                    {workflow.description || "No description"}
                  </p>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span
                      style={{
                        padding: "4px 8px",
                        background: workflow.status === "active" ? "#10b981" : "#f97316",
                        color: "#fff",
                        borderRadius: "4px",
                        fontSize: "12px",
                      }}
                    >
                      {workflow.status}
                    </span>
                    <span style={{ fontSize: "12px", color: "rgba(255,255,255,0.5)" }}>
                      v{workflow.version}
                    </span>
                  </div>
                </div>
                <div style={{ display: "flex", gap: "8px" }}>
                  <Link
                    href={`/dashboard/workflows/${workflow.id}`}
                    style={{
                      flex: 1,
                      padding: "8px 12px",
                      background: "#3b82f6",
                      color: "#fff",
                      borderRadius: "4px",
                      textDecoration: "none",
                      textAlign: "center",
                      fontSize: "14px",
                      fontWeight: "500",
                    }}
                  >
                    Edit
                  </Link>
                  <button
                    onClick={() => handleDelete(workflow.id, workflow.name)}
                    style={{
                      flex: 1,
                      padding: "8px 12px",
                      background: "rgba(239, 68, 68, 0.2)",
                      color: "#ef4444",
                      border: "none",
                      borderRadius: "4px",
                      cursor: "pointer",
                      fontSize: "14px",
                      fontWeight: "500",
                    }}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </PageSection>
    </PageContainer>
  );
}
                  borderRadius: "8px",
                  transition: "all 0.2s ease",
                }}
                onMouseEnter={(e) => {
                  const el = e.currentTarget;
                  el.style.background = "rgba(59, 130, 246, 0.1)";
                  el.style.borderColor = "#3b82f6";
                }}
                onMouseLeave={(e) => {
                  const el = e.currentTarget;
                  el.style.background = "rgba(255,255,255,0.05)";
                  el.style.borderColor = "rgba(255,255,255,0.1)";
                }}
              >
                <div style={{ marginBottom: "16px" }}>
                  <h3 style={{ margin: "0 0 8px 0", color: "#fff" }}>{workflow.name}</h3>
                  <p style={{ margin: "0 0 12px 0", fontSize: "14px", color: "rgba(255,255,255,0.6)" }}>
                    {workflow.description || "No description"}
                  </p>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span
                      style={{
                        padding: "4px 8px",
                        background: workflow.status === "active" ? "#10b981" : "#f97316",
                        color: "#fff",
                        borderRadius: "4px",
                        fontSize: "12px",
                      }}
                    >
                      {workflow.status}
                    </span>
                    <span style={{ fontSize: "12px", color: "rgba(255,255,255,0.5)" }}>
                      v{workflow.version}
                    </span>
                  </div>
                </div>
                <div style={{ display: "flex", gap: "8px" }}>
                  <Link
                    href={`/dashboard/workflows/${workflow.id}`}
                    style={{
                      flex: 1,
                      padding: "8px 12px",
                      background: "#3b82f6",
                      color: "#fff",
                      borderRadius: "4px",
                      textDecoration: "none",
                      textAlign: "center",
                      fontSize: "14px",
                      fontWeight: "500",
                    }}
                  >
                    Edit
                  </Link>
                  <button
                    onClick={() => handleDelete(workflow.id, workflow.name)}
                    style={{
                      flex: 1,
                      padding: "8px 12px",
                      background: "rgba(239, 68, 68, 0.2)",
                      color: "#ef4444",
                      border: "none",
                      borderRadius: "4px",
                      cursor: "pointer",
                      fontSize: "14px",
                      fontWeight: "500",
                    }}
                  >
