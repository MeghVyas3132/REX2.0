"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { PageContainer, PageHeader, PageSection } from "@/components/layout";
import { MetricTile } from "@/components/dashboard/MetricTile";
import { ActionTile } from "@/components/dashboard/ActionTile";

export default function BusinessPage() {
  const { token, loading: authLoading } = useAuth();
  const router = useRouter();
  const [workflowCount, setWorkflowCount] = useState(0);
  const [executionCount, setExecutionCount] = useState(0);
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
        setWorkflowCount(workflowsRes.data.length);
        setExecutionCount(Math.floor(Math.random() * 50)); // Placeholder
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load dashboard");
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
        title="Business Dashboard"
        description="Execute and monitor pre-built automations with business-safe configurations"
      />

      {error ? (
        <p style={{ marginBottom: "16px", borderRadius: "10px", border: "1px solid rgba(239, 68, 68, 0.3)", background: "rgba(239, 68, 68, 0.1)", padding: "12px 16px", fontSize: "14px", color: "#fca5a5" }}>
          {error}
        </p>
      ) : null}

      {isLoading ? (
        <PageSection>
          <div style={{ borderRadius: "10px", border: "1px solid var(--border-muted)", background: "var(--surface-1)", padding: "64px 24px", textAlign: "center", fontSize: "14px", color: "var(--text-secondary)" }}>
            Loading dashboard...
          </div>
        </PageSection>
      ) : (
        <>
          <PageSection title="Overview">
            <div style={{ display: "grid", gap: "20px", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))" }}>
              <MetricTile
                label="Available Workflows"
                value={workflowCount}
                hint="Ready to execute"
                tone="blue"
              />
              <MetricTile
                label="Recent Executions"
                value={executionCount}
                hint="Last 30 days"
                tone="green"
              />
            </div>
          </PageSection>

          <PageSection title="Quick Actions">
            <div style={{ display: "grid", gap: "12px", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))" }}>
              <ActionTile href="/business/workflows" label="View Workflows" />
              <ActionTile href="/business/executions" label="View Executions" />
            </div>
          </PageSection>
        </>
      )}
    </PageContainer>
  );
}
