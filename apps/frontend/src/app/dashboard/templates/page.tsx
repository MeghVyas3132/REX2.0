"use client";

import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/api";
import type {
  WorkflowTemplateClient,
  TemplatePreviewResult,
  KnowledgeCorpusClient,
  InstantiateTemplatePayload,
} from "@/lib/api";

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

export default function TemplatesPage() {
  const { user, token, loading: authLoading, logout } = useAuth();
  const [templates, setTemplates] = useState<WorkflowTemplateClient[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
  const [form, setForm] = useState<TemplateFormState>(DEFAULT_FORM);
  const [corpora, setCorpora] = useState<KnowledgeCorpusClient[]>([]);
  const [loadingTemplates, setLoadingTemplates] = useState(true);
  const [loadingCorpora, setLoadingCorpora] = useState(true);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [instantiating, setInstantiating] = useState(false);
  const [preview, setPreview] = useState<TemplatePreviewResult | null>(null);
  const [error, setError] = useState<string>("");
  const [knowledgeError, setKnowledgeError] = useState<string>("");
  const router = useRouter();

  const selectedTemplate = useMemo(
    () => templates.find((template) => template.id === selectedTemplateId) ?? null,
    [selectedTemplateId, templates]
  );

  useEffect(() => {
    if (authLoading) return;
    if (!token) {
      router.push("/login");
      return;
    }
    void Promise.all([loadTemplates(token), loadCorpora(token)]);
  }, [authLoading, token, router]);

  useEffect(() => {
    if (templates.length === 0 || selectedTemplateId) {
      return;
    }

    const first = templates[0];
    if (!first) return;

    setSelectedTemplateId(first.id);
    setForm((prev) => ({
      ...prev,
      name: first.defaultWorkflowName,
      description: "",
    }));
  }, [templates, selectedTemplateId]);

  async function loadTemplates(accessToken: string): Promise<void> {
    setLoadingTemplates(true);
    setError("");
    try {
      const response = await api.templates.list(accessToken);
      setTemplates(response.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load templates");
    } finally {
      setLoadingTemplates(false);
    }
  }

  async function loadCorpora(accessToken: string): Promise<void> {
    setLoadingCorpora(true);
    setKnowledgeError("");
    try {
      const response = await api.knowledge.listCorpora(accessToken, 1, 100);
      setCorpora(response.data);
    } catch (err) {
      setKnowledgeError(err instanceof Error ? err.message : "Failed to load knowledge corpora");
    } finally {
      setLoadingCorpora(false);
    }
  }

  function handleSelectTemplate(template: WorkflowTemplateClient): void {
    setSelectedTemplateId(template.id);
    setPreview(null);
    setError("");
    setForm((prev) => ({
      ...prev,
      name: template.defaultWorkflowName,
      description: "",
    }));
  }

  function updateForm<K extends keyof TemplateFormState>(key: K, value: TemplateFormState[K]): void {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function buildPayload(template: WorkflowTemplateClient): InstantiateTemplatePayload {
    const topKRaw = Number(form.topK);
    const topK = Number.isFinite(topKRaw) ? Math.max(1, Math.min(50, Math.floor(topKRaw))) : 8;

    const params: Record<string, unknown> = {
      queryPath: form.queryPath.trim() || "query",
      topK,
      scopeType: form.scopeType,
    };

    const corpusId = form.corpusId.trim();
    if (corpusId) {
      params["corpusId"] = corpusId;
    }

    if (form.scopeType === "workflow") {
      const workflowId = form.workflowId.trim();
      if (workflowId) {
        params["workflowId"] = workflowId;
      }
    }

    if (form.scopeType === "execution") {
      const executionId = form.executionId.trim();
      if (executionId) {
        params["executionId"] = executionId;
      }
    }

    return {
      name: form.name.trim() || template.defaultWorkflowName,
      description: form.description.trim() || undefined,
      params,
    };
  }

  function validateForm(): string | null {
    const topK = Number(form.topK);
    if (!Number.isFinite(topK) || topK < 1 || topK > 50) {
      return "topK must be a number between 1 and 50";
    }

    if (form.scopeType === "workflow" && form.workflowId.trim().length === 0) {
      return "workflowId is required when scopeType is workflow";
    }

    if (form.scopeType === "execution" && form.executionId.trim().length === 0) {
      return "executionId is required when scopeType is execution";
    }

    return null;
  }

  async function handlePreview(): Promise<void> {
    if (!token || !selectedTemplate) return;

    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    setPreviewLoading(true);
    setError("");
    try {
      const response = await api.templates.preview(
        token,
        selectedTemplate.id,
        buildPayload(selectedTemplate)
      );
      setPreview(response.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to preview template");
    } finally {
      setPreviewLoading(false);
    }
  }

  async function handleInstantiate(): Promise<void> {
    if (!token || !selectedTemplate) return;

    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    setInstantiating(true);
    setError("");
    try {
      const response = await api.templates.instantiate(
        token,
        selectedTemplate.id,
        buildPayload(selectedTemplate)
      );
      router.push(`/dashboard/workflows/${response.data.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to instantiate template");
    } finally {
      setInstantiating(false);
    }
  }

  if (authLoading || !token) return null;

  return (
    <div style={styles.layout}>
      <nav style={styles.sidebar}>
        <div style={styles.brand}>REX</div>
        <div style={styles.navLinks}>
          <Link href="/dashboard" style={styles.navLink}>Workflows</Link>
          <Link href="/dashboard/templates" style={styles.navLinkActive}>Templates</Link>
          <Link href="/dashboard/settings" style={styles.navLink}>Settings</Link>
        </div>
        <div style={styles.userSection}>
          <span style={styles.userName}>{user?.name}</span>
          <button onClick={logout} style={styles.logoutBtn}>Sign Out</button>
        </div>
      </nav>

      <main style={styles.main}>
        <div style={styles.header}>
          <h1 style={styles.heading}>Templates</h1>
          <span style={styles.phaseBadge}>Phase 5 Complete</span>
        </div>

        <p style={styles.subheading}>
          Select a RAG blueprint, configure runtime retrieval parameters, preview generated graph,
          then instantiate to an editable workflow.
        </p>

        {error ? <p style={styles.errorText}>{error}</p> : null}

        <div style={styles.content}>
          <section style={styles.libraryPanel}>
            <h2 style={styles.sectionTitle}>Template Library</h2>
            {loadingTemplates ? (
              <p style={styles.loadingText}>Loading templates...</p>
            ) : (
              <div style={styles.grid}>
                {templates.map((template) => {
                  const isSelected = template.id === selectedTemplateId;
                  return (
                    <button
                      key={template.id}
                      type="button"
                      style={{
                        ...styles.card,
                        ...(isSelected ? styles.cardSelected : {}),
                      }}
                      onClick={() => handleSelectTemplate(template)}
                    >
                      <div style={styles.cardTop}>
                        <span style={styles.category}>{template.category}</span>
                        <span
                          style={{
                            ...styles.maturity,
                            color: template.maturity === "in-progress" ? "#f59e0b" : "#666666",
                            borderColor: template.maturity === "in-progress" ? "#f59e0b" : "#333333",
                          }}
                        >
                          {template.maturity === "in-progress" ? "In Progress" : "Planned"}
                        </span>
                      </div>
                      <h3 style={styles.cardTitle}>
                        {template.name} <span style={styles.cardVersion}>v{template.version}</span>
                      </h3>
                      <p style={styles.cardDesc}>{template.description}</p>
                    </button>
                  );
                })}
              </div>
            )}
          </section>

          <section style={styles.configPanel}>
            <h2 style={styles.sectionTitle}>Template Configuration</h2>
            {!selectedTemplate ? (
              <p style={styles.loadingText}>Select a template to configure.</p>
            ) : (
              <>
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
                      inputMode="numeric"
                      placeholder="8"
                    />
                  </label>

                  <label style={styles.fieldLabel}>
                    Scope Type
                    <select
                      style={styles.select}
                      value={form.scopeType}
                      onChange={(event) => updateForm("scopeType", event.target.value as ScopeType)}
                    >
                      <option value="user">user</option>
                      <option value="workflow">workflow</option>
                      <option value="execution">execution</option>
                    </select>
                  </label>

                  <label style={styles.fieldLabel}>
                    Corpus
                    <select
                      style={styles.select}
                      value={form.corpusId}
                      onChange={(event) => updateForm("corpusId", event.target.value)}
                    >
                      <option value="">Auto scope selection</option>
                      {corpora.map((corpus) => (
                        <option key={corpus.id} value={corpus.id}>
                          {corpus.name} ({corpus.scopeType})
                        </option>
                      ))}
                    </select>
                  </label>

                  {form.scopeType === "workflow" ? (
                    <label style={styles.fieldLabel}>
                      Workflow Scope ID
                      <input
                        style={styles.input}
                        value={form.workflowId}
                        onChange={(event) => updateForm("workflowId", event.target.value)}
                        placeholder="Workflow UUID"
                      />
                    </label>
                  ) : null}

                  {form.scopeType === "execution" ? (
                    <label style={styles.fieldLabel}>
                      Execution Scope ID
                      <input
                        style={styles.input}
                        value={form.executionId}
                        onChange={(event) => updateForm("executionId", event.target.value)}
                        placeholder="Execution UUID"
                      />
                    </label>
                  ) : null}
                </div>

                {knowledgeError ? <p style={styles.warningText}>{knowledgeError}</p> : null}
                {loadingCorpora ? <p style={styles.loadingText}>Loading corpora...</p> : null}

                <div style={styles.actionsRow}>
                  <button
                    type="button"
                    style={styles.secondaryButton}
                    onClick={() => void handlePreview()}
                    disabled={previewLoading || instantiating}
                  >
                    {previewLoading ? "Previewing..." : "Preview Graph"}
                  </button>
                  <button
                    type="button"
                    style={styles.useButton}
                    onClick={() => void handleInstantiate()}
                    disabled={previewLoading || instantiating}
                  >
                    {instantiating ? "Creating..." : "Create Workflow"}
                  </button>
                </div>

                {preview ? (
                  <div style={styles.previewPanel}>
                    <div style={styles.previewHeader}>Preview</div>
                    <div style={styles.previewStats}>
                      <span>Nodes: {preview.nodes.length}</span>
                      <span>Edges: {preview.edges.length}</span>
                      <span>Query: {preview.params.queryPath ?? "query"}</span>
                      <span>TopK: {preview.params.topK ?? 8}</span>
                    </div>
                    <p style={styles.previewText}>{preview.description}</p>
                  </div>
                ) : (
                  <p style={styles.loadingText}>Run preview to inspect generated graph before creation.</p>
                )}
              </>
            )}
          </section>
        </div>
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
  userSection: {
    borderTop: "1px solid #2a2a2a",
    paddingTop: "16px",
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  },
  userName: {
    fontSize: "13px",
    color: "#999999",
  },
  logoutBtn: {
    background: "none",
    border: "1px solid #2a2a2a",
    color: "#666666",
    padding: "6px 12px",
    borderRadius: "4px",
    cursor: "pointer",
    fontSize: "12px",
  },
  main: {
    flex: 1,
    padding: "32px 40px",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "12px",
  },
  heading: {
    fontSize: "24px",
    fontWeight: 600,
    color: "#e5e5e5",
    margin: 0,
  },
  phaseBadge: {
    fontSize: "11px",
    fontWeight: 500,
    color: "#22c55e",
    border: "1px solid #22c55e",
    borderRadius: "999px",
    padding: "4px 10px",
    letterSpacing: "0.5px",
    textTransform: "uppercase" as const,
  },
  subheading: {
    color: "#777777",
    fontSize: "14px",
    marginBottom: "24px",
    maxWidth: "920px",
    lineHeight: 1.5,
  },
  content: {
    display: "grid",
    gridTemplateColumns: "minmax(280px, 480px) minmax(420px, 1fr)",
    gap: "18px",
    alignItems: "start",
  },
  libraryPanel: {
    backgroundColor: "#0f0f0f",
    border: "1px solid #232323",
    borderRadius: "10px",
    padding: "14px",
  },
  configPanel: {
    backgroundColor: "#0f0f0f",
    border: "1px solid #232323",
    borderRadius: "10px",
    padding: "14px",
  },
  sectionTitle: {
    margin: "0 0 12px 0",
    fontSize: "14px",
    color: "#e5e5e5",
    fontWeight: 600,
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "1fr",
    gap: "10px",
  },
  card: {
    backgroundColor: "#111111",
    border: "1px solid #2a2a2a",
    borderRadius: "8px",
    padding: "12px",
    display: "flex",
    flexDirection: "column",
    gap: "8px",
    textAlign: "left",
    cursor: "pointer",
  },
  cardSelected: {
    borderColor: "#22c55e",
    boxShadow: "0 0 0 1px #22c55e inset",
  },
  cardTop: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  category: {
    fontSize: "11px",
    color: "#999999",
    border: "1px solid #333333",
    borderRadius: "999px",
    padding: "2px 8px",
    textTransform: "uppercase" as const,
    letterSpacing: "0.4px",
  },
  maturity: {
    fontSize: "10px",
    fontWeight: 500,
    border: "1px solid",
    borderRadius: "999px",
    padding: "2px 8px",
    letterSpacing: "0.4px",
    textTransform: "uppercase" as const,
  },
  cardTitle: {
    fontSize: "14px",
    fontWeight: 600,
    color: "#e5e5e5",
    margin: 0,
  },
  cardVersion: {
    fontSize: "11px",
    color: "#6b7280",
    fontWeight: 500,
  },
  cardDesc: {
    fontSize: "12px",
    color: "#777777",
    margin: 0,
    lineHeight: 1.4,
  },
  formGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(2, minmax(220px, 1fr))",
    gap: "10px",
  },
  fieldLabel: {
    display: "flex",
    flexDirection: "column",
    gap: "6px",
    fontSize: "12px",
    color: "#9ca3af",
  },
  input: {
    border: "1px solid #2f2f2f",
    borderRadius: "6px",
    backgroundColor: "#121212",
    color: "#e5e5e5",
    fontSize: "13px",
    padding: "8px 10px",
    outline: "none",
  },
  select: {
    border: "1px solid #2f2f2f",
    borderRadius: "6px",
    backgroundColor: "#121212",
    color: "#e5e5e5",
    fontSize: "13px",
    padding: "8px 10px",
    outline: "none",
  },
  actionsRow: {
    marginTop: "14px",
    display: "flex",
    gap: "8px",
  },
  secondaryButton: {
    backgroundColor: "#1f2937",
    color: "#e5e7eb",
    border: "1px solid #374151",
    borderRadius: "6px",
    fontSize: "12px",
    fontWeight: 600,
    padding: "8px 12px",
    cursor: "pointer",
  },
  useButton: {
    backgroundColor: "#22c55e",
    color: "#04150a",
    border: "none",
    borderRadius: "6px",
    fontSize: "12px",
    fontWeight: 700,
    padding: "8px 12px",
    cursor: "pointer",
  },
  previewPanel: {
    marginTop: "14px",
    border: "1px solid #2c2c2c",
    borderRadius: "8px",
    backgroundColor: "#111111",
    padding: "12px",
  },
  previewHeader: {
    fontSize: "12px",
    color: "#d1d5db",
    fontWeight: 600,
    marginBottom: "8px",
  },
  previewStats: {
    display: "grid",
    gridTemplateColumns: "repeat(2, minmax(120px, 1fr))",
    gap: "6px",
    fontSize: "12px",
    color: "#9ca3af",
    marginBottom: "8px",
  },
  previewText: {
    margin: 0,
    fontSize: "13px",
    color: "#d1d5db",
    lineHeight: 1.5,
  },
  loadingText: {
    color: "#999999",
    fontSize: "13px",
  },
  errorText: {
    color: "#ef4444",
    fontSize: "13px",
    marginBottom: "12px",
  },
  warningText: {
    color: "#f59e0b",
    fontSize: "12px",
    marginTop: "8px",
    marginBottom: 0,
  },
};
