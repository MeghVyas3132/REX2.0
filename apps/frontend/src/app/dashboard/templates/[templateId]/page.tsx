"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/api";
import type {
  InstantiateTemplatePayload,
  KnowledgeCorpusClient,
  TemplatePreviewResult,
  WorkflowTemplateClient,
} from "@/lib/api";
import { WorkflowEditor } from "@/components/workflow-editor";
import type { CanvasEdge, CanvasNode } from "@/components/workflow-editor";
import { clearWorkflowDraft, saveWorkflowDraft } from "@/lib/workflow-draft";

type ScopeType = "user" | "workflow" | "execution";

interface TemplateFormState {
  name: string;
  description: string;
  queryPath: string;
  topK: string;
  scopeType: ScopeType;
  corpusId: string;
  workflowId: string;
  executionId: string;
}

const DEFAULT_FORM: TemplateFormState = {
  name: "",
  description: "",
  queryPath: "query",
  topK: "8",
  scopeType: "user",
  corpusId: "",
  workflowId: "",
  executionId: "",
};

export default function TemplateConfigurePage() {
  const { token, loading: authLoading } = useAuth();
  const params = useParams();
  const router = useRouter();

  const templateId = String(params.templateId ?? "");

  const [template, setTemplate] = useState<WorkflowTemplateClient | null>(null);
  const [corpora, setCorpora] = useState<KnowledgeCorpusClient[]>([]);
  const [form, setForm] = useState<TemplateFormState>(DEFAULT_FORM);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [configuring, setConfiguring] = useState(false);
  const [configured, setConfigured] = useState(false);
  const [preview, setPreview] = useState<TemplatePreviewResult | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");

  useEffect(() => {
    if (authLoading) return;
    if (!token) {
      router.push("/login");
      return;
    }
    if (!templateId) {
      router.push("/dashboard/templates");
      return;
    }
    void loadData(token, templateId);
  }, [authLoading, token, templateId, router]);

  async function loadData(accessToken: string, id: string): Promise<void> {
    setLoading(true);
    setError("");
    try {
      const [templateRes, corporaRes] = await Promise.all([
        api.templates.get(accessToken, id),
        api.knowledge.listCorpora(accessToken, 1, 100),
      ]);
      setTemplate(templateRes.data);
      setCorpora(corporaRes.data);
      setForm((prev) => ({
        ...prev,
        name: templateRes.data.defaultWorkflowName,
      }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load template configuration");
    } finally {
      setLoading(false);
    }
  }

  function updateForm<K extends keyof TemplateFormState>(key: K, value: TemplateFormState[K]): void {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function validateForm(): string | null {
    const topK = Number(form.topK);
    if (!Number.isFinite(topK) || topK < 1 || topK > 50) {
      return "Top K must be a number between 1 and 50";
    }

    if (form.scopeType === "workflow" && form.workflowId.trim().length === 0) {
      return "workflowId is required when scopeType is workflow";
    }

    if (form.scopeType === "execution" && form.executionId.trim().length === 0) {
      return "executionId is required when scopeType is execution";
    }

    return null;
  }

  function buildPayload(name: string, description: string): InstantiateTemplatePayload {
    const topKRaw = Number(form.topK);
    const topK = Number.isFinite(topKRaw) ? Math.max(1, Math.min(50, Math.floor(topKRaw))) : 8;

    const paramsPayload: Record<string, unknown> = {
      queryPath: form.queryPath.trim() || "query",
      topK,
      scopeType: form.scopeType,
    };

    const corpusId = form.corpusId.trim();
    if (corpusId) {
      paramsPayload["corpusId"] = corpusId;
    }

    if (form.scopeType === "workflow") {
      const workflowId = form.workflowId.trim();
      if (workflowId) {
        paramsPayload["workflowId"] = workflowId;
      }
    }

    if (form.scopeType === "execution") {
      const executionId = form.executionId.trim();
      if (executionId) {
        paramsPayload["executionId"] = executionId;
      }
    }

    return {
      name: name.trim(),
      description: description.trim() || undefined,
      params: paramsPayload,
    };
  }

  async function handleApplyConfiguration(): Promise<void> {
    if (!token || !template) return;

    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    setConfiguring(true);
    setError("");
    try {
      const payload = buildPayload(
        form.name.trim() || template.defaultWorkflowName,
        form.description.trim()
      );
      const response = await api.templates.preview(token, template.id, payload);
      setPreview(response.data);
      setConfigured(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to apply template configuration");
    } finally {
      setConfiguring(false);
    }
  }

  async function handleSave(data: {
    name: string;
    description: string;
    nodes: CanvasNode[];
    edges: CanvasEdge[];
  }): Promise<void> {
    if (!token || !template) return;

    setSaving(true);
    setSaveStatus("saving");
    setError("");

    try {
      const payload = buildPayload(
        data.name.trim() || template.defaultWorkflowName,
        data.description.trim()
      );

      const created = await api.templates.instantiate(token, template.id, payload);

      await api.workflows.update(token, created.data.id, {
        name: data.name.trim() || template.defaultWorkflowName,
        description: data.description.trim(),
        nodes: data.nodes.map((n) => ({
          id: n.id,
          type: n.type,
          label: n.label,
          position: n.position,
          config: n.config,
        })),
        edges: data.edges.map((e) => ({
          id: e.id,
          source: e.source,
          target: e.target,
          condition: e.condition,
        })),
      });

      setSaveStatus("saved");
      clearWorkflowDraft();
      router.push(`/dashboard/workflows/${created.data.id}`);
    } catch (err) {
      setSaveStatus("error");
      setError(err instanceof Error ? err.message : "Failed to save workflow from template");
    } finally {
      setSaving(false);
    }
  }

  if (authLoading || !token) return null;

  if (configured && preview) {
    return (
      <WorkflowEditor
        key={`${preview.template.id}-${preview.workflowName}`}
        initialNodes={preview.nodes.map((n) => ({
          id: n.id,
          type: n.type,
          label: n.label,
          position: n.position,
          config: n.config,
        }))}
        initialEdges={preview.edges.map((e) => ({
          id: e.id,
          source: e.source,
          target: e.target,
          condition: e.condition,
        }))}
        workflowName={preview.workflowName}
        workflowDescription={preview.description}
        token={token}
        saving={saving}
        saveStatus={saveStatus}
        onSave={handleSave}
        onStateChange={(data) => {
          saveWorkflowDraft({
            mode: "create",
            name: data.name,
            description: data.description,
            nodes: data.nodes,
            edges: data.edges,
          });
        }}
        onBack={() => router.push("/dashboard/templates")}
        showExecute={false}
      />
    );
  }

  return (
    <div style={styles.layout}>
      <nav style={styles.sidebar}>
        <div style={styles.brand}>REX</div>
        <div style={styles.navLinks}>
          <Link href="/dashboard" style={styles.navLink}>Workflows</Link>
          <Link href="/dashboard/active-workflows" style={styles.navLink}>Active Workflows</Link>
          <Link href="/dashboard/current-workflow" style={styles.navLink}>Current Workflow</Link>
          <Link href="/dashboard/corpora" style={styles.navLink}>Corpora</Link>
          <Link href="/dashboard/templates" style={styles.navLinkActive}>Templates</Link>
          <Link href="/dashboard/settings" style={styles.navLink}>Settings</Link>
        </div>
      </nav>

      <main style={styles.main}>
        <div style={styles.breadcrumb}>
          <Link href="/dashboard/templates" style={styles.breadcrumbLink}>Templates</Link>
          <span style={styles.sep}>/</span>
          <span style={styles.breadcrumbCurrent}>{template?.name ?? templateId}</span>
        </div>

        <h1 style={styles.heading}>Template Configuration</h1>
        <p style={styles.subheading}>
          Configure runtime parameters first. The pipeline workspace stays locked until configuration is applied.
        </p>

        {error ? <p style={styles.errorText}>{error}</p> : null}

        {loading ? (
          <p style={styles.muted}>Loading template...</p>
        ) : !template ? (
          <p style={styles.errorText}>Template not found.</p>
        ) : (
          <section style={styles.configCard}>
            <div style={styles.formGrid}>
              <label style={styles.fieldLabel}>
                Workflow Name
                <input
                  style={styles.input}
                  value={form.name}
                  onChange={(event) => updateForm("name", event.target.value)}
                />
              </label>

              <label style={styles.fieldLabel}>
                Description
                <input
                  style={styles.input}
                  value={form.description}
                  onChange={(event) => updateForm("description", event.target.value)}
                  placeholder="Optional"
                />
              </label>

              <label style={styles.fieldLabel}>
                Query Path
                <input
                  style={styles.input}
                  value={form.queryPath}
                  onChange={(event) => updateForm("queryPath", event.target.value)}
                  placeholder="query"
                />
              </label>

              <label style={styles.fieldLabel}>
                Top K
                <input
                  style={styles.input}
                  value={form.topK}
                  onChange={(event) => updateForm("topK", event.target.value)}
                  type="number"
                  min={1}
                  max={50}
                />
              </label>

              <label style={styles.fieldLabel}>
                Scope
                <select
                  style={styles.select}
                  value={form.scopeType}
                  onChange={(event) => updateForm("scopeType", event.target.value as ScopeType)}
                >
                  <option value="user">User</option>
                  <option value="workflow">Workflow</option>
                  <option value="execution">Execution</option>
                </select>
              </label>

              <label style={styles.fieldLabel}>
                Corpus
                <select
                  style={styles.select}
                  value={form.corpusId}
                  onChange={(event) => updateForm("corpusId", event.target.value)}
                >
                  <option value="">Auto-select by scope</option>
                  {corpora.map((corpus) => (
                    <option key={corpus.id} value={corpus.id}>
                      {corpus.name} ({corpus.scopeType})
                    </option>
                  ))}
                </select>
              </label>

              {form.scopeType === "workflow" && (
                <label style={styles.fieldLabel}>
                  Workflow ID
                  <input
                    style={styles.input}
                    value={form.workflowId}
                    onChange={(event) => updateForm("workflowId", event.target.value)}
                    placeholder="Required for workflow scope"
                  />
                </label>
              )}

              {form.scopeType === "execution" && (
                <label style={styles.fieldLabel}>
                  Execution ID
                  <input
                    style={styles.input}
                    value={form.executionId}
                    onChange={(event) => updateForm("executionId", event.target.value)}
                    placeholder="Required for execution scope"
                  />
                </label>
              )}
            </div>

            <div style={styles.actions}>
              <button
                type="button"
                style={styles.secondaryBtn}
                onClick={() => router.push("/dashboard/templates")}
              >
                Cancel
              </button>
              <button
                type="button"
                style={styles.primaryBtn}
                onClick={handleApplyConfiguration}
                disabled={configuring}
              >
                {configuring ? "Applying..." : "Apply Configuration"}
              </button>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  layout: {
    display: "flex",
    minHeight: "100vh",
    backgroundColor: "#0a0a0a",
  },
  sidebar: {
    width: "220px",
    backgroundColor: "#111111",
    borderRight: "1px solid #2a2a2a",
    display: "flex",
    flexDirection: "column",
    padding: "20px 16px",
  },
  brand: {
    fontSize: "20px",
    fontWeight: 700,
    color: "#e5e5e5",
    letterSpacing: "3px",
    marginBottom: "32px",
  },
  navLinks: {
    display: "flex",
    flexDirection: "column",
    gap: "4px",
    flex: 1,
  },
  navLink: {
    padding: "10px 12px",
    borderRadius: "6px",
    color: "#999999",
    fontSize: "14px",
    textDecoration: "none",
  },
  navLinkActive: {
    padding: "10px 12px",
    borderRadius: "6px",
    backgroundColor: "#1a1a1a",
    color: "#e5e5e5",
    fontSize: "14px",
    textDecoration: "none",
    fontWeight: 500,
  },
  main: {
    flex: 1,
    padding: "32px 40px",
  },
  breadcrumb: {
    marginBottom: "16px",
    fontSize: "13px",
  },
  breadcrumbLink: {
    color: "#666666",
    textDecoration: "none",
  },
  sep: {
    color: "#444444",
    margin: "0 8px",
  },
  breadcrumbCurrent: {
    color: "#999999",
    textTransform: "capitalize",
  },
  heading: {
    fontSize: "24px",
    fontWeight: 600,
    color: "#e5e5e5",
    marginTop: 0,
    marginBottom: "10px",
  },
  subheading: {
    color: "#777777",
    fontSize: "14px",
    lineHeight: 1.45,
    marginBottom: "24px",
  },
  configCard: {
    backgroundColor: "#111111",
    border: "1px solid #2a2a2a",
    borderRadius: "10px",
    padding: "18px",
    maxWidth: "980px",
  },
  formGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
    gap: "12px",
  },
  fieldLabel: {
    display: "flex",
    flexDirection: "column",
    gap: "6px",
    fontSize: "12px",
    color: "#999999",
  },
  input: {
    backgroundColor: "#0b0b0b",
    border: "1px solid #2a2a2a",
    borderRadius: "6px",
    color: "#e5e5e5",
    padding: "10px 11px",
    fontSize: "13px",
    outline: "none",
  },
  select: {
    backgroundColor: "#0b0b0b",
    border: "1px solid #2a2a2a",
    borderRadius: "6px",
    color: "#e5e5e5",
    padding: "10px 11px",
    fontSize: "13px",
    outline: "none",
  },
  actions: {
    marginTop: "18px",
    display: "flex",
    justifyContent: "flex-end",
    gap: "10px",
  },
  primaryBtn: {
    padding: "10px 16px",
    backgroundColor: "#e5e5e5",
    color: "#101010",
    borderRadius: "6px",
    border: "none",
    cursor: "pointer",
    fontSize: "13px",
    fontWeight: 600,
  },
  secondaryBtn: {
    padding: "10px 16px",
    backgroundColor: "transparent",
    color: "#c7c7c7",
    borderRadius: "6px",
    border: "1px solid #333333",
    cursor: "pointer",
    fontSize: "13px",
  },
  muted: {
    color: "#666666",
    fontSize: "14px",
  },
  errorText: {
    color: "#ef4444",
    fontSize: "13px",
    marginBottom: "12px",
  },
};
