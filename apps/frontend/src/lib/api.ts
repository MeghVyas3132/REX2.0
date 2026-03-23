// ──────────────────────────────────────────────
// REX - API Client
// ──────────────────────────────────────────────

const API_BASE = process.env["NEXT_PUBLIC_API_URL"] ?? "http://localhost:4000";

interface ApiCallOptions {
  method?: string;
  body?: unknown;
  token?: string;
}

async function apiCall<T>(path: string, options: ApiCallOptions = {}): Promise<T> {
  const { method = "GET", body, token } = options;

  const headers: Record<string, string> = {};

  if (body) {
    headers["Content-Type"] = "application/json";
  }

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  let response: Response;
  try {
    response = await fetch(`${API_BASE}${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch (err) {
    throw new Error(
      err instanceof Error ? err.message : "Network request failed"
    );
  }

  let data: unknown;
  try {
    data = await response.json();
  } catch (err) {
    throw new Error(
      `Failed to parse response: ${err instanceof Error ? err.message : "Invalid JSON"}`
    );
  }

  if (!response.ok) {
    const errorMessage =
      typeof data === "object" && data !== null && "error" in data
        ? (data as Record<string, unknown>).error instanceof Object
          ? ((data as Record<string, unknown>).error as Record<string, unknown>).message ?? "Request failed"
          : "Request failed"
        : "Request failed";
    throw new Error(String(errorMessage));
  }

  return data as T;
}

export const api = {
  auth: {
    register: (email: string, name: string, password: string) =>
      apiCall<{ success: boolean; data: { user: AuthUserClient; token: string } }>(
        "/api/auth/register",
        { method: "POST", body: { email, name, password } }
      ),
    login: (email: string, password: string) =>
      apiCall<{ success: boolean; data: { user: AuthUserClient; token: string } }>(
        "/api/auth/login",
        { method: "POST", body: { email, password } }
      ),
    me: (token: string) =>
      apiCall<{ success: boolean; data: { user: AuthUserClient } }>(
        "/api/auth/me",
        { token }
      ),
  },

  workflows: {
    list: (token: string, page = 1, limit = 20) =>
      apiCall<{ success: boolean; data: WorkflowListItem[]; meta: PaginationMeta }>(
        `/api/workflows?page=${page}&limit=${limit}`,
        { token }
      ),
    get: (token: string, id: string) =>
      apiCall<{ success: boolean; data: WorkflowDetail }>(
        `/api/workflows/${id}`,
        { token }
      ),
    create: (token: string, workflow: CreateWorkflowPayload) =>
      apiCall<{ success: boolean; data: WorkflowDetail }>(
        "/api/workflows",
        { method: "POST", body: workflow, token }
      ),
    update: (token: string, id: string, data: UpdateWorkflowPayload) =>
      apiCall<{ success: boolean; data: WorkflowDetail }>(
        `/api/workflows/${id}`,
        { method: "PATCH", body: data, token }
      ),
    delete: (token: string, id: string) =>
      apiCall<{ success: boolean }>(
        `/api/workflows/${id}`,
        { method: "DELETE", token }
      ),
    execute: (token: string, id: string, payload: Record<string, unknown> = {}) =>
      apiCall<{ success: boolean; data: { executionId: string } }>(
        `/api/workflows/${id}/execute`,
        { method: "POST", body: { payload }, token }
      ),
    executions: (token: string, workflowId: string, page = 1) =>
      apiCall<{ success: boolean; data: ExecutionListItem[]; meta: PaginationMeta }>(
        `/api/workflows/${workflowId}/executions?page=${page}`,
        { token }
      ),
    active: (token: string, page = 1, limit = 20) =>
      apiCall<{ success: boolean; data: ActiveWorkflowExecutionClient[]; meta: PaginationMeta }>(
        `/api/workflows/active?page=${page}&limit=${limit}`,
        { token }
      ),
  },

  templates: {
    list: (token: string) =>
      apiCall<{ success: boolean; data: WorkflowTemplateClient[] }>(
        "/api/workflow-templates",
        { token }
      ),
    get: (token: string, templateId: string) =>
      apiCall<{ success: boolean; data: WorkflowTemplateClient }>(
        `/api/workflow-templates/${templateId}`,
        { token }
      ),
    instantiate: (
      token: string,
      templateId: string,
      payload: InstantiateTemplatePayload = {}
    ) =>
      apiCall<{ success: boolean; data: WorkflowDetail }>(
        `/api/workflow-templates/${templateId}/instantiate`,
        { method: "POST", body: payload, token }
      ),
    preview: (
      token: string,
      templateId: string,
      payload: InstantiateTemplatePayload = {}
    ) =>
      apiCall<{ success: boolean; data: TemplatePreviewResult }>(
        `/api/workflow-templates/${templateId}/preview`,
        { method: "POST", body: payload, token }
      ),
  },

  knowledge: {
    listCorpora: (token: string, page = 1, limit = 100) =>
      apiCall<{ success: boolean; data: KnowledgeCorpusClient[]; meta: PaginationMeta }>(
        `/api/knowledge/corpora?page=${page}&limit=${limit}`,
        { token }
      ),
    createCorpus: (
      token: string,
      payload: {
        name: string;
        description?: string;
        scopeType?: "user" | "workflow" | "execution";
        workflowId?: string;
        executionId?: string;
        metadata?: Record<string, unknown>;
      }
    ) =>
      apiCall<{ success: boolean; data: { id: string } }>(
        "/api/knowledge/corpora",
        { method: "POST", body: payload, token }
      ),
    ingestDocument: (
      token: string,
      payload: {
        corpusId: string;
        title: string;
        contentText: string;
        sourceType?: "upload" | "inline" | "api";
        mimeType?: string;
        metadata?: Record<string, unknown>;
      }
    ) =>
      apiCall<{ success: boolean; data: { documentId: string; jobId: string } }>(
        "/api/knowledge/documents/ingest",
        { method: "POST", body: payload, token }
      ),
    listDocuments: (token: string, corpusId: string, page = 1, limit = 50) =>
      apiCall<{ success: boolean; data: KnowledgeDocumentClient[]; meta: PaginationMeta }>(
        `/api/knowledge/corpora/${corpusId}/documents?page=${page}&limit=${limit}`,
        { token }
      ),
    listChunks: (token: string, documentId: string, page = 1, limit = 100) =>
      apiCall<{ success: boolean; data: KnowledgeChunkClient[]; meta: PaginationMeta }>(
        `/api/knowledge/documents/${documentId}/chunks?page=${page}&limit=${limit}`,
        { token }
      ),
    query: (
      token: string,
      payload: {
        query: string;
        topK?: number;
        corpusId?: string;
        scopeType?: "user" | "workflow" | "execution";
        workflowId?: string;
        executionId?: string;
      }
    ) =>
      apiCall<{ success: boolean; data: KnowledgeQueryResultClient }>(
        "/api/knowledge/query",
        { method: "POST", body: payload, token }
      ),
  },

  executions: {
    get: (token: string, id: string) =>
      apiCall<{ success: boolean; data: ExecutionDetail }>(
        `/api/executions/${id}`,
        { token }
      ),
    stop: (token: string, id: string) =>
      apiCall<{ success: boolean; data: { executionId: string; status: string } }>(
        `/api/executions/${id}/stop`,
        { method: "POST", token }
      ),
  },

  keys: {
    list: (token: string) =>
      apiCall<{ success: boolean; data: ApiKeyItem[] }>("/api/keys", { token }),
    create: (token: string, provider: string, key: string, label: string) =>
      apiCall<{ success: boolean; data: { id: string } }>(
        "/api/keys",
        { method: "POST", body: { provider, key, label }, token }
      ),
    delete: (token: string, keyId: string) =>
      apiCall<{ success: boolean }>(`/api/keys/${keyId}`, { method: "DELETE", token }),
  },

  models: {
    list: (token: string, provider?: string) =>
      apiCall<{ success: boolean; data: ModelRegistryClient[] }>(
        `/api/models${provider ? `?provider=${encodeURIComponent(provider)}` : ""}`,
        { token }
      ),
  },

  kpi: {
    summary: (token: string, days = 7, latencyThresholdMs = 5000) =>
      apiCall<{ success: boolean; data: KpiSummaryClient }>(
        `/api/kpi/summary?days=${days}&latencyThresholdMs=${latencyThresholdMs}`,
        { token }
      ),
    timeseries: (token: string, days = 7) =>
      apiCall<{ success: boolean; data: KpiTimeseriesPointClient[] }>(
        `/api/kpi/timeseries?days=${days}`,
        { token }
      ),
  },

  governance: {
    exportMe: (token: string) =>
      apiCall<{ success: boolean; data: Record<string, unknown> }>("/api/me/export", { token }),
    deleteMe: (token: string, confirmEmail: string) =>
      apiCall<{ success: boolean; data: { deleted: true } }>("/api/me", {
        method: "DELETE",
        body: { confirmEmail },
        token,
      }),
    listWorkspaces: (token: string) =>
      apiCall<{ success: boolean; data: WorkspaceClient[] }>("/api/workspaces", { token }),
    createWorkspace: (token: string, name: string) =>
      apiCall<{ success: boolean; data: WorkspaceClient }>("/api/workspaces", {
        method: "POST",
        body: { name },
        token,
      }),
    addWorkspaceMember: (
      token: string,
      workspaceId: string,
      memberUserId: string,
      role: "admin" | "editor" | "viewer"
    ) =>
      apiCall<{ success: boolean; data: { updated: true } }>(
        `/api/workspaces/${workspaceId}/members`,
        {
          method: "POST",
          body: { memberUserId, role },
          token,
        }
      ),
    assignWorkflowToWorkspace: (token: string, workspaceId: string, workflowId: string) =>
      apiCall<{ success: boolean; data: { assigned: true } }>(
        `/api/workspaces/${workspaceId}/assign-workflow`,
        {
          method: "POST",
          body: { workflowId, workspaceId },
          token,
        }
      ),
    listWorkflowPermissions: (token: string, workflowId: string) =>
      apiCall<{ success: boolean; data: WorkflowPermissionClient[] }>(
        `/api/workflows/${workflowId}/permissions`,
        { token }
      ),
    upsertWorkflowPermission: (
      token: string,
      workflowId: string,
      payload: {
        userId: string;
        role: "viewer" | "editor";
        attributes?: Record<string, unknown>;
        expiresAt?: string | null;
      }
    ) =>
      apiCall<{ success: boolean; data: { updated: true } }>(
        `/api/workflows/${workflowId}/permissions`,
        { method: "PUT", body: payload, token }
      ),
    listPolicies: (token: string) =>
      apiCall<{ success: boolean; data: IamPolicyClient[] }>("/api/policies", { token }),
    upsertPolicy: (
      token: string,
      payload: {
        id?: string;
        userId?: string | null;
        workflowId?: string | null;
        action: string;
        effect: "allow" | "deny";
        conditions?: Record<string, unknown>;
        isActive?: boolean;
      }
    ) =>
      apiCall<{ success: boolean; data: { id: string } }>("/api/policies", {
        method: "PUT",
        body: payload,
        token,
      }),
    listHyperparameterProfiles: (token: string, workflowId?: string) =>
      apiCall<{ success: boolean; data: HyperparameterProfileClient[] }>(
        `/api/hyperparameters/profiles${workflowId ? `?workflowId=${encodeURIComponent(workflowId)}` : ""}`,
        { token }
      ),
    upsertHyperparameterProfile: (
      token: string,
      payload: {
        id?: string;
        workflowId?: string;
        name: string;
        description?: string;
        config: Record<string, unknown>;
        isDefault?: boolean;
        isActive?: boolean;
      }
    ) =>
      apiCall<{ success: boolean; data: { id: string } }>("/api/hyperparameters/profiles", {
        method: "PUT",
        body: payload,
        token,
      }),
    compareHyperparameterProfiles: (
      token: string,
      payload: { workflowId: string; profileAId: string; profileBId: string }
    ) =>
      apiCall<{
        success: boolean;
        data: {
          experimentId: string;
          recommendation: "profile-a" | "profile-b" | "tie";
          summary: Record<string, unknown>;
        };
      }>("/api/hyperparameters/compare", {
        method: "POST",
        body: payload,
        token,
      }),
    listAlertRules: (token: string) =>
      apiCall<{ success: boolean; data: AlertRuleClient[] }>("/api/alerts/rules", { token }),
    upsertAlertRule: (
      token: string,
      payload: {
        id?: string;
        workflowId?: string | null;
        ruleType: "latency-breach" | "guardrail-triggered" | "corpus-health-alert";
        severity?: "warn" | "critical";
        threshold?: number;
        windowMinutes?: number;
        config?: Record<string, unknown>;
        isActive?: boolean;
      }
    ) =>
      apiCall<{ success: boolean; data: { id: string } }>("/api/alerts/rules", {
        method: "PUT",
        body: payload,
        token,
      }),
    listAlertEvents: (token: string, limit = 100) =>
      apiCall<{ success: boolean; data: AlertEventClient[] }>(
        `/api/alerts/events?limit=${limit}`,
        { token }
      ),
    listConsents: (token: string) =>
      apiCall<{ success: boolean; data: ConsentClient[] }>("/api/compliance/consents", { token }),
    setConsent: (
      token: string,
      payload: {
        consentType: string;
        policyVersion: string;
        granted: boolean;
        metadata?: Record<string, unknown>;
      }
    ) =>
      apiCall<{ success: boolean; data: { id: string } }>("/api/compliance/consents", {
        method: "POST",
        body: payload,
        token,
      }),
    upsertRetentionPolicy: (
      token: string,
      payload: {
        id?: string;
        resourceType:
          | "executions"
          | "knowledge_documents"
          | "guardrail_events"
          | "audit_logs"
          | "alert_events";
        retentionDays: number;
        config?: Record<string, unknown>;
        isActive?: boolean;
      }
    ) =>
      apiCall<{ success: boolean; data: { id: string } }>(
        "/api/compliance/retention-policies",
        {
          method: "PUT",
          body: payload,
          token,
        }
      ),
    runRetentionSweep: (token: string) =>
      apiCall<{ success: boolean; data: Record<string, number> }>(
        "/api/compliance/retention-sweep",
        { method: "POST", token }
      ),
  },

  chat: {
    send: (
      token: string,
      message: string,
      workflow: {
        name: string;
        description: string;
        nodes: Array<{ id: string; type: string; label: string; config: Record<string, unknown> }>;
        edges: Array<{ id: string; source: string; target: string }>;
      },
      executionStatus?: string | null,
      nodeStatuses?: Record<string, { status: string; error: string | null }>,
      history?: Array<{ role: "user" | "assistant"; content: string }>
    ) =>
      apiCall<{ success: boolean; data: { message: string; usage: { totalTokens: number } } }>(
        "/api/chat",
        {
          method: "POST",
          body: { message, workflow, executionStatus, nodeStatuses, history },
          token,
        }
      ),
  },

  files: {
    parse: (
      token: string,
      fileContent: string,
      fileName: string,
      fileFormat: string
    ) =>
      apiCall<{
        success: boolean;
        data: {
          fileName: string;
          fileFormat: string;
          parsedData: unknown;
          rowCount?: number;
          preview: string;
        };
      }>("/api/files/parse", {
        method: "POST",
        body: { fileContent, fileName, fileFormat },
        token,
      }),
  },

  publications: {
    list: (token: string, catalog = false) =>
      apiCall<{ success: boolean; data: Array<Record<string, unknown>> }>(
        `/api/publications${catalog ? "?catalog=true" : ""}`,
        { token }
      ),
    get: (token: string, id: string) =>
      apiCall<{ success: boolean; data: Record<string, unknown> }>(
        `/api/publications/${id}`,
        { token }
      ),
    create: (token: string, payload: Record<string, unknown>) =>
      apiCall<{ success: boolean; data: { id: string } }>(
        "/api/publications",
        { method: "POST", body: payload, token }
      ),
    update: (token: string, id: string, payload: Record<string, unknown>) =>
      apiCall<{ success: boolean; data: { id: string } }>(
        `/api/publications/${id}`,
        { method: "PATCH", body: payload, token }
      ),
    remove: (token: string, id: string) =>
      apiCall<{ success: boolean; data: { deleted: true } }>(
        `/api/publications/${id}`,
        { method: "DELETE", token }
      ),
    publish: (token: string, id: string) =>
      apiCall<{ success: boolean; data: { id: string } }>(
        `/api/publications/${id}/publish`,
        { method: "POST", token }
      ),
    unpublish: (token: string, id: string) =>
      apiCall<{ success: boolean; data: { id: string } }>(
        `/api/publications/${id}/unpublish`,
        { method: "POST", token }
      ),
    execute: (token: string, id: string, inputs: Record<string, unknown>) =>
      apiCall<{ success: boolean; data: { executionId: string } }>(
        `/api/publications/${id}/execute`,
        { method: "POST", body: { inputs }, token }
      ),
  },

  rex: {
    listScores: (token: string, workflowId: string, recompute = false) =>
      apiCall<{ success: boolean; data: Array<Record<string, unknown>> }>(
        `/api/workflows/${workflowId}/rex-scores${recompute ? "?recompute=true" : ""}`,
        { token }
      ),
    previewFixes: (token: string, workflowId: string, nodeId: string) =>
      apiCall<{ success: boolean; data: { nodeId: string; fixes: string[] } }>(
        `/api/workflows/${workflowId}/rex-fixes/preview/${nodeId}`,
        { token }
      ),
    applyFixes: (token: string, workflowId: string, nodeId: string, actions: string[]) =>
      apiCall<{ success: boolean; data: Record<string, unknown> }>(
        `/api/workflows/${workflowId}/rex-fixes/apply`,
        { method: "POST", body: { nodeId, actions }, token }
      ),
  },

  compliance: {
    getWorkflowLegalBasis: (token: string, workflowId: string) =>
      apiCall<{ success: boolean; data: Record<string, unknown> | null }>(
        `/api/compliance/workflows/${workflowId}/legal-basis`,
        { token }
      ),
    setWorkflowLegalBasis: (token: string, workflowId: string, payload: Record<string, unknown>) =>
      apiCall<{ success: boolean; data: { id: string } }>(
        `/api/compliance/workflows/${workflowId}/legal-basis`,
        { method: "PUT", body: payload, token }
      ),
    listDataSubjectRequests: (token: string, mine = false) =>
      apiCall<{ success: boolean; data: Array<Record<string, unknown>> }>(
        `/api/compliance/data-subject-requests${mine ? "?mine=true" : ""}`,
        { token }
      ),
    createDataSubjectRequest: (token: string, payload: Record<string, unknown>) =>
      apiCall<{ success: boolean; data: { id: string } }>(
        "/api/compliance/data-subject-requests",
        { method: "POST", body: payload, token }
      ),
    respondDataSubjectRequest: (token: string, requestId: string, payload: Record<string, unknown>) =>
      apiCall<{ success: boolean; data: { id: string } }>(
        `/api/compliance/data-subject-requests/${requestId}/respond`,
        { method: "POST", body: payload, token }
      ),
    report: (token: string) =>
      apiCall<{ success: boolean; data: Record<string, unknown> }>(
        "/api/compliance/report",
        { token }
      ),
  },
};

// Client-side types
export interface AuthUserClient {
  id: string;
  email: string;
  name: string;
  role: "admin" | "editor" | "viewer";
}

export interface WorkflowListItem {
  id: string;
  name: string;
  description: string;
  status: string;
  version: number;
  sourceTemplateId?: string | null;
  sourceTemplateVersion?: number | null;
  sourceTemplateParams?: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
}

export interface WorkflowDetail extends WorkflowListItem {
  userId: string;
  nodes: WorkflowNodeClient[];
  edges: WorkflowEdgeClient[];
}

export interface WorkflowNodeClient {
  id: string;
  type: string;
  label: string;
  position: { x: number; y: number };
  config: Record<string, unknown>;
}

export interface WorkflowEdgeClient {
  id: string;
  source: string;
  target: string;
  condition?: string | boolean;
}

export interface CreateWorkflowPayload {
  name: string;
  description: string;
  nodes: WorkflowNodeClient[];
  edges: WorkflowEdgeClient[];
}

export interface UpdateWorkflowPayload {
  name?: string;
  description?: string;
  status?: string;
  nodes?: WorkflowNodeClient[];
  edges?: WorkflowEdgeClient[];
}

export interface WorkflowTemplateClient {
  id: string;
  version: number;
  name: string;
  description: string;
  category: "rag" | "agentic" | "memory" | "multimodal";
  maturity: "planned" | "in-progress";
  defaultWorkflowName: string;
  tags: string[];
}

export interface InstantiateTemplatePayload {
  name?: string;
  description?: string;
  params?: TemplateRuntimeParamsPayload;
}

export interface TemplatePreviewResult {
  template: WorkflowTemplateClient;
  workflowName: string;
  description: string;
  params: TemplateRuntimeParamsPayload;
  nodes: WorkflowNodeClient[];
  edges: WorkflowEdgeClient[];
}

export interface TemplateRuntimeParamsPayload {
  queryPath?: string;
  topK?: number;
  corpusId?: string;
  scopeType?: "user" | "workflow" | "execution";
  workflowId?: string;
  executionId?: string;
}

export interface KnowledgeCorpusClient {
  id: string;
  userId: string;
  name: string;
  description: string;
  scopeType: "user" | "workflow" | "execution";
  workflowId: string | null;
  executionId: string | null;
  status: string;
  metadata: unknown;
  createdAt: string;
  updatedAt: string;
}

export interface KnowledgeDocumentClient {
  id: string;
  corpusId: string;
  userId: string;
  sourceType: "upload" | "inline" | "api" | string;
  title: string;
  mimeType: string | null;
  status: "pending" | "processing" | "ready" | "failed" | string;
  error: string | null;
  metadata: unknown;
  createdAt: string;
  updatedAt: string;
}

export interface KnowledgeChunkClient {
  id: string;
  corpusId: string;
  documentId: string;
  chunkIndex: number;
  content: string;
  tokenCount: number | null;
  embeddingModel: string;
  metadata: unknown;
  createdAt: string;
}

export interface KnowledgeQueryResultClient {
  query: string;
  matches: Array<{
    corpusId: string;
    documentId: string;
    chunkId: string;
    chunkIndex: number;
    score: number;
    content: string;
    title: string;
    sourceType: string;
    metadata: unknown;
  }>;
}

export interface ExecutionListItem {
  id: string;
  workflowId: string;
  status: string;
  createdAt: string;
  startedAt: string | null;
  finishedAt: string | null;
  errorMessage: string | null;
}

export interface ActiveWorkflowExecutionClient {
  workflowId: string;
  workflowName: string;
  workflowStatus: string;
  executionId: string;
  executionStatus: "pending" | "running" | string;
  startedAt: string | null;
  createdAt: string;
}

export interface ExecutionDetail extends ExecutionListItem {
  triggerPayload: Record<string, unknown>;
  steps: ExecutionStepClient[];
}

export interface ExecutionStepClient {
  id: string;
  nodeId: string;
  nodeType: string;
  status: string;
  input: Record<string, unknown>;
  output: Record<string, unknown> | null;
  durationMs: number | null;
  error: string | null;
}

export interface ApiKeyItem {
  id: string;
  provider: string;
  label: string;
  createdAt: string;
}

export interface ModelRegistryClient {
  id: string;
  provider: string;
  model: string;
  displayName: string;
  contextWindow: number | null;
  maxOutputTokens: number | null;
  supportsStreaming: boolean;
  supportsTools: boolean;
  qualityTier: string;
  costInputPer1k: string | null;
  costOutputPer1k: string | null;
  capabilities: Record<string, unknown>;
  metadata: Record<string, unknown>;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface KpiSummaryClient {
  windowDays: number;
  ttftMs: number | null;
  latency: {
    avgStepMs: number;
    p95StepMs: number;
    breaches: number;
    thresholdMs: number;
  };
  retrieval: {
    totalEvents: number;
    hitRate: number;
    emptyRate: number;
    failureRate: number;
  };
  guardrails: {
    triggered: number;
  };
  corpus: {
    totalCorpora: number;
    failedCorpora: number;
    totalDocuments: number;
    failedDocuments: number;
    staleCorpora: number;
  };
  executions: {
    total: number;
    completed: number;
    failed: number;
    running: number;
  };
}

export interface KpiTimeseriesPointClient {
  date: string;
  executions: number;
  failures: number;
  avgStepMs: number;
  retrievalHitRate: number;
  guardrailTriggers: number;
}

export interface WorkspaceClient {
  id: string;
  name: string;
  role: string;
}

export interface WorkflowPermissionClient {
  id: string;
  userId: string;
  role: string;
  attributes: Record<string, unknown>;
  expiresAt: string | null;
}

export interface IamPolicyClient {
  id: string;
  userId: string | null;
  workflowId: string | null;
  action: string;
  effect: string;
  conditions: Record<string, unknown>;
  isActive: boolean;
}

export interface HyperparameterProfileClient {
  id: string;
  workflowId: string | null;
  name: string;
  description: string;
  config: Record<string, unknown>;
  isDefault: boolean;
  isActive: boolean;
}

export interface AlertRuleClient {
  id: string;
  workflowId: string | null;
  ruleType: string;
  severity: string;
  threshold: number;
  windowMinutes: number;
  config: Record<string, unknown>;
  isActive: boolean;
}

export interface AlertEventClient {
  id: string;
  workflowId: string | null;
  ruleType: string;
  severity: string;
  message: string;
  payload: Record<string, unknown>;
  triggeredAt: string;
  resolvedAt: string | null;
}

export interface ConsentClient {
  id: string;
  consentType: string;
  policyVersion: string;
  granted: boolean;
  metadata: Record<string, unknown>;
  updatedAt: string;
}

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
