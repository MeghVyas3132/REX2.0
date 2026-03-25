"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api";
import type { ExecutionDetail, ExecutionStepClient } from "@/lib/api";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import { getDashboardNavItems } from "@/components/layout/dashboard-nav";

export default function ExecutionDetailPage() {
  const { user, token, loading: authLoading } = useAuth();
  const [execution, setExecution] = useState<ExecutionDetail | null>(null);
  const [steps, setSteps] = useState<ExecutionStepClient[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedStep, setExpandedStep] = useState<string | null>(null);
  const router = useRouter();
  const params = useParams();
  const workflowId = params.id as string;
  const executionId = params.executionId as string;

  useEffect(() => {
    if (authLoading) return;
    if (!token) {
      router.push("/login");
      return;
    }
    loadData();
  }, [authLoading, token, executionId]);

  async function loadData() {
    if (!token) return;
    try {
      const res = await api.executions.get(token, executionId);
      setExecution(res.data);
      setSteps(res.data.steps);
    } catch {
      router.push(`/dashboard/workflows/${workflowId}`);
    } finally {
      setLoading(false);
    }
  }

  if (authLoading || loading || !execution) return null;

  return (
    <AppShell
      title="Execution Detail"
      subtitle={`ID: ${execution.id.slice(0, 12)}...`}
      navItems={getDashboardNavItems("workflows")}
      userName={user?.name}
      onSignOut={() => router.push("/login")}
    >
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "12px", marginBottom: "24px" }}>
        <div style={{ backgroundColor: "var(--bg-secondary)", borderRadius: "6px", padding: "14px", border: "1px solid var(--border-color)" }}>
          <span style={{ display: "block", fontSize: "11px", color: "var(--text-tertiary)", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "4px" }}>Status</span>
          <span style={{ fontSize: "14px", color: "var(--text-primary)", fontWeight: 500 }}>{execution.status}</span>
        </div>
        <div style={{ backgroundColor: "var(--bg-secondary)", borderRadius: "6px", padding: "14px", border: "1px solid var(--border-color)" }}>
          <span style={{ display: "block", fontSize: "11px", color: "var(--text-tertiary)", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "4px" }}>Started</span>
          <span style={{ fontSize: "14px", color: "var(--text-primary)" }}>
            {execution.startedAt ? new Date(execution.startedAt).toLocaleString() : "-"}
          </span>
        </div>
        <div style={{ backgroundColor: "var(--bg-secondary)", borderRadius: "6px", padding: "14px", border: "1px solid var(--border-color)" }}>
          <span style={{ display: "block", fontSize: "11px", color: "var(--text-tertiary)", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "4px" }}>Finished</span>
          <span style={{ fontSize: "14px", color: "var(--text-primary)" }}>
            {execution.finishedAt ? new Date(execution.finishedAt).toLocaleString() : "-"}
          </span>
        </div>
      </div>

      <h2 style={{ fontSize: "16px", fontWeight: 600, marginBottom: "12px" }}>Steps ({steps.length})</h2>
      {steps.length === 0 ? (
        <p style={{ color: "var(--text-tertiary)" }}>No steps recorded.</p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
          {steps.map((step, i) => (
            <div key={step.id} style={{ backgroundColor: "var(--bg-secondary)", borderRadius: "6px", border: "1px solid var(--border-color)", overflow: "hidden" }}>
              <button
                onClick={() => setExpandedStep(expandedStep === step.id ? null : step.id)}
                style={{
                  width: "100%",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "12px 14px",
                  border: "none",
                  background: "none",
                  cursor: "pointer",
                  color: "var(--text-primary)",
                }}
              >
                <span style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <span style={{ fontSize: "12px", color: "var(--text-tertiary)" }}>#{i + 1}</span>
                  <span style={{ fontSize: "12px", fontWeight: 500 }}>{step.nodeId}</span>
                  <span style={{ fontSize: "11px", color: "var(--text-tertiary)" }}>{step.nodeType}</span>
                </span>
                <span style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  {step.durationMs && <span style={{ fontSize: "12px", color: "var(--text-tertiary)" }}>{step.durationMs}ms</span>}
                  <span style={{ fontSize: "11px", fontWeight: 500, textTransform: "uppercase" }}>{step.status}</span>
                </span>
              </button>

              {expandedStep === step.id && (
                <div style={{ borderTop: "1px solid var(--border-color)", padding: "12px 14px", backgroundColor: "var(--bg-primary)", fontSize: "13px" }}>
                  {step.error && (
                    <div style={{ marginBottom: "12px" }}>
                      <div style={{ fontSize: "11px", color: "var(--text-tertiary)", textTransform: "uppercase", marginBottom: "4px" }}>Error</div>
                      <pre style={{ margin: 0, backgroundColor: "var(--bg-secondary)", padding: "8px", borderRadius: "4px", overflow: "auto", whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
                        {step.error}
                      </pre>
                    </div>
                  )}
                  {step.input && (
                    <div style={{ marginBottom: "12px" }}>
                      <div style={{ fontSize: "11px", color: "var(--text-tertiary)", textTransform: "uppercase", marginBottom: "4px" }}>Input</div>
                      <pre style={{ margin: 0, backgroundColor: "var(--bg-secondary)", padding: "8px", borderRadius: "4px", overflow: "auto", whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
                        {JSON.stringify(step.input, null, 2)}
                      </pre>
                    </div>
                  )}
                  {step.output && (
                    <div>
                      <div style={{ fontSize: "11px", color: "var(--text-tertiary)", textTransform: "uppercase", marginBottom: "4px" }}>Output</div>
                      <pre style={{ margin: 0, backgroundColor: "var(--bg-secondary)", padding: "8px", borderRadius: "4px", overflow: "auto", whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
                        {JSON.stringify(step.output, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <div style={{ marginTop: "24px", display: "flex", gap: "8px" }}>
        <Link href="/dashboard" className="control-link">← Back to Workflows</Link>
      </div>
    </AppShell>
  );
}
