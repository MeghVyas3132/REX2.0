"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api, type AdminTenantClient, type AdminTenantMetricsClient, type TenantPlanClient } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";

type TenantDetailProps = {
  params: Promise<{ id: string }>;
};

export default function AdminTenantDetailPage({ params }: TenantDetailProps) {
  const { token, loading: authLoading } = useAuth();
  const router = useRouter();
  const [tenantId, setTenantId] = useState<string>("");
  const [tenant, setTenant] = useState<AdminTenantClient | null>(null);
  const [metrics, setMetrics] = useState<AdminTenantMetricsClient>({ users: 0, workflows: 0, executions: 0 });
  const [planName, setPlanName] = useState<string>("starter");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const resolveParams = async () => {
      const p = await params;
      setTenantId(p.id);
    };
    void resolveParams();
  }, [params]);

  useEffect(() => {
    if (authLoading || !tenantId) return;
    if (!token) {
      router.push("/login");
      return;
    }

    const load = async () => {
      try {
        setError(null);
        const [tenantRes, metricsRes, planRes] = await Promise.all([
          api.admin.getTenant(token, tenantId),
          api.admin.getTenantMetrics(token, tenantId),
          api.admin.getTenantPlan(token, tenantId),
        ]);

        const tenantData = tenantRes.data;
        setTenant(tenantData);
        setMetrics(metricsRes.data ?? { users: 0, workflows: 0, executions: 0 });

        const plan: TenantPlanClient | null = planRes.data;
        setPlanName(plan?.planName ?? tenantData?.planTier ?? "starter");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load tenant details");
      } finally {
        setIsLoading(false);
      }
    };

    void load();
  }, [authLoading, token, tenantId, router]);

  if (authLoading || !token) return null;

  return (
    <section className="control-header">
      <h1>{tenant?.name ?? "Tenant Detail"}</h1>
      <p>Overview, users, plugins, billing posture, and compliance evidence timeline.</p>
      {error ? <p className="control-error">{error}</p> : null}

      {isLoading ? (
        <div className="control-grid" aria-label="Loading tenant detail">
          <article className="control-card control-skeleton" />
          <article className="control-card control-skeleton" />
          <article className="control-card control-skeleton" />
        </div>
      ) : null}

      {!isLoading && !tenant && !error ? <p className="control-empty">Tenant not found.</p> : null}

      {!isLoading && tenant ? <div className="control-grid">
        <article className="control-card">
          <h2>Plan</h2>
          <p className="control-kpi">{planName}</p>
          <p>Current commercial tier and policy allocation.</p>
        </article>
        <article className="control-card">
          <h2>Workflows</h2>
          <p className="control-kpi">{metrics.workflows ?? 0}</p>
          <p>Total workflow definitions owned by this tenant.</p>
        </article>
        <article className="control-card">
          <h2>Active Users</h2>
          <p className="control-kpi">{metrics.users ?? 0}</p>
          <p>Tenant memberships currently provisioned.</p>
        </article>
      </div> : null}
    </section>
  );
}
