// ──────────────────────────────────────────────
// REX - Workflow Template Types
// ──────────────────────────────────────────────

export type WorkflowTemplateId =
  | "simple-rag"
  | "memory-augmented-rag"
  | "agentic-rag"
  | "graph-rag"
  | "branched-rag"
  | "self-rag"
  | "adaptive-rag"
  | "speculative-rag"
  | "corrective-rag"
  | "modular-rag"
  | "multimodal-rag"
  | "hyde-retrieval";

export type WorkflowTemplateCategory =
  | "rag"
  | "agentic"
  | "memory"
  | "multimodal";

export type WorkflowTemplateMaturity = "planned" | "in-progress";

export interface WorkflowTemplateDescriptor {
  id: WorkflowTemplateId;
  version: number;
  name: string;
  description: string;
  category: WorkflowTemplateCategory;
  maturity: WorkflowTemplateMaturity;
  defaultWorkflowName: string;
  tags: string[];
}

export interface WorkflowTemplateRuntimeParams {
  queryPath?: string;
  topK?: number;
  corpusId?: string;
  scopeType?: "user" | "workflow" | "execution";
  workflowId?: string;
  executionId?: string;
}

export interface WorkflowTemplateInstantiateInput {
  name?: string;
  description?: string;
  params?: WorkflowTemplateRuntimeParams;
}
