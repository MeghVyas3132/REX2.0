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

  const response = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error?.message ?? "Request failed");
  }

  return data;
}

export const api = {
  auth: {
    register: (email: string, name: string, password: string) =>
      apiCall<{ success: boolean; data: { user: { id: string; email: string; name: string }; token: string } }>(
        "/api/auth/register",
        { method: "POST", body: { email, name, password } }
      ),
    login: (email: string, password: string) =>
      apiCall<{ success: boolean; data: { user: { id: string; email: string; name: string }; token: string } }>(
        "/api/auth/login",
        { method: "POST", body: { email, password } }
      ),
    me: (token: string) =>
      apiCall<{ success: boolean; data: { user: { id: string; email: string; name: string } } }>(
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
  },

  executions: {
    get: (token: string, id: string) =>
      apiCall<{ success: boolean; data: ExecutionDetail }>(
        `/api/executions/${id}`,
        { token }
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
};

// Client-side types
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

export interface ExecutionListItem {
  id: string;
  workflowId: string;
  status: string;
  createdAt: string;
  startedAt: string | null;
  finishedAt: string | null;
  errorMessage: string | null;
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

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
