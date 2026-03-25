"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { api, type PluginCatalogueClient } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { AppShell } from "@/components/layout/AppShell";
import { getAdminNavItems } from "@/components/layout/admin-nav";

export default function AdminPluginsPage() {
  const { user, token, loading: authLoading } = useAuth();
  const router = useRouter();
  const [plugins, setPlugins] = useState<PluginCatalogueClient[]>([]);
  const [slug, setSlug] = useState("");
  const [name, setName] = useState("");
  const [category, setCategory] = useState<PluginCatalogueClient["category"]>("logic_control");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
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

  async function reload(): Promise<void> {
    if (!token) return;
    const res = await api.admin.listPlugins(token);
    setPlugins(res.data);
  }

  async function handleCreate(): Promise<void> {
    if (!token || !slug.trim() || !name.trim()) return;
    setIsSaving(true);
    setError(null);
    try {
      await api.admin.createPlugin(token, {
        slug: slug.trim(),
        name: name.trim(),
        category,
        description: "Super admin registered node",
        manifest: { kind: "node_registry", generatedBy: "super_admin" },
      });
      setSlug("");
      setName("");
      await reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create node registry entry");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDeactivate(itemSlug: string): Promise<void> {
    if (!token) return;
    setIsSaving(true);
    setError(null);
    try {
      await api.admin.updatePlugin(token, itemSlug, { isActive: false });
      await reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to deactivate node registry entry");
    } finally {
      setIsSaving(false);
    }
  }

  if (authLoading || !token) return null;

  return (
    <AppShell
      brand="REX Admin"
      title="Node Registry"
      subtitle="Generate and retire global node definitions that can be assigned to tenant plans"
      navItems={getAdminNavItems("plugins")}
      userName={user?.name}
      onSignOut={() => router.push("/login")}
    >
      {error ? <p className="control-error">{error}</p> : null}

      <article className="control-card">
        <h2>Create node entry</h2>
        <div className="control-form-grid">
          <label>
            Slug
            <input value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="node.custom-transform" />
          </label>
          <label>
            Name
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Custom Transform" />
          </label>
          <label>
            Category
            <select value={category} onChange={(e) => setCategory(e.target.value as PluginCatalogueClient["category"])}>
              <option value="logic_control">logic_control</option>
              <option value="trigger">trigger</option>
              <option value="developer">developer</option>
              <option value="business_crm">business_crm</option>
            </select>
          </label>
        </div>
        <button className="control-link" type="button" onClick={() => void handleCreate()} disabled={isSaving || !slug.trim() || !name.trim()}>
          {isSaving ? "Saving…" : "Generate node"}
        </button>
      </article>

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

      {!isLoading && plugins.length > 0 ? (
        <article className="control-card">
          <h2>Registered nodes</h2>
          <ul className="control-list">
            {plugins.map((item) => (
              <li key={item.slug}>
                <span>
                  <strong>{item.name}</strong> ({item.slug})
                </span>
                <span>
                  <span className={item.isActive ? "control-badge" : "control-badge control-badge--warn"}>
                    {item.isActive ? "active" : "inactive"}
                  </span>
                  {item.isActive ? (
                    <button className="control-link" type="button" onClick={() => void handleDeactivate(item.slug)} disabled={isSaving}>
                      Delete
                    </button>
                  ) : null}
                </span>
              </li>
            ))}
          </ul>
        </article>
      ) : null}
    </AppShell>
  );
}
