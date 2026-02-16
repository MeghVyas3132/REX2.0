"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api";
import type { WorkflowTemplateClient } from "@/lib/api";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function TemplatesPage() {
  const { user, token, loading: authLoading, logout } = useAuth();
  const [templates, setTemplates] = useState<WorkflowTemplateClient[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");
  const router = useRouter();

  useEffect(() => {
    if (authLoading) return;
    if (!token) {
      router.push("/login");
      return;
    }
    void loadTemplates();
  }, [authLoading, token, router]);

  async function loadTemplates(): Promise<void> {
    if (!token) return;
    setLoading(true);
    setError("");
    try {
      const res = await api.templates.list(token);
      setTemplates(res.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load templates");
    } finally {
      setLoading(false);
    }
  }

  if (authLoading || !token) return null;

  return (
    <div style={styles.layout}>
      <nav style={styles.sidebar}>
        <div style={styles.brand}>REX</div>
        <div style={styles.navLinks}>
          <Link href="/dashboard" style={styles.navLink}>Workflows</Link>
          <Link href="/dashboard/active-workflows" style={styles.navLink}>Active Workflows</Link>
          <Link href="/dashboard/current-workflow" style={styles.navLink}>Current Workflow</Link>
          <Link href="/dashboard/corpora" style={styles.navLink}>Corpora</Link>
          <Link href="/dashboard/templates" style={styles.navLinkActive}>Templates</Link>
          <Link href="/dashboard/settings" style={styles.navLink}>Settings</Link>
        </div>
        <div style={styles.userSection}>
          <span style={styles.userName}>{user?.name}</span>
          <button onClick={logout} style={styles.logoutBtn}>Sign Out</button>
        </div>
      </nav>

      <main style={styles.main}>
        <div style={styles.header}>
          <h1 style={styles.heading}>Templates</h1>
        </div>

        <p style={styles.subheading}>
          Select a template to open configuration. The pipeline builder is locked until configuration is applied.
        </p>

        {error ? <p style={styles.errorText}>{error}</p> : null}

        {loading ? (
          <p style={styles.muted}>Loading templates...</p>
        ) : templates.length === 0 ? (
          <div style={styles.emptyState}>
            <p style={styles.emptyTitle}>No templates available</p>
            <p style={styles.muted}>Template catalog is currently empty.</p>
          </div>
        ) : (
          <div style={styles.grid}>
            {templates.map((template) => (
              <button
                key={template.id}
                type="button"
                style={styles.card}
                onClick={() => router.push(`/dashboard/templates/${template.id}`)}
              >
                <div style={styles.cardHeader}>
                  <span style={styles.cardName}>{template.name}</span>
                  <span style={styles.version}>v{template.version}</span>
                </div>
                <p style={styles.cardDesc}>{template.description}</p>
                <div style={styles.cardMetaRow}>
                  <span style={styles.metaBadge}>{template.category}</span>
                  <span
                    style={{
                      ...styles.metaBadge,
                      color: template.maturity === "in-progress" ? "#f59e0b" : "#666666",
                      borderColor: template.maturity === "in-progress" ? "#f59e0b" : "#333333",
                    }}
                  >
                    {template.maturity}
                  </span>
                </div>
              </button>
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
  },
  main: {
    flex: 1,
    padding: "32px 40px",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "12px",
  },
  heading: {
    fontSize: "24px",
    fontWeight: 600,
    color: "#e5e5e5",
    margin: 0,
  },
  subheading: {
    color: "#777777",
    fontSize: "14px",
    marginTop: 0,
    marginBottom: "24px",
    maxWidth: "900px",
    lineHeight: 1.5,
  },
  errorText: {
    color: "#ef4444",
    fontSize: "13px",
    marginBottom: "12px",
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
    textAlign: "left",
    backgroundColor: "#111111",
    border: "1px solid #2a2a2a",
    borderRadius: "8px",
    padding: "20px",
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
  version: {
    fontSize: "12px",
    color: "#888888",
  },
  cardDesc: {
    fontSize: "13px",
    color: "#666666",
    marginBottom: "12px",
    lineHeight: 1.45,
  },
  cardMetaRow: {
    display: "flex",
    gap: "8px",
    flexWrap: "wrap",
  },
  metaBadge: {
    fontSize: "11px",
    color: "#999999",
    border: "1px solid #333333",
    borderRadius: "999px",
    padding: "3px 8px",
    textTransform: "capitalize",
  },
};
