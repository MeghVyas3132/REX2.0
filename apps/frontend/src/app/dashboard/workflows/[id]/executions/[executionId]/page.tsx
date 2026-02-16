"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api";
import type { ExecutionDetail, ExecutionStepClient } from "@/lib/api";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";

export default function ExecutionDetailPage() {
  const { user, token, loading: authLoading, logout } = useAuth();
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
    <div style={styles.layout}>
      <nav style={styles.sidebar}>
        <div style={styles.brand}>REX</div>
        <div style={styles.navLinks}>
          <Link href="/dashboard" style={styles.navLink}>Workflows</Link>
          <Link href="/dashboard/active-workflows" style={styles.navLink}>Active Workflows</Link>
          <Link href="/dashboard/current-workflow" style={styles.navLink}>Current Workflow</Link>
          <Link href="/dashboard/corpora" style={styles.navLink}>Corpora</Link>
          <Link href="/dashboard/templates" style={styles.navLink}>Templates</Link>
          <Link href="/dashboard/settings" style={styles.navLink}>Settings</Link>
        </div>
        <div style={styles.userSection}>
          <span style={styles.userName}>{user?.name}</span>
          <button onClick={logout} style={styles.logoutBtn}>Sign Out</button>
        </div>
      </nav>

      <main style={styles.main}>
        <div style={styles.breadcrumb}>
          <Link href="/dashboard" style={styles.breadcrumbLink}>Workflows</Link>
          <span style={styles.sep}>/</span>
          <Link href={`/dashboard/workflows/${workflowId}`} style={styles.breadcrumbLink}>
            {workflowId.slice(0, 8)}...
          </Link>
          <span style={styles.sep}>/</span>
          <span style={styles.breadcrumbCurrent}>Execution</span>
        </div>

        <div style={styles.header}>
          <div>
            <h1 style={styles.heading}>Execution Detail</h1>
            <div style={styles.metaRow}>
              <span style={{ fontFamily: "monospace", fontSize: "12px", color: "#666666" }}>
                {execution.id}
              </span>
            </div>
          </div>
          <span
            style={{
              ...styles.statusBadge,
              color: statusColor(execution.status),
              borderColor: statusColor(execution.status),
            }}
          >
            {execution.status}
          </span>
        </div>

        <div style={styles.infoGrid}>
          <div style={styles.infoItem}>
            <span style={styles.infoLabel}>Status</span>
            <span style={{ color: statusColor(execution.status) }}>{execution.status}</span>
          </div>
          <div style={styles.infoItem}>
            <span style={styles.infoLabel}>Started</span>
            <span style={styles.infoValue}>
              {execution.startedAt ? new Date(execution.startedAt).toLocaleString() : "-"}
            </span>
          </div>
          <div style={styles.infoItem}>
            <span style={styles.infoLabel}>Finished</span>
            <span style={styles.infoValue}>
              {execution.finishedAt ? new Date(execution.finishedAt).toLocaleString() : "-"}
            </span>
          </div>
          {execution.errorMessage && (
            <div style={{ ...styles.infoItem, gridColumn: "1 / -1" }}>
              <span style={styles.infoLabel}>Error</span>
              <span style={{ color: "#ef4444", fontFamily: "monospace", fontSize: "13px" }}>
                {execution.errorMessage}
              </span>
            </div>
          )}
        </div>

        <h2 style={styles.sectionTitle}>Steps ({steps.length})</h2>
        {steps.length === 0 ? (
          <p style={styles.muted}>No steps recorded.</p>
        ) : (
          <div style={styles.stepList}>
            {steps.map((step, i) => (
              <div key={step.id} style={styles.stepCard}>
                <button
                  onClick={() =>
                    setExpandedStep(expandedStep === step.id ? null : step.id)
                  }
                  style={styles.stepHeader}
                >
                  <div style={styles.stepLeft}>
                    <span style={styles.stepIndex}>{i + 1}</span>
                    <span
                      style={{
                        ...styles.stepDot,
                        backgroundColor: statusColor(step.status),
                      }}
                    />
                    <span style={styles.stepNodeId}>{step.nodeId}</span>
                    <span style={styles.stepType}>{step.nodeType}</span>
                  </div>
                  <div style={styles.stepRight}>
                    {step.durationMs !== null && (
                      <span style={styles.stepDuration}>{step.durationMs}ms</span>
                    )}
                    <span
                      style={{
                        color: statusColor(step.status),
                        fontSize: "12px",
                      }}
                    >
                      {step.status}
                    </span>
                  </div>
                </button>

                {expandedStep === step.id && (
                  <div style={styles.stepBody}>
                    {step.error && (
                      <div style={styles.stepSection}>
                        <span style={styles.stepSectionLabel}>Error</span>
                        <pre style={styles.pre}>{step.error}</pre>
                      </div>
                    )}
                    {step.input && (
                      <div style={styles.stepSection}>
                        <span style={styles.stepSectionLabel}>Input</span>
                        <pre style={styles.pre}>
                          {JSON.stringify(step.input, null, 2)}
                        </pre>
                      </div>
                    )}
                    {step.output && (
                      <div style={styles.stepSection}>
                        <span style={styles.stepSectionLabel}>Output</span>
                        <pre style={styles.pre}>
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
      </main>
    </div>
  );
}

function statusColor(status: string): string {
  switch (status) {
    case "completed":
      return "#22c55e";
    case "running":
      return "#eab308";
    case "failed":
      return "#ef4444";
    case "skipped":
      return "#666666";
    default:
      return "#666666";
  }
}

const styles: Record<string, React.CSSProperties> = {
  layout: {
    display: "flex",
    minHeight: "100vh",
    backgroundColor: "#0a0a0a",
  },
  sidebar: {
    width: "220px",
    backgroundColor: "#111111",
    borderRight: "1px solid #2a2a2a",
    display: "flex",
    flexDirection: "column",
    padding: "20px 16px",
  },
  brand: {
    fontSize: "20px",
    fontWeight: 700,
    color: "#e5e5e5",
    letterSpacing: "3px",
    marginBottom: "32px",
  },
  navLinks: {
    display: "flex",
    flexDirection: "column",
    gap: "4px",
    flex: 1,
  },
  navLink: {
    padding: "10px 12px",
    borderRadius: "6px",
    color: "#999999",
    fontSize: "14px",
    textDecoration: "none",
  },
  userSection: {
    borderTop: "1px solid #2a2a2a",
    paddingTop: "16px",
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  },
  userName: {
    fontSize: "13px",
    color: "#999999",
  },
  logoutBtn: {
    background: "none",
    border: "1px solid #2a2a2a",
    color: "#666666",
    padding: "6px 12px",
    borderRadius: "4px",
    cursor: "pointer",
    fontSize: "12px",
  },
  main: {
    flex: 1,
    padding: "32px 40px",
  },
  breadcrumb: {
    marginBottom: "16px",
    fontSize: "13px",
  },
  breadcrumbLink: {
    color: "#666666",
    textDecoration: "none",
  },
  sep: {
    color: "#444444",
    margin: "0 8px",
  },
  breadcrumbCurrent: {
    color: "#999999",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: "24px",
  },
  heading: {
    fontSize: "24px",
    fontWeight: 600,
    color: "#e5e5e5",
    margin: 0,
    marginBottom: "4px",
  },
  metaRow: {
    display: "flex",
    gap: "12px",
  },
  statusBadge: {
    fontSize: "11px",
    fontWeight: 500,
    padding: "2px 8px",
    borderRadius: "4px",
    border: "1px solid",
    textTransform: "uppercase" as const,
    letterSpacing: "0.5px",
  },
  infoGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: "12px",
    marginBottom: "32px",
  },
  infoItem: {
    backgroundColor: "#111111",
    border: "1px solid #2a2a2a",
    borderRadius: "6px",
    padding: "14px",
  },
  infoLabel: {
    display: "block",
    fontSize: "11px",
    color: "#666666",
    textTransform: "uppercase" as const,
    letterSpacing: "0.5px",
    marginBottom: "4px",
  },
  infoValue: {
    fontSize: "14px",
    color: "#cccccc",
  },
  sectionTitle: {
    fontSize: "16px",
    fontWeight: 600,
    color: "#cccccc",
    marginBottom: "12px",
  },
  muted: {
    color: "#666666",
    fontSize: "14px",
  },
  stepList: {
    display: "flex",
    flexDirection: "column",
    gap: "6px",
  },
  stepCard: {
    backgroundColor: "#111111",
    border: "1px solid #2a2a2a",
    borderRadius: "6px",
    overflow: "hidden",
  },
  stepHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    width: "100%",
    padding: "12px 16px",
    background: "none",
    border: "none",
    cursor: "pointer",
    color: "#e5e5e5",
  },
  stepLeft: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
  },
  stepIndex: {
    fontSize: "11px",
    color: "#444444",
    fontFamily: "monospace",
    width: "20px",
  },
  stepDot: {
    width: "8px",
    height: "8px",
    borderRadius: "50%",
  },
  stepNodeId: {
    fontSize: "14px",
    color: "#e5e5e5",
    fontWeight: 500,
  },
  stepType: {
    fontSize: "11px",
    color: "#666666",
    textTransform: "uppercase" as const,
    letterSpacing: "0.5px",
  },
  stepRight: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
  },
  stepDuration: {
    fontSize: "12px",
    color: "#444444",
    fontFamily: "monospace",
  },
  stepBody: {
    borderTop: "1px solid #2a2a2a",
    padding: "16px",
    display: "flex",
    flexDirection: "column",
    gap: "12px",
  },
  stepSection: {},
  stepSectionLabel: {
    display: "block",
    fontSize: "11px",
    color: "#666666",
    textTransform: "uppercase" as const,
    letterSpacing: "0.5px",
    marginBottom: "6px",
  },
  pre: {
    backgroundColor: "#0a0a0a",
    border: "1px solid #1a1a1a",
    borderRadius: "4px",
    padding: "12px",
    fontSize: "12px",
    color: "#999999",
    fontFamily: "monospace",
    overflow: "auto",
    maxHeight: "300px",
    whiteSpace: "pre-wrap",
    wordBreak: "break-all",
    margin: 0,
  },
};
