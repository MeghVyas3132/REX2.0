"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { PageContainer, PageHeader, PageSection } from "@/components/layout";
import { MetricTile } from "@/components/dashboard/MetricTile";
import { ActionTile } from "@/components/dashboard/ActionTile";

export default function StudioPage() {
  const { token, loading: authLoading } = useAuth();
  const router = useRouter();
  const [workflowCount, setWorkflowCount] = useState(0);
  const [activeCount, setActiveCount] = useState(0);
  const [templateCount, setTemplateCount] = useState(0);
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
        const [workflowsRes, activeRes, templatesRes] = await Promise.all([
          api.workflows.list(token, 1, 100),
          api.workflows.active(token, 1, 100),
          api.templates.list(token),
        ]);
        setWorkflowCount(workflowsRes.data.length);
        setActiveCount(activeRes.data.length);
        setTemplateCount(templatesRes.data.length);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load studio dashboard");
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
        title="Studio Dashboard"
        description="Design automation graphs, pressure-test trust posture, and ship certified workflows"
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
                label="Workflows"
                value={workflowCount}
                hint="In-progress and production-ready definitions"
                tone="blue"
              />
              <MetricTile
                label="Active Runs"
                value={activeCount}
                hint="Currently executing in this tenant"
                tone="green"
              />
              <MetricTile
                label="Templates"
                value={templateCount}
                hint="Pre-built templates for rapid creation"
                tone="amber"
              />
            </div>
          </PageSection>

          <PageSection title="Quick Actions">
            <div style={{ display: "grid", gap: "12px", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))" }}>
              <ActionTile href="/dashboard/workflows" label="Open Editor" />
              <ActionTile href="/studio/workflows" label="View Workflows" />
              <ActionTile href="/studio/templates" label="Browse Templates" />
            </div>
          </PageSection>
        </>
      )}
    </PageContainer>
  );
}
