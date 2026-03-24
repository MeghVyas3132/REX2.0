"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { api, type WorkflowTemplateClient } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";

function labelForBusiness(template: WorkflowTemplateClient): string {
  const joined = template.tags.join(" ").toLowerCase();
  if (joined.includes("marketing")) return "Marketing automation";
  if (joined.includes("email")) return "Email workflows";
  if (joined.includes("crm") || joined.includes("sales")) return "CRM integrations";
  return "Business automation";
}

export default function BusinessPage() {
  const { token, loading: authLoading } = useAuth();
  const router = useRouter();
  const [templates, setTemplates] = useState<WorkflowTemplateClient[]>([]);
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
        const res = await api.templates.list(token);
        setTemplates(res.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load business templates");
      } finally {
        setIsLoading(false);
      }
    };

    void load();
  }, [authLoading, token, router]);

  const avgSetupMinutes = useMemo(() => {
    if (!templates.length) return 0;
    return 4;
  }, [templates.length]);

  if (authLoading || !token) return null;

  return (
    <section className="control-header business-home page-reveal">
      <p className="business-home__kicker">Rex Business</p>
      <h1>Run automations without writing code.</h1>
      <p>
        Start from pre-built templates designed for operations teams. Choose a template,
        connect a few inputs, and launch confidently.
      </p>

      {error ? <p className="control-error">{error}</p> : null}

      {isLoading ? (
        <div className="business-home__stats" aria-label="Loading business metrics">
          <article className="control-card control-skeleton" />
          <article className="control-card control-skeleton" />
          <article className="control-card control-skeleton" />
        </div>
      ) : null}

      {!isLoading ? <div className="business-home__stats" aria-label="Business summary metrics">
        <article className="control-card business-home__stat-card">
          <h2>Templates Available</h2>
          <p className="control-kpi">{templates.length}</p>
          <p>Curated automations sourced from backend template definitions.</p>
        </article>
        <article className="control-card business-home__stat-card">
          <h2>Average Setup Time</h2>
          <p className="control-kpi">{avgSetupMinutes} min</p>
          <p>Guided setup with minimal fields and no workflow editing required.</p>
        </article>
        <article className="control-card business-home__stat-card">
          <h2>Certified by Studio</h2>
          <p className="control-kpi">100%</p>
          <p>Every template includes trust checks and production-safe defaults.</p>
        </article>
      </div> : null}

      <section className="business-home__template-section" aria-label="Business templates">
        <div className="business-home__template-header">
          <h2>Pre-built automation templates</h2>
          <p>Pick a template to start with built-in defaults and guided configuration.</p>
        </div>

        {!isLoading && templates.length === 0 ? (
          <article className="control-card">
            <p className="control-empty">No business-ready templates are available yet.</p>
          </article>
        ) : null}

        <div className="business-home__template-grid">
          {templates.map((template) => (
            <article key={template.id} className="control-card business-template-card">
              <p className="business-template-card__category">{labelForBusiness(template)}</p>
              <h3>{template.name}</h3>
              <p>{template.description}</p>
              <div className="business-template-card__footer">
                <span>{template.maturity}</span>
                <Link className="control-link" href={`/business/workflows?template=${template.id}`}>
                  Use Template
                </Link>
              </div>
            </article>
          ))}
        </div>
      </section>

      <article className="control-card business-home__quick-actions">
        <h3>Quick actions</h3>
        <ul className="control-list">
          <li>
            <span>View all published workflows</span>
            <Link className="control-link" href="/business/workflows">Open</Link>
          </li>
          <li>
            <span>Track execution history</span>
            <Link className="control-link" href="/business/history">View log</Link>
          </li>
        </ul>
      </article>
    </section>
  );
}
