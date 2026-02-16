"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api";
import type { ActiveWorkflowExecutionClient } from "@/lib/api";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function ActiveWorkflowsPage() {
  const { user, token, loading: authLoading, logout } = useAuth();
  const [items, setItems] = useState<ActiveWorkflowExecutionClient[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const router = useRouter();

  useEffect(() => {
    if (authLoading) return;
    if (!token) {
      router.push("/login");
      return;
    }

    void loadActive(token, true);
    const interval = window.setInterval(() => {
      void loadActive(token, false);
    }, 3000);

    return () => window.clearInterval(interval);
  }, [authLoading, token, router]);

  async function loadActive(accessToken: string, initial: boolean): Promise<void> {
    if (initial) setLoading(true);
    setError("");

    try {
      const response = await api.workflows.active(accessToken, 1, 50);
      setItems(response.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load active workflows");
    } finally {
      if (initial) setLoading(false);
    }
  }

  if (authLoading || !token) return null;

  return (
    <div style={styles.layout}>
      <nav style={styles.sidebar}>
        <div style={styles.brand}>REX</div>
        <div style={styles.navLinks}>
          <Link href="/dashboard" style={styles.navLink}>Workflows</Link>
          <Link href="/dashboard/active-workflows" style={styles.navLinkActive}>Active Workflows</Link>
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
        <div style={styles.header}>
          <h1 style={styles.heading}>Active Workflows</h1>
          <span style={styles.refreshTag}>Auto refresh: 3s</span>
        </div>

        {error ? <p style={styles.errorText}>{error}</p> : null}

        {loading ? (
          <p style={styles.muted}>Loading active workflows...</p>
        ) : items.length === 0 ? (
          <p style={styles.muted}>No workflows are currently running.</p>
        ) : (
          <div style={styles.list}>
            {items.map((item) => (
              <div key={item.executionId} style={styles.card}>
                <div style={styles.cardTop}>
                  <Link href={`/dashboard/workflows/${item.workflowId}`} style={styles.titleLink}>
                    {item.workflowName}
                  </Link>
                  <span
                    style={{
                      ...styles.status,
                      color: item.executionStatus === "running" ? "#22c55e" : "#eab308",
                      borderColor: item.executionStatus === "running" ? "#22c55e" : "#eab308",
                    }}
                  >
                    {item.executionStatus}
                  </span>
                </div>
                <div style={styles.meta}>Workflow ID: {item.workflowId}</div>
                <div style={styles.meta}>Execution ID: {item.executionId}</div>
                <div style={styles.meta}>Started: {item.startedAt ? new Date(item.startedAt).toLocaleString() : "-"}</div>
                <div style={styles.actions}>
                  <Link
                    href={`/dashboard/workflows/${item.workflowId}/executions/${item.executionId}`}
                    style={styles.actionLink}
                  >
                    Open Execution
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  layout: { display: "flex", minHeight: "100vh", backgroundColor: "#0a0a0a" },
  sidebar: {
    width: "220px",
    backgroundColor: "#111111",
    borderRight: "1px solid #2a2a2a",
    display: "flex",
    flexDirection: "column",
    padding: "20px 16px",
  },
  brand: { fontSize: "20px", fontWeight: 700, color: "#e5e5e5", letterSpacing: "3px", marginBottom: "32px" },
  navLinks: { display: "flex", flexDirection: "column", gap: "4px", flex: 1 },
  navLink: { padding: "10px 12px", borderRadius: "6px", color: "#999999", fontSize: "14px", textDecoration: "none" },
  navLinkActive: {
    padding: "10px 12px",
    borderRadius: "6px",
    backgroundColor: "#1a1a1a",
    color: "#e5e5e5",
    fontSize: "14px",
    textDecoration: "none",
    fontWeight: 500,
  },
  userSection: { borderTop: "1px solid #2a2a2a", paddingTop: "16px", display: "flex", flexDirection: "column", gap: "8px" },
  userName: { fontSize: "13px", color: "#999999" },
  logoutBtn: {
    background: "none",
    border: "1px solid #2a2a2a",
    color: "#666666",
    padding: "6px 12px",
    borderRadius: "4px",
    cursor: "pointer",
    fontSize: "12px",
  },
  main: { flex: 1, padding: "32px 40px" },
  header: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "18px" },
  heading: { margin: 0, fontSize: "24px", color: "#e5e5e5" },
  refreshTag: { fontSize: "12px", color: "#666666" },
  errorText: { color: "#ef4444", fontSize: "13px", marginBottom: "10px" },
  muted: { color: "#666666", fontSize: "14px" },
  list: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(360px, 1fr))", gap: "12px" },
  card: { background: "#111", border: "1px solid #2a2a2a", borderRadius: "8px", padding: "14px" },
  cardTop: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" },
  titleLink: { color: "#e5e5e5", textDecoration: "none", fontWeight: 600, fontSize: "15px" },
  status: { fontSize: "11px", border: "1px solid", borderRadius: "999px", padding: "3px 8px", textTransform: "uppercase" },
  meta: { color: "#8c8c8c", fontSize: "12px", marginBottom: "4px", fontFamily: "monospace" },
  actions: { marginTop: "10px" },
  actionLink: {
    color: "#cfcfcf",
    border: "1px solid #3a3a3a",
    borderRadius: "6px",
    padding: "6px 10px",
    textDecoration: "none",
    fontSize: "12px",
  },
};
