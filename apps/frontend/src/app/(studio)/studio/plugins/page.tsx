"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { api, type PluginCatalogueClient, type PluginCategoryClient } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";

export default function StudioPluginsPage() {
  const { token, loading: authLoading } = useAuth();
  const router = useRouter();
  const [plugins, setPlugins] = useState<PluginCatalogueClient[]>([]);
  const [categories, setCategories] = useState<PluginCategoryClient[]>([]);
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
        const [pluginsRes, categoriesRes] = await Promise.all([
          api.plugins.list(token),
          api.plugins.categories(token),
        ]);
        setPlugins(pluginsRes.data);
        setCategories(categoriesRes.data ?? []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load node registry");
      } finally {
        setIsLoading(false);
      }
    };

    void load();
  }, [authLoading, token, router]);

  const activePlugins = useMemo(() => plugins.filter((item) => item.isActive).length, [plugins]);
  const privatePlugins = useMemo(() => plugins.filter((item) => !item.isPublic).length, [plugins]);
  const builtinPlugins = useMemo(() => plugins.filter((item) => item.isBuiltin).length, [plugins]);

  if (authLoading || !token) return null;

  return (
    <section className="control-header">
      <h1>Node Registry</h1>
      <p>Browse published nodes from the plugin catalogue and enable them in Studio workflows.</p>
      {error ? <p className="control-error">{error}</p> : null}

      {isLoading ? (
        <div className="control-grid" aria-label="Loading node registry metrics">
          <article className="control-card control-skeleton" />
          <article className="control-card control-skeleton" />
          <article className="control-card control-skeleton" />
        </div>
      ) : null}

      {!isLoading ? <div className="control-grid">
        <article className="control-card">
          <h2>Active Nodes</h2>
          <p className="control-kpi">{activePlugins}</p>
          <p>Plugin-backed node definitions currently enabled for this tenant.</p>
        </article>
        <article className="control-card">
          <h2>Private Nodes</h2>
          <p className="control-kpi">{privatePlugins}</p>
          <p>Internal or unpublished nodes not visible in the public catalogue.</p>
        </article>
        <article className="control-card">
          <h2>Built-in Nodes</h2>
          <p className="control-kpi">{builtinPlugins}</p>
          <p>Core platform nodes shipped and maintained by REX.</p>
        </article>
      </div> : null}

      <article className="control-card">
        <h3>Available categories</h3>
        <div className="control-list">
          <li>
            <span>{categories.length ? categories.join(" · ") : "No categories available"}</span>
            <span className="control-badge">{categories.length}</span>
          </li>
        </div>
      </article>

      <article className="control-card">
        <h3>Published nodes</h3>
        {!isLoading && plugins.length === 0 ? <p className="control-empty">No node plugins are currently available.</p> : null}
        <table className="control-table">
          <thead>
            <tr><th>Name</th><th>Category</th><th>Visibility</th><th>Status</th></tr>
          </thead>
          <tbody>
            {plugins.map((plugin) => (
              <tr key={plugin.slug}>
                <td>{plugin.name ?? plugin.slug}</td>
                <td>{plugin.category ?? "uncategorized"}</td>
                <td>{plugin.isPublic ? "public" : "private"}</td>
                <td>
                  <span className={plugin.isActive ? "control-badge" : "control-badge control-badge--warn"}>
                    {plugin.isActive ? "active" : "inactive"}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </article>
    </section>
  );
}
