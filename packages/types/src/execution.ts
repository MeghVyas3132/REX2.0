// ──────────────────────────────────────────────
// REX - Execution Types
// ──────────────────────────────────────────────

export type ExecutionStatus = "pending" | "running" | "completed" | "failed";
export type StepStatus = "pending" | "running" | "completed" | "failed" | "skipped";

export interface Execution {
  id: string;
  workflowId: string;
  status: ExecutionStatus;
  triggerPayload: Record<string, unknown>;
  startedAt: Date | null;
  finishedAt: Date | null;
  errorMessage: string | null;
  createdAt: Date;
}

export interface ExecutionStep {
  id: string;
  executionId: string;
  nodeId: string;
  nodeType: string;
  status: StepStatus;
  input: Record<string, unknown>;
  output: Record<string, unknown> | null;
  durationMs: number | null;
  error: string | null;
  createdAt: Date;
}

export interface ExecutionJobPayload {
  executionId: string;
  workflowId: string;
  triggerPayload: Record<string, unknown>;
  userId: string;
}

export interface ExecutionResult {
  executionId: string;
  status: ExecutionStatus;
  steps: ExecutionStepResult[];
  totalDurationMs: number;
  errorMessage: string | null;
}

export interface ExecutionStepResult {
  nodeId: string;
  nodeType: string;
  status: StepStatus;
  input: Record<string, unknown>;
  output: Record<string, unknown> | null;
  durationMs: number;
  error: string | null;
}
