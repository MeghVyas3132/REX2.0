"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { api, type PluginCatalogueClient, type PluginCategoryClient } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { PageContainer, PageHeader, PageSection } from "@/components/layout";

type ByokTier = "required" | "optional" | "system";

const CATEGORY_LABELS: Record<string, string> = {
  ai_llm: "AI + LLM",
  communication: "Communication",
  business_crm: "Business + CRM",
  developer: "Developer",
  data_storage: "Data Storage",
  trigger: "Triggers",
  logic_control: "Logic + Control",
  compliance_rex: "Compliance (REX)",
  india_stack: "India Stack",
};

function getByokTier(plugin: PluginCatalogueClient): ByokTier {
  const hints = plugin.rexHints as { byokTier?: string } | null;
  if (hints?.byokTier === "required" || hints?.byokTier === "optional" || hints?.byokTier === "system") {
    return hints.byokTier;
  }
  return plugin.isBuiltin ? "system" : "optional";
}

function getTagList(plugin: PluginCatalogueClient): string[] {
  const hints = plugin.rexHints as { tags?: unknown } | null;
  if (Array.isArray(hints?.tags)) {
    return hints.tags.filter((value): value is string => typeof value === "string");
  }
  return [];
}

export default function StudioPluginsPage() {
  const { token, loading: authLoading } = useAuth();
  const router = useRouter();
  const [plugins, setPlugins] = useState<PluginCatalogueClient[]>([]);
  const [categories, setCategories] = useState<PluginCategoryClient[]>([]);
  const [activeCategory, setActiveCategory] = useState<"all" | PluginCategoryClient>("all");
  const [onlyByokRequired, setOnlyByokRequired] = useState(false);
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

  const filteredPlugins = useMemo(() => {
    return plugins.filter((plugin) => {
      if (activeCategory !== "all" && plugin.category !== activeCategory) return false;
      if (onlyByokRequired && getByokTier(plugin) !== "required") return false;
      return plugin.isActive;
    });
  }, [plugins, activeCategory, onlyByokRequired]);

  const byokRequiredCount = useMemo(
    () => plugins.filter((plugin) => getByokTier(plugin) === "required" && plugin.isActive).length,
    [plugins]
  );

  const categoryCountMap = useMemo(() => {
    const map = new Map<PluginCategoryClient, number>();
    for (const category of categories) {
      map.set(category, plugins.filter((plugin) => plugin.category === category && plugin.isActive).length);
    }
    return map;
  }, [categories, plugins]);

  if (authLoading || !token) return null;

  return (
    <PageContainer>
      <PageHeader
        title="Node Registry"
        description={`${plugins.filter((p) => p.isActive).length} plugins across ${categories.length} categories. Click any card to open plugin details.`}
      />

      {error && <p style={{ color: "#f87171" }}>{error}</p>}

      <PageSection title="Filters" subtitle="Browse by category or focus only on BYOK-required plugins">
        <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginBottom: "12px" }}>
          <button
            type="button"
            onClick={() => setActiveCategory("all")}
            style={{
              padding: "8px 12px",
              borderRadius: "999px",
              border: "1px solid rgba(255,255,255,0.2)",
              background: activeCategory === "all" ? "#3b82f6" : "rgba(255,255,255,0.06)",
              color: "#fff",
              cursor: "pointer",
            }}
          >
            All ({plugins.filter((p) => p.isActive).length})
          </button>
          {categories.map((category) => (
            <button
              key={category}
              type="button"
              onClick={() => setActiveCategory(category)}
              style={{
                padding: "8px 12px",
                borderRadius: "999px",
                border: "1px solid rgba(255,255,255,0.2)",
                background: activeCategory === category ? "#3b82f6" : "rgba(255,255,255,0.06)",
                color: "#fff",
                cursor: "pointer",
              }}
            >
              {CATEGORY_LABELS[category] ?? category} ({categoryCountMap.get(category) ?? 0})
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={() => setOnlyByokRequired((prev) => !prev)}
          style={{
            padding: "8px 12px",
            borderRadius: "999px",
            border: "1px solid rgba(255,255,255,0.2)",
            background: onlyByokRequired ? "#ef4444" : "rgba(255,255,255,0.06)",
            color: "#fff",
            cursor: "pointer",
          }}
        >
          {onlyByokRequired ? "Showing BYOK Required" : "Show Only BYOK Required"} ({byokRequiredCount})
        </button>
      </PageSection>

      <PageSection title="Plugin Catalogue">
        {isLoading ? (
          <div style={{ color: "rgba(255,255,255,0.65)", padding: "24px 0" }}>Loading registry...</div>
        ) : filteredPlugins.length === 0 ? (
          <div style={{ color: "rgba(255,255,255,0.65)", padding: "24px 0" }}>No plugins match the selected filters.</div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "14px" }}>
            {filteredPlugins.map((plugin) => {
              const byokTier = getByokTier(plugin);
              const tags = getTagList(plugin);
              const hints = plugin.rexHints as { crossBorder?: boolean; piiRisk?: string; requiresConsentGate?: boolean } | null;
              return (
                <Link
                  key={plugin.slug}
                  href={`/studio/plugins/${plugin.slug}`}
                  style={{
                    textDecoration: "none",
                    color: "inherit",
                    background: "rgba(255,255,255,0.05)",
                    border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: "10px",
                    padding: "16px",
                    display: "block",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", gap: "10px", marginBottom: "8px" }}>
                    <h3 style={{ margin: 0, color: "#fff", fontSize: "16px" }}>{plugin.name}</h3>
                    <span style={{ fontSize: "11px", color: "#cbd5e1" }}>{plugin.version}</span>
                  </div>
                  <p style={{ margin: "0 0 12px", color: "rgba(255,255,255,0.7)", fontSize: "13px" }}>
                    {plugin.description ?? "No description"}
                  </p>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                    <span style={{ fontSize: "11px", padding: "4px 8px", borderRadius: "999px", background: "rgba(59,130,246,0.2)", color: "#bfdbfe" }}>
                      {CATEGORY_LABELS[plugin.category] ?? plugin.category}
                    </span>
                    <span style={{ fontSize: "11px", padding: "4px 8px", borderRadius: "999px", background: byokTier === "required" ? "rgba(239,68,68,0.2)" : byokTier === "optional" ? "rgba(245,158,11,0.2)" : "rgba(16,185,129,0.2)", color: "#fff" }}>
                      {byokTier === "required" ? "BYOK Required" : byokTier === "optional" ? "BYOK Optional" : "System"}
                    </span>
                    {hints?.crossBorder ? (
                      <span style={{ fontSize: "11px", padding: "4px 8px", borderRadius: "999px", background: "rgba(168,85,247,0.2)", color: "#e9d5ff" }}>
                        Cross-border
                      </span>
                    ) : null}
                    {hints?.piiRisk ? (
                      <span style={{ fontSize: "11px", padding: "4px 8px", borderRadius: "999px", background: hints.piiRisk === "high" ? "rgba(239,68,68,0.2)" : hints.piiRisk === "medium" ? "rgba(245,158,11,0.2)" : "rgba(34,197,94,0.2)", color: "#fff" }}>
                        PII {hints.piiRisk}
                      </span>
                    ) : null}
                    {hints?.requiresConsentGate ? (
                      <span style={{ fontSize: "11px", padding: "4px 8px", borderRadius: "999px", background: "rgba(14,116,144,0.25)", color: "#a5f3fc" }}>
                        Consent Gate
                      </span>
                    ) : null}
                    {tags.slice(0, 2).map((tag) => (
                      <span key={tag} style={{ fontSize: "11px", padding: "4px 8px", borderRadius: "999px", background: "rgba(148,163,184,0.2)", color: "#e2e8f0" }}>
                        {tag}
                      </span>
                    ))}
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </PageSection>
    </PageContainer>
  );
}
