"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api, type TenantClient, type TenantPlanClient, type TenantUsageClient } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";

export default function StudioSettingsPage() {
  const { token, loading: authLoading } = useAuth();
  const router = useRouter();
  const [tenantName, setTenantName] = useState("Tenant");
  const [planName, setPlanName] = useState("starter");
  const [usage, setUsage] = useState<TenantUsageClient>({ workflows: 0, executionsThisMonth: 0 });
  const [pluginsCount, setPluginsCount] = useState(0);
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
        const [tenantRes, planRes, usageRes, pluginsRes] = await Promise.all([
          api.tenant.get(token),
          api.tenant.getPlan(token),
          api.tenant.getUsage(token),
          api.tenant.listPlugins(token),
        ]);

        const tenant: TenantClient | null = tenantRes.data;
        const plan: TenantPlanClient | null = planRes.data;
        setTenantName(tenant?.name ?? "Tenant");
        setPlanName(plan?.planName ?? "starter");
        setUsage(usageRes.data ?? { workflows: 0, executionsThisMonth: 0 });
        setPluginsCount(pluginsRes.data.length);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load tenant settings");
      } finally {
        setIsLoading(false);
      }
    };

    void load();
  }, [authLoading, token, router]);

  if (authLoading || !token) return null;

  return (
    <section className="control-header">
      <h1>{tenantName} Settings</h1>
      <p>Manage team access, compliance modes, spending limits, and BYOK providers.</p>
      {error ? <p className="control-error">{error}</p> : null}

      {isLoading ? (
        <div className="control-grid" aria-label="Loading tenant settings">
          <article className="control-card control-skeleton" />
          <article className="control-card control-skeleton" />
          <article className="control-card control-skeleton" />
        </div>
      ) : null}

      {!isLoading ? <div className="control-grid">
        <article className="control-card">
          <h2>Plan</h2>
          <p className="control-kpi">{planName}</p>
          <p>Current tenant plan and entitlement envelope.</p>
        </article>
        <article className="control-card">
          <h2>Workflows</h2>
          <p className="control-kpi">{usage.workflows ?? 0}</p>
          <p>Total workflow count in this tenant.</p>
        </article>
        <article className="control-card">
          <h2>Enabled Plugins</h2>
          <p className="control-kpi">{pluginsCount}</p>
          <p>Tenant-enabled plugin nodes and integrations.</p>
        </article>
      </div> : null}
    </section>
  );
}
