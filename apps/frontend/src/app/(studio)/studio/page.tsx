"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { PageContainer, PageHeader, PageSection } from "@/components/layout";

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

      {error && <p style={{ color: "#f87171", marginBottom: "20px" }}>{error}</p>}

      {isLoading ? (
        <PageSection>
          <div style={{ textAlign: "center", padding: "40px", color: "rgba(255,255,255,0.6)" }}>
            Loading dashboard...
          </div>
        </PageSection>
      ) : (
        <>
          <PageSection title="Overview">
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "20px" }}>
              <div style={{ padding: "20px", background: "rgba(255,255,255,0.05)", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.1)" }}>
                <h3 style={{ margin: "0 0 8px 0", color: "#fff", fontSize: "14px", fontWeight: "500" }}>Workflows</h3>
                <p style={{ margin: "0 0 8px 0", fontSize: "32px", fontWeight: "bold", color: "#3b82f6" }}>
                  {workflowCount}
                </p>
                <p style={{ margin: "0", fontSize: "13px", color: "rgba(255,255,255,0.6)" }}>
                  In-progress and production-ready definitions
                </p>
              </div>
              <div style={{ padding: "20px", background: "rgba(255,255,255,0.05)", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.1)" }}>
                <h3 style={{ margin: "0 0 8px 0", color: "#fff", fontSize: "14px", fontWeight: "500" }}>Active Runs</h3>
                <p style={{ margin: "0 0 8px 0", fontSize: "32px", fontWeight: "bold", color: "#10b981" }}>
                  {activeCount}
                </p>
                <p style={{ margin: "0", fontSize: "13px", color: "rgba(255,255,255,0.6)" }}>
                  Currently executing in this tenant
                </p>
              </div>
              <div style={{ padding: "20px", background: "rgba(255,255,255,0.05)", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.1)" }}>
                <h3 style={{ margin: "0 0 8px 0", color: "#fff", fontSize: "14px", fontWeight: "500" }}>Templates</h3>
                <p style={{ margin: "0 0 8px 0", fontSize: "32px", fontWeight: "bold", color: "#f59e0b" }}>
                  {templateCount}
                </p>
                <p style={{ margin: "0", fontSize: "13px", color: "rgba(255,255,255,0.6)" }}>
                  Pre-built templates for rapid creation
                </p>
              </div>
            </div>
          </PageSection>

          <PageSection title="Quick Actions">
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "12px" }}>
              <Link
                href="/dashboard/workflows"
                style={{
                  padding: "16px",
                  background: "rgba(59, 130, 246, 0.1)",
                  border: "1px solid #3b82f6",
                  borderRadius: "6px",
                  cursor: "pointer",
                  textDecoration: "none",
                  color: "#3b82f6",
                  textAlign: "center",
                  fontWeight: "500",
                  transition: "all 0.2s ease",
                }}
                onMouseEnter={(e) => {
                  const el = e.currentTarget;
                  el.style.background = "#3b82f6";
                  el.style.color = "#fff";
                }}
                onMouseLeave={(e) => {
                  const el = e.currentTarget;
                  el.style.background = "rgba(59, 130, 246, 0.1)";
                  el.style.color = "#3b82f6";
                }}
              >
                Open Editor
              </Link>
              <Link
                href="/studio/workflows"
                style={{
                  padding: "16px",
                  background: "rgba(59, 130, 246, 0.1)",
                  border: "1px solid #3b82f6",
                  borderRadius: "6px",
                  cursor: "pointer",
                  textDecoration: "none",
                  color: "#3b82f6",
                  textAlign: "center",
                  fontWeight: "500",
                  transition: "all 0.2s ease",
                }}
                onMouseEnter={(e) => {
                  const el = e.currentTarget;
                  el.style.background = "#3b82f6";
                  el.style.color = "#fff";
                }}
                onMouseLeave={(e) => {
                  const el = e.currentTarget;
                  el.style.background = "rgba(59, 130, 246, 0.1)";
                  el.style.color = "#3b82f6";
                }}
              >
                View Workflows
              </Link>
              <Link
                href="/studio/templates"
                style={{
                  padding: "16px",
                  background: "rgba(59, 130, 246, 0.1)",
                  border: "1px solid #3b82f6",
                  borderRadius: "6px",
                  cursor: "pointer",
                  textDecoration: "none",
                  color: "#3b82f6",
                  textAlign: "center",
                  fontWeight: "500",
                  transition: "all 0.2s ease",
                }}
                onMouseEnter={(e) => {
                  const el = e.currentTarget;
                  el.style.background = "#3b82f6";
                  el.style.color = "#fff";
                }}
                onMouseLeave={(e) => {
                  const el = e.currentTarget;
                  el.style.background = "rgba(59, 130, 246, 0.1)";
                  el.style.color = "#3b82f6";
                }}
              >
                Browse Templates
              </Link>
            </div>
          </PageSection>
        </>
      )}
    </PageContainer>
  );
}
