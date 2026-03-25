"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api, type WorkflowListItem } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { AppShell } from "@/components/layout/AppShell";
import { getDashboardNavItems } from "@/components/layout/dashboard-nav";

export default function DashboardPage() {
  const { user, token, loading: authLoading } = useAuth();
  const router = useRouter();
  const [workflows, setWorkflows] = useState<WorkflowListItem[]>([]);
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
        setWorkflows(workflowsRes.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load workflows");
      } finally {
        setIsLoading(false);
      }
    };

    void load();
  }, [authLoading, token, router]);

  const handleDelete = async (workflowId: string, workflowName: string) => {
    if (!token) return;
    const confirmed = window.confirm(`Delete workflow "${workflowName}"?`);
    if (!confirmed) return;

    try {
      await api.workflows.delete(token, workflowId);
      setWorkflows((prev) => prev.filter((item) => item.id !== workflowId));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete workflow");
    }
  };

  if (authLoading || !token) return null;

  return (
    <AppShell
      title="Workflows"
      subtitle="Design, build, and run intelligent orchestration graphs"
      navItems={getDashboardNavItems("dashboard")}
      userName={user?.name}
      onSignOut={() => router.push("/login")}
      action={
        <Link href="/dashboard/workflows/new" className="control-link">
          + New Workflow
        </Link>
      }
    >
      {error ? <p className="control-error">{error}</p> : null}

      {isLoading ? <p className="control-empty">Loading workflows...</p> : null}

      {!isLoading && workflows.length === 0 ? (
        <div>
          <p className="control-empty">No workflows yet.</p>
          <p>
            <Link href="/dashboard/workflows/new" className="control-link">
              Create your first workflow
            </Link>
          </p>
        </div>
      ) : null}

      {!isLoading && workflows.length > 0 ? (
        <ul className="control-list">
          {workflows.map((workflow) => (
            <li key={workflow.id}>
              <span>
                <strong>{workflow.name}</strong>
                <span style={{ marginLeft: "8px", opacity: 0.7 }}>v{workflow.version}</span>
              </span>
              <span>
                <span className={workflow.status === "active" ? "control-badge" : "control-badge control-badge--warn"}>
                  {workflow.status}
                </span>
                <Link href={`/dashboard/workflows/${workflow.id}`} className="control-link" style={{ marginLeft: "8px" }}>
                  Edit
                </Link>
                <button
                  type="button"
                  className="control-link"
                  style={{ marginLeft: "8px" }}
                  onClick={() => void handleDelete(workflow.id, workflow.name)}
                >
                  Delete
                </button>
              </span>
            </li>
          ))}
        </ul>
      ) : null}
    </AppShell>
  );
}
