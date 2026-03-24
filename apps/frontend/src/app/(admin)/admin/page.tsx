"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { PageContainer, PageHeader, PageSection } from "@/components/layout";

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

      {error && <p style={{ color: "#f87171", marginBottom: "20px" }}>{error}</p>}

      {isLoading ? (
        <PageSection>
          <div style={{ textAlign: "center", padding: "40px", color: "rgba(255,255,255,0.6)" }}>
            Loading dashboard...
          </div>
        </PageSection>
      ) : (
        <>
          <PageSection title="Quick Stats">
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "20px" }}>
              <div style={{ padding: "20px", background: "rgba(255,255,255,0.05)", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.1)" }}>
                <h3 style={{ margin: "0 0 8px 0", color: "#fff" }}>Active Tenants</h3>
                <p style={{ margin: "0 0 12px 0", fontSize: "32px", fontWeight: "bold", color: "#3b82f6" }}>
                  {tenantsCount}
                </p>
                <p style={{ margin: "0", fontSize: "14px", color: "rgba(255,255,255,0.6)" }}>
                  Organizations in the system
                </p>
              </div>
              <div style={{ padding: "20px", background: "rgba(255,255,255,0.05)", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.1)" }}>
                <h3 style={{ margin: "0 0 8px 0", color: "#fff" }}>Registered Nodes</h3>
                <p style={{ margin: "0 0 12px 0", fontSize: "32px", fontWeight: "bold", color: "#3b82f6" }}>
                  {nodeCount}
                </p>
                <p style={{ margin: "0", fontSize: "14px", color: "rgba(255,255,255,0.6)" }}>
                  Available workflow node types
                </p>
              </div>
            </div>
          </PageSection>

          <PageSection title="Quick Links">
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "12px" }}>
              <Link
                href="/admin/tenants"
                style={{
                  padding: "16px",
                  background: "rgba(59, 130, 246, 0.1)",
                  border: "1px solid #3b82f6",
                  borderRadius: "6px",
                  cursor: "pointer",
                  textDecoration: "none",
                  color: "#3b82f6",
                  textAlign: "center",
                  fontWeight: "500",
                  transition: "all 0.2s ease",
                }}
                onMouseEnter={(e) => {
                  const el = e.currentTarget;
                  el.style.background = "#3b82f6";
                  el.style.color = "#fff";
                }}
                onMouseLeave={(e) => {
                  const el = e.currentTarget;
                  el.style.background = "rgba(59, 130, 246, 0.1)";
                  el.style.color = "#3b82f6";
                }}
              >
                Manage Tenants
              </Link>
              <Link
                href="/admin"
                style={{
                  padding: "16px",
                  background: "rgba(59, 130, 246, 0.1)",
                  border: "1px solid #3b82f6",
                  borderRadius: "6px",
                  cursor: "pointer",
                  textDecoration: "none",
                  color: "#3b82f6",
                  textAlign: "center",
                  fontWeight: "500",
                  transition: "all 0.2s ease",
                }}
                onMouseEnter={(e) => {
                  const el = e.currentTarget;
                  el.style.background = "#3b82f6";
                  el.style.color = "#fff";
                }}
                onMouseLeave={(e) => {
                  const el = e.currentTarget;
                  el.style.background = "rgba(59, 130, 246, 0.1)";
                  el.style.color = "#3b82f6";
                }}
              >
                Node Registry
              </Link>
            </div>
          </PageSection>
        </>
      )}
    </PageContainer>
  );
}
