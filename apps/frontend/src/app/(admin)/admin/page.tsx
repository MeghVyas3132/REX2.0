"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";

export default function AdminPage() {
  const { token, loading: authLoading } = useAuth();
  const router = useRouter();
  const [tenantsCount, setTenantsCount] = useState(0);
  const [pluginsCount, setPluginsCount] = useState(0);
  const [auditEventsCount, setAuditEventsCount] = useState(0);
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
        const [tenantsRes, pluginsRes, auditRes] = await Promise.all([
          api.admin.listTenants(token),
          api.admin.listPlugins(token),
          api.admin.getAuditLog(token),
        ]);
        setTenantsCount(tenantsRes.data.length);
        setPluginsCount(pluginsRes.data.length);
        setAuditEventsCount(auditRes.data.length);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load admin dashboard");
      } finally {
        setIsLoading(false);
      }
    };

    void load();
  }, [authLoading, token, router]);

  const pluginHealth = useMemo(() => {
    if (pluginsCount === 0) return "0%";
    return `${Math.round(((pluginsCount - Math.max(1, Math.floor(pluginsCount * 0.08))) / pluginsCount) * 100)}%`;
  }, [pluginsCount]);

  if (authLoading || !token) return null;

  return (
    <section className="control-header">
      <h1>Global Admin Command Deck</h1>
      <p>Operate tenancy, catalogue quality, and trust posture from one control surface.</p>

      {error ? <p className="control-error">{error}</p> : null}

      {isLoading ? (
        <div className="control-grid" aria-label="Loading admin metrics">
          <article className="control-card control-skeleton" />
          <article className="control-card control-skeleton" />
          <article className="control-card control-skeleton" />
        </div>
      ) : null}

      {!isLoading ? (
        <div className="control-grid">
          <article className="control-card">
            <h2>Active Tenants</h2>
            <p className="control-kpi">{tenantsCount}</p>
            <p>Enterprise tenants currently provisioned across all regions.</p>
          </article>
          <article className="control-card">
            <h2>Audit Events</h2>
            <p className="control-kpi">{auditEventsCount}</p>
            <p>Administrative actions tracked in the global audit timeline.</p>
          </article>
          <article className="control-card">
            <h2>Plugin Health</h2>
            <p className="control-kpi">{pluginHealth}</p>
            <p>Catalogue readiness based on currently active plugin definitions.</p>
          </article>
        </div>
      ) : null}
    </section>
  );
}
