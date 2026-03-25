"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { PageContainer, PageHeader, PageSection } from "@/components/layout";
import { MetricTile } from "@/components/dashboard/MetricTile";
import { ActionTile } from "@/components/dashboard/ActionTile";

export default function AdminPage() {
  const { token, loading: authLoading } = useAuth();
  const router = useRouter();
  const [tenantsCount, setTenantsCount] = useState(0);
  const [nodeCount, setNodeCount] = useState(0);
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
        const [tenantsRes, pluginsRes] = await Promise.all([
          api.admin.listTenants(token),
          api.admin.listPlugins(token),
        ]);
        setTenantsCount(tenantsRes.data.length);
        setNodeCount(pluginsRes.data.length);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load admin dashboard");
      } finally {
        setIsLoading(false);
      }
    };

    void load();
  }, [authLoading, token, router]);

  if (authLoading || !token) return null;

  return (
    <PageContainer>
      <PageHeader
        title="System Administration"
        description="Manage tenants, nodes, and global settings"
      />

      {error ? (
        <p style={{ marginBottom: "16px", borderRadius: "10px", border: "1px solid rgba(239, 68, 68, 0.3)", background: "rgba(239, 68, 68, 0.1)", padding: "12px 16px", fontSize: "14px", color: "#fca5a5" }}>
          {error}
        </p>
      ) : null}

      {isLoading ? (
        <PageSection>
          <div style={{ borderRadius: "10px", border: "1px solid var(--border-muted)", background: "var(--surface-1)", padding: "64px 24px", textAlign: "center", fontSize: "14px", color: "var(--text-secondary)" }}>
            Loading dashboard...
          </div>
        </PageSection>
      ) : (
        <>
          <PageSection title="Quick Stats">
            <div style={{ display: "grid", gap: "20px", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))" }}>
              <MetricTile
                label="Active Tenants"
                value={tenantsCount}
                hint="Organizations in the system"
                tone="blue"
              />
              <MetricTile
                label="Registered Nodes"
                value={nodeCount}
                hint="Available workflow node types"
                tone="blue"
              />
            </div>
          </PageSection>

          <PageSection title="Quick Links">
            <div style={{ display: "grid", gap: "12px", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))" }}>
              <ActionTile href="/admin/tenants" label="Manage Tenants" />
              <ActionTile href="/admin" label="Node Registry" />
            </div>
          </PageSection>
        </>
      )}
    </PageContainer>
  );
}
