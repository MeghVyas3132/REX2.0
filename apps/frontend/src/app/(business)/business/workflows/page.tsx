"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { PageContainer, PageHeader, PageSection } from "@/components/layout";

export default function BusinessWorkflowsPage() {
  const { token, loading: authLoading } = useAuth();
  const router = useRouter();
  const [workflows, setWorkflows] = useState<Array<{ id: string; name: string; description: string; status: string }>>([]);
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
        setWorkflows(
          workflowsRes.data.map((item) => ({
            id: item.id,
            name: item.name,
            description: item.description || "No description",
            status: item.status,
          }))
        );
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
        title="Workflows"
        description="View and interact with available workflows"
      />

      {error && <p style={{ color: "#f87171" }}>{error}</p>}

      <PageSection>
        {isLoading ? (
          <div style={{ textAlign: "center", padding: "40px", color: "rgba(255,255,255,0.6)" }}>
            Loading workflows...
          </div>
        ) : workflows.length === 0 ? (
          <div style={{ textAlign: "center", padding: "40px", color: "rgba(255,255,255,0.6)" }}>
            <p>No workflows available</p>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "16px" }}>
            {workflows.map((workflow) => (
              <Link
                key={workflow.id}
                href={`/business/workflows/${workflow.id}`}
                style={{
                  display: "block",
                  padding: "20px",
                  background: "rgba(255,255,255,0.05)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: "8px",
                  cursor: "pointer",
                  textDecoration: "none",
                  color: "inherit",
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
                <h3 style={{ margin: "0 0 8px 0", color: "#fff" }}>{workflow.name}</h3>
                <p style={{ margin: "0 0 12px 0", fontSize: "14px", color: "rgba(255,255,255,0.6)" }}>
                  {workflow.description}
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
                  <span style={{ fontSize: "14px", color: "#3b82f6" }}>Open →</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </PageSection>
    </PageContainer>
  );
}
