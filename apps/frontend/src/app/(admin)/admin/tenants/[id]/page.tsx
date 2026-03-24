"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  api,
  type AdminTenantClient,
  type AdminTenantMetricsClient,
  type TenantPlanClient,
  type TenantUserMembershipClient,
} from "@/lib/api";
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
  const [memberships, setMemberships] = useState<TenantUserMembershipClient[]>([]);
  const [planName, setPlanName] = useState<string>("starter");
  const [allowedNodeTypes, setAllowedNodeTypes] = useState<string>("");
  const [allowedTemplateIds, setAllowedTemplateIds] = useState<string>("");
  const [planSaving, setPlanSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

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
        const [tenantRes, metricsRes, planRes, usersRes] = await Promise.all([
          api.admin.getTenant(token, tenantId),
          api.admin.getTenantMetrics(token, tenantId),
          api.admin.getTenantPlan(token, tenantId),
          api.admin.listTenantUsers(token, tenantId),
        ]);

        const tenantData = tenantRes.data;
        setTenant(tenantData);
        setMetrics(metricsRes.data ?? { users: 0, workflows: 0, executions: 0 });

        const plan: TenantPlanClient | null = planRes.data;
        setPlanName(plan?.planName ?? tenantData?.planTier ?? "starter");
        setAllowedNodeTypes((plan?.allowedNodeTypes ?? []).join(", "));
        const rawTemplates = plan?.customLimits?.["allowedTemplateIds"];
        const templateIds = Array.isArray(rawTemplates)
          ? rawTemplates.filter((item): item is string => typeof item === "string")
          : [];
        setAllowedTemplateIds(templateIds.join(", "));
        setMemberships(usersRes.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load tenant details");
      } finally {
        setIsLoading(false);
      }
    };

    void load();
  }, [authLoading, token, tenantId, router]);

  async function handleSavePlan(): Promise<void> {
    if (!token || !tenantId) return;
    setPlanSaving(true);
    setError(null);
    setNotice(null);
    try {
      const parseList = (value: string) =>
        value
          .split(",")
          .map((item) => item.trim())
          .filter((item) => item.length > 0);

      await api.admin.setTenantPlan(token, tenantId, {
        planName,
        allowedNodeTypes: parseList(allowedNodeTypes),
        allowedTemplateIds: parseList(allowedTemplateIds),
      });
      setNotice("Tenant plan updated.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update tenant plan");
    } finally {
      setPlanSaving(false);
    }
  }

  if (authLoading || !token) return null;

  return (
    <section className="control-header">
      <h1>{tenant?.name ?? "Tenant Detail"}</h1>
      <p>Overview, users, plugins, billing posture, and compliance evidence timeline.</p>
      {error ? <p className="control-error">{error}</p> : null}
      {notice ? <p className="control-kicker">{notice}</p> : null}

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

      {!isLoading && tenant ? (
        <article className="control-card">
          <h3>Node Access</h3>
          <p>Allowed node types for this tenant (comma-separated):</p>
          <div className="control-form-grid">
            <label>
              Node types
              <input
                value={allowedNodeTypes}
                onChange={(e) => setAllowedNodeTypes(e.target.value)}
                placeholder="llm.generate, knowledge.query"
              />
            </label>
          </div>
          <button className="control-link" type="button" onClick={() => void handleSavePlan()} disabled={planSaving}>
            {planSaving ? "Saving…" : "Update"}
          </button>
        </article>
      ) : null}

      {!isLoading && tenant ? (
        <article className="control-card">
          <h2>Tenant users</h2>
          {memberships.length === 0 ? <p className="control-empty">No users found for this tenant.</p> : null}
          <ul className="control-list">
            {memberships.map((member) => (
              <li key={member.userId}>
                <span>
                  <strong>{member.name ?? member.userId}</strong>
                  {member.email ? ` (${member.email})` : ""}
                </span>
                <span>{member.tenantRole} · {member.interfaceAccess}</span>
              </li>
            ))}
          </ul>
        </article>
      ) : null}
    </section>
  );
}
