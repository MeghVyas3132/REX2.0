"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { api, type PluginCatalogueClient } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";

export default function AdminPluginsPage() {
  const { token, loading: authLoading } = useAuth();
  const router = useRouter();
  const [plugins, setPlugins] = useState<PluginCatalogueClient[]>([]);
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
        const res = await api.admin.listPlugins(token);
        setPlugins(res.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load plugin catalogue");
      } finally {
        setIsLoading(false);
      }
    };

    void load();
  }, [authLoading, token, router]);

  const published = useMemo(() => plugins.filter((item) => item.isActive).length, [plugins]);
  const inReview = useMemo(() => plugins.filter((item) => !item.isPublic).length, [plugins]);
  const deprecated = useMemo(() => plugins.filter((item) => !item.isActive).length, [plugins]);

  if (authLoading || !token) return null;

  return (
    <section className="control-header">
      <h1>Plugin Catalogue</h1>
      <p>Manage global plugin quality gates, release channels, and visibility rules.</p>
      {error ? <p className="control-error">{error}</p> : null}

      {isLoading ? (
        <div className="control-grid" aria-label="Loading plugin metrics">
          <article className="control-card control-skeleton" />
          <article className="control-card control-skeleton" />
          <article className="control-card control-skeleton" />
        </div>
      ) : null}

      {!isLoading && plugins.length === 0 ? <p className="control-empty">No plugins are currently registered.</p> : null}

      {!isLoading ? <div className="control-grid">
        <article className="control-card">
          <h2>Published</h2>
          <p className="control-kpi">{published}</p>
          <p>Catalogued integrations approved for tenant consumption.</p>
        </article>
        <article className="control-card">
          <h2>Private</h2>
          <p className="control-kpi">{inReview}</p>
          <p>Internal plugin definitions not yet exposed publicly.</p>
        </article>
        <article className="control-card">
          <h2>Deprecated</h2>
          <p className="control-kpi">{deprecated}</p>
          <p>Legacy adapters retained only for migration windows.</p>
        </article>
      </div> : null}
    </section>
  );
}
