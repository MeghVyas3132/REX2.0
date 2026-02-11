// ──────────────────────────────────────────────
// REX - Workflow Types
// ──────────────────────────────────────────────

export type WorkflowStatus = "active" | "inactive";

export interface WorkflowNode {
  id: string;
  type: string;
  label: string;
  position: { x: number; y: number };
  config: Record<string, unknown>;
}

export interface WorkflowEdge {
  id: string;
  source: string;
  target: string;
}

export interface Workflow {
  id: string;
  userId: string;
  name: string;
  description: string;
  status: WorkflowStatus;
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  version: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateWorkflowInput {
  name: string;
  description: string;
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
}

export interface UpdateWorkflowInput {
  name?: string;
  description?: string;
  status?: WorkflowStatus;
  nodes?: WorkflowNode[];
  edges?: WorkflowEdge[];
}
