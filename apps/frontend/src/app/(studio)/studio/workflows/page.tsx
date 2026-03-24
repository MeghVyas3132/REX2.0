"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";

export default function StudioWorkflowsPage() {
  const { token, loading: authLoading } = useAuth();
  const router = useRouter();
  const [workflowItems, setWorkflowItems] = useState<Array<{ id: string; name: string; status: string }>>([]);
  const [templatesCount, setTemplatesCount] = useState(0);
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
        const [workflowsRes, templatesRes] = await Promise.all([
          api.workflows.list(token, 1, 20),
          api.templates.list(token),
        ]);
        setWorkflowItems(workflowsRes.data.map((item) => ({ id: item.id, name: item.name, status: item.status })));
        setTemplatesCount(templatesRes.data.length);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load workflows");
      } finally {
        setIsLoading(false);
      }
    };

    void load();
  }, [authLoading, token, router]);

  if (authLoading || !token) return null;

  return (
    <section className="control-header">
      <h1>Studio Workflows</h1>
      <p>Open existing workflows, or start from one of the backend-published templates.</p>
      {error ? <p className="control-error">{error}</p> : null}

      {isLoading ? (
        <div className="control-grid" aria-label="Loading studio workflow summaries">
          <article className="control-card control-skeleton" />
          <article className="control-card control-skeleton" />
        </div>
      ) : null}

      {!isLoading ? <div className="control-grid">
        <article className="control-card">
          <h2>Saved Workflows</h2>
          <p className="control-kpi">{workflowItems.length}</p>
          <p>Workflow definitions currently available in your tenant.</p>
        </article>
        <article className="control-card">
          <h2>Pre-built Templates</h2>
          <p className="control-kpi">{templatesCount}</p>
          <p>Template catalogue available for instant instantiation.</p>
        </article>
      </div> : null}

      <article className="control-card">
        <h3>Recent workflows</h3>
        <ul className="control-list">
          {!isLoading && workflowItems.length === 0 ? (
            <li>
              <span className="control-empty">No workflows found. Create one from the dashboard editor.</span>
            </li>
          ) : null}
          {workflowItems.slice(0, 6).map((workflow) => (
            <li key={workflow.id}>
              <span>{workflow.name}</span>
              <span className={workflow.status === "active" ? "control-badge" : "control-badge control-badge--warn"}>
                {workflow.status}
              </span>
            </li>
          ))}
        </ul>
        <p><Link className="control-link" href="/dashboard/workflows">Open dashboard workflow editor</Link></p>
        <p><Link className="control-link" href="/dashboard/templates">Browse pre-built templates</Link></p>
      </article>
    </section>
  );
}
