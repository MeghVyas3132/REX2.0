"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";

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
    <section className="control-header">
      <h1>Studio Dashboard</h1>
      <p>Design automation graphs, pressure-test trust posture, and ship certified workflows.</p>
      {error ? <p className="control-error">{error}</p> : null}

      {isLoading ? (
        <div className="control-grid" aria-label="Loading studio dashboard metrics">
          <article className="control-card control-skeleton" />
          <article className="control-card control-skeleton" />
          <article className="control-card control-skeleton" />
        </div>
      ) : null}

      {!isLoading ? <div className="control-grid">
        <article className="control-card">
          <h2>Workflows</h2>
          <p className="control-kpi">{workflowCount}</p>
          <p>In-progress and production-ready workflow definitions.</p>
        </article>
        <article className="control-card">
          <h2>Active Runs</h2>
          <p className="control-kpi">{activeCount}</p>
          <p>Currently running workflows in this tenant.</p>
        </article>
        <article className="control-card">
          <h2>Pre-built Templates</h2>
          <p className="control-kpi">{templateCount}</p>
          <p>Template catalogue available for rapid workflow creation.</p>
        </article>
      </div> : null}
      <article className="control-card">
        <h3>Quick actions</h3>
        <ul className="control-list">
          <li>
            <span>Open advanced workflow editor</span>
            <Link className="control-link" href="/dashboard/workflows">Open</Link>
          </li>
          <li>
            <span>Instantiate a pre-built template</span>
            <Link className="control-link" href="/dashboard/templates">Browse</Link>
          </li>
        </ul>
      </article>
    </section>
  );
}
