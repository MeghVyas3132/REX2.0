"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api, type AdminTenantClient } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";

export default function AdminTenantsPage() {
  const { token, loading: authLoading } = useAuth();
  const router = useRouter();
  const [tenants, setTenants] = useState<AdminTenantClient[]>([]);
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
        const res = await api.admin.listTenants(token);
        setTenants(res.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load tenants");
      } finally {
        setIsLoading(false);
      }
    };

    void load();
  }, [authLoading, token, router]);

  if (authLoading || !token) return null;

  return (
    <section className="control-header">
      <h1>Tenants</h1>
      <p>Inspect plan, trust status, and route into detailed governance controls.</p>
      {error ? <p className="control-error">{error}</p> : null}

      {isLoading ? <article className="control-card control-skeleton" /> : null}

      <div className="control-card">
        <table className="control-table">
          <thead>
            <tr><th>Name</th><th>Plan</th><th>Status</th><th>Actions</th></tr>
          </thead>
          <tbody>
            {!isLoading && tenants.length === 0 ? (
              <tr>
                <td colSpan={4}><p className="control-empty">No tenants found for this environment.</p></td>
              </tr>
            ) : null}
            {tenants.map((tenant) => {
              const status = tenant.isActive ? "active" : "inactive";
              return (
                <tr key={tenant.id}>
                  <td>{tenant.name}</td>
                  <td>{tenant.planTier ?? "starter"}</td>
                  <td>
                    <span className={status === "inactive" ? "control-badge control-badge--warn" : "control-badge"}>
                      {status}
                    </span>
                  </td>
                  <td><Link className="control-link" href={`/admin/tenants/${tenant.id}`}>View</Link></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
