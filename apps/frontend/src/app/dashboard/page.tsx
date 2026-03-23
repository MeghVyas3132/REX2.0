"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api";
import type { WorkflowListItem } from "@/lib/api";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { loadWorkflowDraft, clearWorkflowDraft } from "@/lib/workflow-draft";
import { AppShell, getDashboardNavItems } from "@/components/layout";
import { Badge, Button, StateBlock } from "@/components/ui";

export default function DashboardPage() {
  const { user, token, loading: authLoading, logout } = useAuth();
  const [workflows, setWorkflows] = useState<WorkflowListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingWorkflowId, setDeletingWorkflowId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    if (authLoading) return;
    if (!token) {
      router.push("/login");
      return;
    }
    void loadWorkflows();
  }, [authLoading, token]);

  async function loadWorkflows() {
    if (!token) return;
    try {
      const [workflowRes, activeRes] = await Promise.all([
        api.workflows.list(token),
        api.workflows.active(token, 1, 100),
      ]);
      const activeWorkflowIds = new Set(activeRes.data.map((item) => item.workflowId));
      setWorkflows(workflowRes.data.filter((workflow) => !activeWorkflowIds.has(workflow.id)));
    } catch {
      // keep empty state
    } finally {
      setLoading(false);
    }
  }

  async function handleDeleteWorkflow(workflowId: string, workflowName: string) {
    if (!token || deletingWorkflowId) return;
    const confirmed = window.confirm(
      `Delete workflow "${workflowName}"? This will also remove all related executions and data.`
    );
    if (!confirmed) return;
    setDeletingWorkflowId(workflowId);
    setError(null);
    try {
      await api.workflows.delete(token, workflowId);
      setWorkflows((prev) => prev.filter((wf) => wf.id !== workflowId));
      const draft = loadWorkflowDraft();
      if (draft?.mode === "update" && draft.workflowId === workflowId) {
        clearWorkflowDraft();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete workflow");
    } finally {
      setDeletingWorkflowId(null);
    }
  }

  if (authLoading || !token) return null;

  const totalWorkflows = workflows.length;
  const activeCount = 0; // active workflows are filtered out; shown on active-workflows page

  return (
    <AppShell
      title="Workflows"
      subtitle="Design, build, and run intelligent orchestration graphs."
      navItems={getDashboardNavItems("workflows")}
      userName={user?.name}
      onSignOut={logout}
      action={
        <Link href="/dashboard/workflows/new" className="rex-link-reset">
          <Button variant="primary">
            <span className="wf-btn-icon" aria-hidden="true"><PlusIcon /></span>
            New Workflow
          </Button>
        </Link>
      }
    >
      {/* Decorative background canvas */}
      <div className="wf-canvas-bg" aria-hidden="true">
        <CanvasDots />
      </div>

      <div className="w-full max-w-5xl mx-auto space-y-6">
        {error ? (
          <StateBlock tone="error" title="Unable to update workflows" description={error} />
        ) : null}

        {/* Stats grid — only show when there are workflows */}
        {!loading && totalWorkflows > 0 && (
          <div className="wf-stats-grid stagger-in" style={{ "--stagger-delay": "40ms" } as React.CSSProperties}>
            <StatCard icon={<GridIcon />} label="Total Workflows" value={String(totalWorkflows)} />
            <StatCard icon={<FlashIcon />} label="Active Workflows" value={String(activeCount)} accent />
            <StatCard icon={<ClockIcon />} label="Last Updated" value={totalWorkflows > 0 ? new Date(Math.max(...workflows.map(w => new Date(w.updatedAt).getTime()))).toLocaleDateString() : "—"} />
          </div>
        )}

        {loading ? (
          <StateBlock tone="loading" title="Loading workflows" description="Syncing saved workflow definitions and execution status." />
        ) : workflows.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="wf-grid">
            {workflows.map((wf, index) => (
              <WorkflowCard
                key={wf.id}
                wf={wf}
                index={index}
                deleting={deletingWorkflowId === wf.id}
                onDelete={() => void handleDeleteWorkflow(wf.id, wf.name)}
              />
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}

/* ─── Sub-components ─────────────────────────────────────────────── */

function StatCard({ icon, label, value, accent }: { icon: React.ReactNode; label: string; value: string; accent?: boolean }) {
  return (
    <div className={`wf-stat-card${accent ? " wf-stat-card--accent" : ""}`}>
      <div className="wf-stat-card__header">
        <span className={`wf-stat-card__icon${accent ? " wf-stat-card__icon--accent" : ""}`} aria-hidden="true">{icon}</span>
      </div>
      <div className="wf-stat-card__content">
        <p className="wf-stat-card__label">{label}</p>
        <p className="wf-stat-card__value">{value}</p>
      </div>
    </div>
  );
}

function WorkflowCard({ wf, index, deleting, onDelete }: {
  wf: WorkflowListItem;
  index: number;
  deleting: boolean;
  onDelete: () => void;
}) {
  return (
    <div
      className="wf-card stagger-in"
      style={{ "--stagger-delay": `${Math.min(index * 50 + 80, 360)}ms` } as React.CSSProperties}
    >
      <Link href={`/dashboard/workflows/${wf.id}`} className="rex-link-reset wf-card__body">
        <div className="wf-card__header">
          <span className="wf-card__icon" aria-hidden="true"><WorkflowNodeIcon /></span>
          <Badge tone={wf.status === "active" ? "success" : "neutral"}>{wf.status}</Badge>
        </div>
        <p className="wf-card__name">{wf.name}</p>
        <p className="wf-card__desc">{wf.description || "No description provided."}</p>
        <div className="wf-card__meta">
          <span>v{wf.version}</span>
          <span>{new Date(wf.updatedAt).toLocaleDateString()}</span>
        </div>
        {wf.sourceTemplateId ? (
          <p className="wf-card__template">
            From template: {wf.sourceTemplateId}
            {wf.sourceTemplateVersion ? ` (v${wf.sourceTemplateVersion})` : ""}
          </p>
        ) : null}
      </Link>
      <div className="wf-card__actions">
        <Link href={`/dashboard/workflows/${wf.id}`} className="rex-link-reset">
          <Button variant="ghost" size="sm">Open</Button>
        </Link>
        <Button
          type="button"
          variant="danger"
          size="sm"
          onClick={onDelete}
          disabled={deleting}
        >
          {deleting ? "Deleting…" : "Delete"}
        </Button>
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="wf-empty stagger-in w-full min-h-[360px] max-h-[480px] p-6 flex flex-col items-center justify-center text-center" style={{ "--stagger-delay": "80ms" } as React.CSSProperties}>
      <div className="wf-empty__illustration" aria-hidden="true">
        <EmptyIllustration />
      </div>
      <div className="wf-empty__body flex flex-col items-center space-y-4 text-center">
        <p className="wf-empty__kicker">Workflow Studio</p>
        <h2 className="wf-empty__title">Build your first workflow</h2>
        <p className="wf-empty__desc">
          Connect AI models, knowledge bases, and triggers into powerful orchestration graphs.
          Start from scratch or pick a template to move faster.
        </p>
        <div className="wf-empty__meta" aria-label="Quick setup facts">
          <span>No workflows yet</span>
          <span>Setup in under 5 minutes</span>
          <span>Deterministic + auditable</span>
        </div>
        <div className="wf-empty__actions flex flex-col items-center gap-3">
          <Link href="/dashboard/workflows/new" className="rex-link-reset">
            <Button variant="primary" size="md">
              <span className="wf-btn-icon" aria-hidden="true"><PlusIcon /></span>
              Start from blank
            </Button>
          </Link>
          <Link href="/dashboard/templates" className="rex-link-reset">
            <Button variant="secondary" size="md">
              Browse templates
            </Button>
          </Link>
        </div>
        <div className="wf-empty__hints">
          {QUICK_HINTS.map((h) => (
            <div key={h.title} className="wf-hint">
              <span className="wf-hint__icon" aria-hidden="true">{h.icon}</span>
              <div>
                <p className="wf-hint__title">{h.title}</p>
                <p className="wf-hint__desc">{h.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

const QUICK_HINTS = [
  {
    title: "Connect AI nodes",
    desc: "Chain LLM calls, embeddings, and rankers into coherent pipelines.",
    icon: (
      <svg viewBox="0 0 20 20" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="4" cy="5" r="1.8" />
        <circle cx="16" cy="10" r="1.8" />
        <circle cx="4" cy="15" r="1.8" />
        <path d="M5.8 5.6 14.2 9.4" /><path d="M5.8 14.4 14.2 10.6" />
      </svg>
    ),
  },
  {
    title: "Use knowledge bases",
    desc: "Ground responses in your corpora for accurate, context-aware results.",
    icon: (
      <svg viewBox="0 0 20 20" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 4.5a2 2 0 0 1 2-2h10v14.5H5a2 2 0 0 0-2 2Z" />
        <path d="M15 2.5v14.5" /><path d="M6.5 7h5" /><path d="M6.5 10h5" />
      </svg>
    ),
  },
  {
    title: "Monitor executions",
    desc: "Observe every run step-by-step with structured logs and KPIs.",
    icon: (
      <svg viewBox="0 0 20 20" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 16.5h14" /><path d="M5.5 13V9" /><path d="M10 13V6" /><path d="M14.5 13v-3" />
        <path d="m4.8 7.8 4.3-2.3 2.7 1.5 3.2-2" />
      </svg>
    ),
  },
];

/* ─── SVG Icons ──────────────────────────────────────────────────── */

function PlusIcon() {
  return (
    <svg viewBox="0 0 20 20" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M10 4v12M4 10h12" />
    </svg>
  );
}
function GridIcon() {
  return (
    <svg viewBox="0 0 20 20" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2.5" y="2.5" width="6" height="6" rx="1" />
      <rect x="11.5" y="2.5" width="6" height="6" rx="1" />
      <rect x="2.5" y="11.5" width="6" height="6" rx="1" />
      <rect x="11.5" y="11.5" width="6" height="6" rx="1" />
    </svg>
  );
}
function FlashIcon() {
  return (
    <svg viewBox="0 0 20 20" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11.5 2.5 5 11h6l-2.5 6.5L18 9h-6l2.5-6.5Z" />
    </svg>
  );
}
function ClockIcon() {
  return (
    <svg viewBox="0 0 20 20" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="10" cy="10" r="7.5" /><path d="M10 6v4l2.5 2.5" />
    </svg>
  );
}
function WorkflowNodeIcon() {
  return (
    <svg viewBox="0 0 20 20" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2.5" y="3" width="6" height="6" rx="1.2" />
      <rect x="11.5" y="3" width="6" height="6" rx="1.2" />
      <rect x="2.5" y="11" width="6" height="6" rx="1.2" />
      <path d="M11.5 14h6M14.5 11v6" />
    </svg>
  );
}

function CanvasDots() {
  return (
    <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <pattern id="wf-dot-pattern" x="0" y="0" width="28" height="28" patternUnits="userSpaceOnUse">
          <circle cx="1" cy="1" r="0.9" fill="rgba(79,120,255,0.13)" />
        </pattern>
        <radialGradient id="wf-dot-fade" cx="50%" cy="40%" r="55%">
          <stop offset="0%" stopColor="white" stopOpacity="1" />
          <stop offset="100%" stopColor="white" stopOpacity="0" />
        </radialGradient>
        <mask id="wf-dot-mask">
          <rect width="100%" height="100%" fill="url(#wf-dot-fade)" />
        </mask>
      </defs>
      <rect width="100%" height="100%" fill="url(#wf-dot-pattern)" mask="url(#wf-dot-mask)" />
    </svg>
  );
}

function EmptyIllustration() {
  return (
    <svg viewBox="0 0 320 180" width="320" height="180" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Central glow */}
      <ellipse cx="160" cy="90" rx="100" ry="60" fill="rgba(79,120,255,0.07)" />
      {/* Connector lines */}
      <line x1="72" y1="90" x2="120" y2="70" stroke="rgba(79,120,255,0.28)" strokeWidth="1.5" strokeDasharray="4 4" />
      <line x1="72" y1="90" x2="120" y2="110" stroke="rgba(79,120,255,0.28)" strokeWidth="1.5" strokeDasharray="4 4" />
      <line x1="200" y1="70" x2="248" y2="56" stroke="rgba(79,120,255,0.28)" strokeWidth="1.5" strokeDasharray="4 4" />
      <line x1="200" y1="110" x2="248" y2="124" stroke="rgba(79,120,255,0.28)" strokeWidth="1.5" strokeDasharray="4 4" />
      {/* Input node */}
      <rect x="28" y="74" width="44" height="32" rx="8" fill="rgba(15,22,38,0.9)" stroke="rgba(79,120,255,0.45)" strokeWidth="1.5" />
      <text x="50" y="93" textAnchor="middle" fontSize="9" fill="rgba(183,194,219,0.8)" fontFamily="monospace">Input</text>
      {/* Central LLM node */}
      <rect x="120" y="54" width="80" height="72" rx="10" fill="rgba(15,22,38,0.95)" stroke="rgba(79,120,255,0.7)" strokeWidth="1.5" />
      <rect x="120" y="54" width="80" height="72" rx="10" fill="url(#nodeGlow)" />
      <text x="160" y="85" textAnchor="middle" fontSize="9" fill="rgba(183,194,219,0.6)" fontFamily="monospace">LLM</text>
      <text x="160" y="100" textAnchor="middle" fontSize="11" fill="rgba(238,242,255,0.9)" fontFamily="monospace" fontWeight="600">Node</text>
      {/* Output nodes */}
      <rect x="200" y="44" width="48" height="28" rx="7" fill="rgba(15,22,38,0.9)" stroke="rgba(52,211,153,0.45)" strokeWidth="1.2" />
      <text x="224" y="62" textAnchor="middle" fontSize="9" fill="rgba(183,194,219,0.8)" fontFamily="monospace">Output A</text>
      <rect x="200" y="98" width="48" height="28" rx="7" fill="rgba(15,22,38,0.9)" stroke="rgba(52,211,153,0.45)" strokeWidth="1.2" />
      <text x="224" y="116" textAnchor="middle" fontSize="9" fill="rgba(183,194,219,0.8)" fontFamily="monospace">Output B</text>
      {/* Dots */}
      <circle cx="72" cy="90" r="3.5" fill="rgba(79,120,255,0.7)" />
      <circle cx="248" cy="56" r="3" fill="rgba(52,211,153,0.7)" />
      <circle cx="248" cy="124" r="3" fill="rgba(52,211,153,0.7)" />
      <defs>
        <radialGradient id="nodeGlow" cx="50%" cy="0%" r="80%">
          <stop offset="0%" stopColor="rgba(79,120,255,0.14)" />
          <stop offset="100%" stopColor="rgba(79,120,255,0)" />
        </radialGradient>
      </defs>
    </svg>
  );
}
