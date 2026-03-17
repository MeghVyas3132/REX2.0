"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api";
import type { ActiveWorkflowExecutionClient } from "@/lib/api";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AppShell, getDashboardNavItems } from "@/components/layout";
import { Badge, Button, Card, StateBlock } from "@/components/ui";

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
    <AppShell
      title="Active Workflows"
      subtitle="Live execution monitor for currently running workflows. Auto-refresh updates every 3 seconds."
      navItems={getDashboardNavItems("active-workflows")}
      userName={user?.name}
      onSignOut={logout}
      action={<span className="rex-active-refresh-tag">Auto refresh: 3s</span>}
    >
      {error ? (
        <StateBlock tone="error" title="Unable to load active executions" description={error} />
      ) : null}

      {loading ? (
        <StateBlock tone="loading" title="Loading active workflows" description="Polling active execution state every 3 seconds." />
      ) : items.length === 0 ? (
        <Card title="No active workflows" subtitle="No executions are currently running.">
          <Link href="/dashboard" className="rex-link-reset">
            <Button variant="secondary">Open Workflows</Button>
          </Link>
        </Card>
      ) : (
        <div style={listStyle}>
          {items.map((item) => (
            <Card key={item.executionId}>
              <div style={cardTopStyle}>
                <Link href={`/dashboard/workflows/${item.workflowId}`} style={titleLinkStyle}>
                  {item.workflowName}
                </Link>
                <Badge tone={item.executionStatus === "running" ? "success" : "warning"}>
                  {item.executionStatus}
                </Badge>
              </div>
              <div style={metaStyle}>Workflow ID: {item.workflowId}</div>
              <div style={metaStyle}>Execution ID: {item.executionId}</div>
              <div style={metaStyle}>Started: {item.startedAt ? new Date(item.startedAt).toLocaleString() : "-"}</div>
              <div style={actionsStyle}>
                <Link href={`/dashboard/workflows/${item.workflowId}/executions/${item.executionId}`} className="rex-link-reset">
                  <Button size="sm" variant="secondary">Open Execution</Button>
                </Link>
              </div>
            </Card>
          ))}
        </div>
      )}
    </AppShell>
  );
}

const listStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fill, minmax(360px, 1fr))",
  gap: 12,
};

const cardTopStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: 8,
  gap: 12,
};

const titleLinkStyle: React.CSSProperties = {
  color: "var(--text-primary)",
  textDecoration: "none",
  fontWeight: 600,
  fontSize: 15,
};

const metaStyle: React.CSSProperties = {
  color: "var(--text-tertiary)",
  fontSize: 12,
  marginBottom: 4,
  fontFamily: "ui-monospace, SFMono-Regular, 'SF Mono', Menlo, monospace",
};

const actionsStyle: React.CSSProperties = {
  marginTop: 10,
};
