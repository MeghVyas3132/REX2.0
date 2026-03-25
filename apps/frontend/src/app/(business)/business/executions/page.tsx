"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { api, type ActiveWorkflowExecutionClient } from "@/lib/api";
import { PageContainer, PageHeader, PageSection } from "@/components/layout";

export default function BusinessExecutionsPage() {
  const { token, loading: authLoading } = useAuth();
  const router = useRouter();
  const [executions, setExecutions] = useState<ActiveWorkflowExecutionClient[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!token) {
      router.replace("/login");
      return;
    }

    const load = async () => {
      try {
        setError(null);
        const result = await api.workflows.active(token, 1, 100);
        setExecutions(result.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load executions");
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, [authLoading, token, router]);

  if (authLoading || !token) return null;

  return (
    <PageContainer>
      <PageHeader
        title="Executions"
        description="Monitor workflow runs and their current status"
      />

      {error ? (
        <p style={{ marginBottom: "16px", borderRadius: "10px", border: "1px solid rgba(239, 68, 68, 0.3)", background: "rgba(239, 68, 68, 0.1)", padding: "12px 16px", fontSize: "14px", color: "#fca5a5" }}>
          {error}
        </p>
      ) : null}

      <PageSection>
        {loading ? (
          <div style={{ borderRadius: "10px", border: "1px solid var(--border-muted)", background: "var(--surface-1)", padding: "64px 24px", textAlign: "center", fontSize: "14px", color: "var(--text-secondary)" }}>
            Loading executions...
          </div>
        ) : executions.length === 0 ? (
          <div style={{ borderRadius: "10px", border: "1px solid var(--border-muted)", background: "var(--surface-1)", padding: "64px 24px", textAlign: "center", fontSize: "14px", color: "var(--text-secondary)" }}>
            No active executions found.
          </div>
        ) : (
          <div style={{ display: "grid", gap: "16px", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))" }}>
            {executions.map((execution) => (
              <article
                key={execution.executionId}
                style={{ borderRadius: "10px", border: "1px solid var(--border-muted)", background: "var(--surface-1)", boxShadow: "var(--shadow-1)", padding: "20px" }}
              >
                <h3 style={{ margin: "0 0 8px", fontSize: "16px", fontWeight: 600, color: "var(--text-primary)" }}>
                  {execution.workflowName}
                </h3>
                <p style={{ margin: "0 0 8px", fontSize: "14px", color: "var(--text-secondary)" }}>
                  Execution: {execution.executionId}
                </p>
                <p style={{ margin: "0 0 12px", fontSize: "12px", color: "var(--text-tertiary)" }}>
                  Started: {execution.startedAt ? new Date(execution.startedAt).toLocaleString() : "Not started"}
                </p>
                <p style={{ margin: "0 0 12px", fontSize: "12px", color: "var(--text-tertiary)" }}>
                  Workflow status: {execution.workflowStatus}
                </p>
                <span
                  style={{
                    display: "inline-block",
                    borderRadius: "6px",
                    border: execution.executionStatus === "running" ? "1px solid rgba(16, 185, 129, 0.35)" : "1px solid rgba(245, 158, 11, 0.35)",
                    background: execution.executionStatus === "running" ? "rgba(16, 185, 129, 0.15)" : "rgba(245, 158, 11, 0.15)",
                    color: execution.executionStatus === "running" ? "#6ee7b7" : "#fde68a",
                    padding: "4px 10px",
                    fontSize: "12px",
                    fontWeight: 600,
                  }}
                >
                  {execution.executionStatus}
                </span>
              </article>
            ))}
          </div>
        )}
      </PageSection>
    </PageContainer>
  );
}
