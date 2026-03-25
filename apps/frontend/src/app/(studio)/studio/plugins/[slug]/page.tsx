"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { api, type PluginCatalogueClient } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { PageContainer, PageHeader, PageSection } from "@/components/layout";

function safeStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string");
}

export default function StudioPluginDetailPage() {
  const { token, loading: authLoading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const slug = params.slug as string;

  const [plugin, setPlugin] = useState<PluginCatalogueClient | null>(null);
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
        const res = await api.plugins.get(token, slug);
        setPlugin(res.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load plugin details");
      } finally {
        setIsLoading(false);
      }
    };

    void load();
  }, [authLoading, token, router, slug]);

  const byokTier = useMemo(() => {
    const hints = plugin?.rexHints as { byokTier?: string } | null;
    if (hints?.byokTier === "required" || hints?.byokTier === "optional" || hints?.byokTier === "system") {
      return hints.byokTier;
    }
    return plugin?.isBuiltin ? "system" : "optional";
  }, [plugin]);

  const tags = useMemo(() => {
    return safeStringArray((plugin?.rexHints as { tags?: unknown } | undefined)?.tags);
  }, [plugin]);

  const actions = useMemo(() => {
    return safeStringArray((plugin?.manifest as { actions?: unknown } | undefined)?.actions);
  }, [plugin]);

  if (authLoading || !token) return null;

  return (
    <PageContainer>
      <PageHeader
        title={plugin?.name ?? "Plugin Details"}
        description={plugin?.description ?? "View full metadata, compliance hints, and capabilities."}
        action={
          <Link
            href="/studio/plugins"
            style={{
              textDecoration: "none",
              padding: "9px 14px",
              borderRadius: "6px",
              background: "rgba(255,255,255,0.08)",
              color: "#fff",
            }}
          >
            Back to Catalogue
          </Link>
        }
      />

      {error && <p style={{ color: "#f87171" }}>{error}</p>}

      {isLoading ? (
        <PageSection>
          <div style={{ color: "rgba(255,255,255,0.65)", padding: "24px 0" }}>Loading plugin...</div>
        </PageSection>
      ) : plugin ? (
        <>
          <PageSection title="Overview">
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "12px" }}>
              <div style={{ padding: "14px", borderRadius: "8px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.12)" }}>
                <div style={{ color: "rgba(255,255,255,0.6)", fontSize: "12px" }}>Slug</div>
                <div style={{ color: "#fff", marginTop: "4px" }}>{plugin.slug}</div>
              </div>
              <div style={{ padding: "14px", borderRadius: "8px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.12)" }}>
                <div style={{ color: "rgba(255,255,255,0.6)", fontSize: "12px" }}>Category</div>
                <div style={{ color: "#fff", marginTop: "4px" }}>{plugin.category}</div>
              </div>
              <div style={{ padding: "14px", borderRadius: "8px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.12)" }}>
                <div style={{ color: "rgba(255,255,255,0.6)", fontSize: "12px" }}>BYOK Tier</div>
                <div style={{ color: "#fff", marginTop: "4px" }}>{byokTier}</div>
              </div>
              <div style={{ padding: "14px", borderRadius: "8px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.12)" }}>
                <div style={{ color: "rgba(255,255,255,0.6)", fontSize: "12px" }}>Version</div>
                <div style={{ color: "#fff", marginTop: "4px" }}>{plugin.version}</div>
              </div>
            </div>
          </PageSection>

          <PageSection title="Capabilities">
            {actions.length === 0 ? (
              <div style={{ color: "rgba(255,255,255,0.65)" }}>No declared actions.</div>
            ) : (
              <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                {actions.map((action) => (
                  <span key={action} style={{ padding: "6px 10px", borderRadius: "999px", background: "rgba(59,130,246,0.2)", color: "#bfdbfe", fontSize: "12px" }}>
                    {action}
                  </span>
                ))}
              </div>
            )}
          </PageSection>

          <PageSection title="Compliance Hints">
            <pre
              style={{
                margin: 0,
                padding: "14px",
                borderRadius: "8px",
                background: "rgba(2,6,23,0.7)",
                border: "1px solid rgba(148,163,184,0.2)",
                color: "#cbd5e1",
                fontSize: "12px",
                overflowX: "auto",
              }}
            >
              {JSON.stringify(
                {
                  ...plugin.rexHints,
                  tags,
                },
                null,
                2
              )}
            </pre>
          </PageSection>
        </>
      ) : (
        <PageSection>
          <div style={{ color: "rgba(255,255,255,0.65)", padding: "24px 0" }}>Plugin not found.</div>
        </PageSection>
      )}
    </PageContainer>
  );
}
