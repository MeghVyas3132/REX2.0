"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api, type WorkflowListItem } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { PageContainer, PageHeader, PageSection } from "@/components/layout";

interface WorkflowsGridPageProps {
  title: string;
  description: string;
  routeBase: string;
  createHref?: string;
  createLabel?: string;
}

export function WorkflowsGridPage({
  title,
  description,
  routeBase,
  createHref,
  createLabel = "+ New Workflow",
}: WorkflowsGridPageProps) {
  const { token, loading: authLoading } = useAuth();
  const router = useRouter();
  const [workflows, setWorkflows] = useState<WorkflowListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
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

  if (authLoading || !token) return null;

  return (
    <PageContainer>
      <PageHeader
        title={title}
        description={description}
        action={
          createHref ? (
            <Link className="control-link" href={createHref}>
              {createLabel}
            </Link>
          ) : null
        }
      />

      {error ? (
        <p style={{ marginBottom: "16px", borderRadius: "10px", border: "1px solid rgba(239, 68, 68, 0.3)", background: "rgba(239, 68, 68, 0.1)", padding: "12px 16px", fontSize: "14px", color: "#fca5a5" }}>
          {error}
        </p>
      ) : null}

      <PageSection>
        {isLoading ? (
          <div style={{ borderRadius: "10px", border: "1px solid var(--border-muted)", background: "var(--surface-1)", padding: "64px 24px", textAlign: "center", fontSize: "14px", color: "var(--text-secondary)" }}>
            Loading workflows...
          </div>
        ) : workflows.length === 0 ? (
          <div style={{ borderRadius: "10px", border: "1px solid var(--border-muted)", background: "var(--surface-1)", padding: "64px 24px", textAlign: "center", fontSize: "14px", color: "var(--text-secondary)" }}>
            No workflows available.
          </div>
        ) : (
          <div style={{ display: "grid", gap: "16px", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))" }}>
            {workflows.map((workflow) => (
              <Link
                key={workflow.id}
                href={`${routeBase}/${workflow.id}`}
                style={{
                  display: "block",
                  borderRadius: "10px",
                  border: "1px solid var(--border-muted)",
                  background: "var(--surface-1)",
                  boxShadow: "var(--shadow-1)",
                  padding: "20px",
                }}
              >
                <h3 style={{ margin: "0 0 8px", fontSize: "16px", fontWeight: 600, color: "var(--text-primary)" }}>
                  {workflow.name}
                </h3>
                <p style={{ margin: "0 0 16px", fontSize: "14px", color: "var(--text-secondary)" }}>
                  {workflow.description || "No description"}
                </p>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <span
                    style={{
                      borderRadius: "6px",
                      border: workflow.status === "active" ? "1px solid rgba(16, 185, 129, 0.35)" : "1px solid rgba(245, 158, 11, 0.35)",
                      background: workflow.status === "active" ? "rgba(16, 185, 129, 0.15)" : "rgba(245, 158, 11, 0.15)",
                      color: workflow.status === "active" ? "#6ee7b7" : "#fde68a",
                      padding: "4px 10px",
                      fontSize: "12px",
                      fontWeight: 600,
                    }}
                  >
                    {workflow.status}
                  </span>
                  <span style={{ fontSize: "14px", color: "var(--text-secondary)" }}>
                    Open
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </PageSection>
    </PageContainer>
  );
}
