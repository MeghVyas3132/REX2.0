"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api";
import type { WorkflowListItem } from "@/lib/api";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function DashboardPage() {
  const { user, token, loading: authLoading, logout } = useAuth();
  const [workflows, setWorkflows] = useState<WorkflowListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    if (authLoading) return;
    if (!token) {
      router.push("/login");
      return;
    }
    loadWorkflows();
  }, [authLoading, token]);

  async function loadWorkflows() {
    if (!token) return;
    try {
      const res = await api.workflows.list(token);
      setWorkflows(res.data);
    } catch {
      // Handle error silently, show empty state
    } finally {
      setLoading(false);
    }
  }

  if (authLoading || !token) return null;

  return (
    <div style={styles.layout}>
      {/* Sidebar */}
      <nav style={styles.sidebar}>
        <div style={styles.brand}>REX</div>
        <div style={styles.navLinks}>
          <Link href="/dashboard" style={styles.navLinkActive}>Workflows</Link>
          <Link href="/dashboard/templates" style={styles.navLink}>Templates</Link>
          <Link href="/dashboard/settings" style={styles.navLink}>Settings</Link>
        </div>
        <div style={styles.userSection}>
          <span style={styles.userName}>{user?.name}</span>
          <button onClick={logout} style={styles.logoutBtn}>Sign Out</button>
        </div>
      </nav>

      {/* Main Content */}
      <main style={styles.main}>
        <div style={styles.header}>
          <h1 style={styles.heading}>Workflows</h1>
          <Link href="/dashboard/workflows/new" style={styles.createBtn}>
            New Workflow
          </Link>
        </div>

        {loading ? (
          <p style={styles.muted}>Loading...</p>
        ) : workflows.length === 0 ? (
          <div style={styles.emptyState}>
            <p style={styles.emptyTitle}>No workflows yet</p>
            <p style={styles.muted}>Create your first workflow to get started.</p>
          </div>
        ) : (
          <div style={styles.grid}>
            {workflows.map((wf) => (
              <Link
                key={wf.id}
                href={`/dashboard/workflows/${wf.id}`}
                style={styles.card}
              >
                <div style={styles.cardHeader}>
                  <span style={styles.cardName}>{wf.name}</span>
                  <span
                    style={{
                      ...styles.statusBadge,
                      color: wf.status === "active" ? "#22c55e" : "#666666",
                      borderColor: wf.status === "active" ? "#22c55e" : "#333333",
                    }}
                  >
                    {wf.status}
                  </span>
                </div>
                <p style={styles.cardDesc}>{wf.description || "No description"}</p>
                <div style={styles.cardMeta}>
                  <span>v{wf.version}</span>
                  <span>{new Date(wf.updatedAt).toLocaleDateString()}</span>
                </div>
                {wf.sourceTemplateId ? (
                  <div style={styles.templateMeta}>
                    Template: {wf.sourceTemplateId}
                    {wf.sourceTemplateVersion ? ` (v${wf.sourceTemplateVersion})` : ""}
                  </div>
                ) : null}
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
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
    transition: "color 0.15s",
  },
  navLinkActive: {
    padding: "10px 12px",
    borderRadius: "6px",
    backgroundColor: "#1a1a1a",
    color: "#e5e5e5",
    fontSize: "14px",
    textDecoration: "none",
    fontWeight: 500,
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
    transition: "color 0.15s",
  },
  main: {
    flex: 1,
    padding: "32px 40px",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "32px",
  },
  heading: {
    fontSize: "24px",
    fontWeight: 600,
    color: "#e5e5e5",
  },
  createBtn: {
    padding: "10px 20px",
    backgroundColor: "#e5e5e5",
    color: "#0a0a0a",
    borderRadius: "6px",
    fontSize: "13px",
    fontWeight: 600,
    textDecoration: "none",
    transition: "opacity 0.15s",
  },
  muted: {
    color: "#666666",
    fontSize: "14px",
  },
  emptyState: {
    textAlign: "center",
    padding: "80px 0",
  },
  emptyTitle: {
    fontSize: "18px",
    color: "#999999",
    marginBottom: "8px",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
    gap: "16px",
  },
  card: {
    backgroundColor: "#111111",
    border: "1px solid #2a2a2a",
    borderRadius: "8px",
    padding: "20px",
    textDecoration: "none",
    transition: "border-color 0.15s",
    cursor: "pointer",
  },
  cardHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "8px",
  },
  cardName: {
    fontSize: "15px",
    fontWeight: 600,
    color: "#e5e5e5",
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
  cardDesc: {
    fontSize: "13px",
    color: "#666666",
    marginBottom: "12px",
    lineHeight: "1.4",
  },
  cardMeta: {
    display: "flex",
    justifyContent: "space-between",
    fontSize: "12px",
    color: "#444444",
  },
  templateMeta: {
    marginTop: "8px",
    fontSize: "11px",
    color: "#6b7280",
  },
};
