export interface WorkflowDraftNode {
  id: string;
  type: string;
  label: string;
  position: { x: number; y: number };
  config: Record<string, unknown>;
}

export interface WorkflowDraftEdge {
  id: string;
  source: string;
  target: string;
  condition?: string | boolean;
}

export interface WorkflowDraft {
  mode: "create" | "update";
  workflowId?: string;
  name: string;
  description: string;
  nodes: WorkflowDraftNode[];
  edges: WorkflowDraftEdge[];
  updatedAt: string;
}

const STORAGE_KEY = "rex.currentWorkflowDraft.v1";

export function loadWorkflowDraft(): WorkflowDraft | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as WorkflowDraft;
    if (!parsed || typeof parsed !== "object") return null;
    if (parsed.mode !== "create" && parsed.mode !== "update") return null;
    if (typeof parsed.name !== "string" || typeof parsed.description !== "string") return null;
    if (!Array.isArray(parsed.nodes) || !Array.isArray(parsed.edges)) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function saveWorkflowDraft(draft: Omit<WorkflowDraft, "updatedAt">): void {
  if (typeof window === "undefined") return;
  const value: WorkflowDraft = {
    ...draft,
    updatedAt: new Date().toISOString(),
  };
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
}

export function clearWorkflowDraft(): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(STORAGE_KEY);
}
