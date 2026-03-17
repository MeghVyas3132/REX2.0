"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api";
import type { WorkflowTemplateClient } from "@/lib/api";
import { useRouter } from "next/navigation";
import { AppShell, getDashboardNavItems } from "@/components/layout";
import { Badge, StateBlock } from "@/components/ui";

export default function TemplatesPage() {
  const { user, token, loading: authLoading, logout } = useAuth();
  const [templates, setTemplates] = useState<WorkflowTemplateClient[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");
  const router = useRouter();

  useEffect(() => {
    if (authLoading) return;
    if (!token) {
      router.push("/login");
      return;
    }
    void loadTemplates();
  }, [authLoading, token, router]);

  async function loadTemplates(): Promise<void> {
    if (!token) return;
    setLoading(true);
    setError("");
    try {
      const res = await api.templates.list(token);
      setTemplates(res.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load templates");
    } finally {
      setLoading(false);
    }
  }

  if (authLoading || !token) return null;

  return (
    <AppShell
      title="Templates"
      subtitle="Choose a workflow template, configure runtime parameters, then instantiate into an editable workflow."
      navItems={getDashboardNavItems("templates")}
      userName={user?.name}
      onSignOut={logout}
    >
      {error ? (
        <StateBlock tone="error" title="Unable to load templates" description={error} />
      ) : null}

      {loading ? (
        <StateBlock tone="loading" title="Loading templates" description="Preparing the template catalog and metadata." />
      ) : templates.length === 0 ? (
        <StateBlock
          tone="empty"
          title="No templates available"
          description="Template catalog is empty in this environment. Seed templates to accelerate workflow creation."
        />
      ) : (
        <div style={gridStyle}>
          {templates.map((template, index) => (
            <button
              key={template.id}
              type="button"
              className="rex-interactive-card stagger-in"
              style={{ ...cardButtonStyle, animationDelay: `${Math.min(index * 36, 280)}ms` }}
              aria-label={`Open template ${template.name}`}
              aria-describedby={`template-desc-${template.id}`}
              onClick={() => router.push(`/dashboard/templates/${template.id}`)}
              data-template-card
            >
              <div style={cardHeaderStyle}>
                <p style={nameStyle}>{template.name}</p>
                <span style={versionStyle}>v{template.version}</span>
              </div>
              <p id={`template-desc-${template.id}`} style={descStyle}>{template.description}</p>
              <div style={metaRowStyle}>
                <Badge tone="neutral">{template.category}</Badge>
                <Badge tone={template.maturity === "in-progress" ? "warning" : "neutral"}>
                  {template.maturity}
                </Badge>
              </div>
            </button>
          ))}
        </div>
      )}
    </AppShell>
  );
}

const gridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
  gap: 14,
};

const cardButtonStyle: React.CSSProperties = {
  position: "relative",
  textAlign: "left",
  background: "linear-gradient(180deg, var(--surface-1), var(--surface-2))",
  border: "1px solid var(--border-muted)",
  borderRadius: 14,
  padding: 18,
  cursor: "pointer",
  boxShadow: "var(--shadow-1)",
  transition: "transform var(--motion-base), box-shadow var(--motion-base), border-color var(--motion-base)",
  animation: "page-reveal 320ms var(--motion-base) both",
};

const cardHeaderStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: 8,
};

const nameStyle: React.CSSProperties = {
  margin: 0,
  color: "var(--text-primary)",
  fontWeight: 600,
  fontSize: 15,
};

const versionStyle: React.CSSProperties = {
  color: "var(--text-tertiary)",
  fontSize: 12,
};

const descStyle: React.CSSProperties = {
  margin: "0 0 12px",
  color: "var(--text-tertiary)",
  fontSize: 13,
  lineHeight: 1.45,
};

const metaRowStyle: React.CSSProperties = {
  display: "flex",
  gap: 8,
  flexWrap: "wrap",
};
