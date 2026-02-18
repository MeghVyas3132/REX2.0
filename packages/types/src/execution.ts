// ──────────────────────────────────────────────
// REX - Execution Types
// ──────────────────────────────────────────────

export type ExecutionStatus = "pending" | "running" | "completed" | "failed" | "canceled";
export type StepStatus = "pending" | "running" | "completed" | "failed" | "skipped";
export type ExecutionContextUpdateReason = "init" | "step" | "final" | "error";

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
  context: ExecutionContextState;
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

export interface ExecutionContextControlState {
  loopCount: number;
  retryCount: number;
  maxLoops: number;
  maxRetries: number;
  terminate: boolean;
}

export interface ExecutionContextRetrievalState {
  totalRequests: number;
  totalSuccesses: number;
  totalEmpties: number;
  totalFailures: number;
  totalDurationMs: number;
  maxRequests: number;
  maxFailures: number;
  maxDurationMs: number;
}

export interface ExecutionContextRuntimeState {
  startedAt: string;
  updatedAt: string;
  activeNodeId: string | null;
  lastCompletedNodeId: string | null;
}

export interface ExecutionContextState {
  version: number;
  memory: Record<string, unknown>;
  knowledge: Record<string, unknown>;
  control: ExecutionContextControlState;
  retrieval: ExecutionContextRetrievalState;
  runtime: ExecutionContextRuntimeState;
}

export interface ExecutionContextPatch {
  memory?: Record<string, unknown>;
  knowledge?: Record<string, unknown>;
  control?: Partial<ExecutionContextControlState>;
  retrieval?: Partial<ExecutionContextRetrievalState>;
  runtime?: Partial<ExecutionContextRuntimeState>;
}

export interface ExecutionContextUpdate {
  reason: ExecutionContextUpdateReason;
  nodeId: string | null;
  nodeType: string | null;
  stepIndex: number;
  state: ExecutionContextState;
}
