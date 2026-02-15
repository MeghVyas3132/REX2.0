// ──────────────────────────────────────────────
// REX - Knowledge & Ingestion Types
// ──────────────────────────────────────────────

export type KnowledgeScopeType = "user" | "workflow" | "execution";
export type KnowledgeCorpusStatus = "ingesting" | "ready" | "failed";
export type KnowledgeDocumentStatus = "pending" | "processing" | "ready" | "failed";
export type KnowledgeSourceType = "upload" | "inline" | "api";
export type RuntimeKnowledgeRetrievalStrategy =
  | "single"
  | "merge"
  | "first-non-empty"
  | "best-score"
  | "adaptive";

export interface KnowledgeCorpus {
  id: string;
  userId: string;
  name: string;
  description: string;
  scopeType: KnowledgeScopeType;
  workflowId: string | null;
  executionId: string | null;
  status: KnowledgeCorpusStatus;
  metadata: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

export interface KnowledgeDocument {
  id: string;
  corpusId: string;
  userId: string;
  sourceType: KnowledgeSourceType;
  title: string;
  mimeType: string | null;
  contentText: string;
  status: KnowledgeDocumentStatus;
  error: string | null;
  metadata: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

export interface KnowledgeChunk {
  id: string;
  corpusId: string;
  documentId: string;
  chunkIndex: number;
  content: string;
  tokenCount: number | null;
  embedding: number[];
  embeddingModel: string;
  metadata: Record<string, unknown>;
  createdAt: Date;
}

export interface KnowledgeIngestionJobPayload {
  corpusId: string;
  documentId: string;
  userId: string;
}

export interface RuntimeKnowledgeNodeQueryInput {
  query: string;
  topK: number;
  corpusId?: string;
  scopeType?: KnowledgeScopeType;
  workflowIdScope?: string;
  executionIdScope?: string;
  retrieverKey?: string;
  retrievalStrategy?: RuntimeKnowledgeRetrievalStrategy;
  branchIndex?: number;
}

export interface RuntimeKnowledgeNodeIngestionInput {
  title: string;
  contentText: string;
  sourceType?: KnowledgeSourceType;
  corpusId?: string;
  scopeType?: KnowledgeScopeType;
  workflowIdScope?: string;
  executionIdScope?: string;
  metadata?: Record<string, unknown>;
}

export interface RuntimeKnowledgeIngestionRequest
  extends RuntimeKnowledgeNodeIngestionInput {
  executionId: string;
  workflowId: string;
  userId: string;
  nodeId: string;
  nodeType: string;
}

export interface RuntimeKnowledgeIngestionResult {
  corpusId: string;
  documentId: string;
  chunkCount: number;
  status: "ready" | "failed";
}

export interface RuntimeKnowledgeQuery {
  executionId: string;
  workflowId: string;
  userId: string;
  nodeId: string;
  nodeType: string;
  query: string;
  topK: number;
  corpusId?: string;
  scopeType?: KnowledgeScopeType;
  workflowIdScope?: string;
  executionIdScope?: string;
  retrieverKey?: string;
  retrievalStrategy?: RuntimeKnowledgeRetrievalStrategy;
  branchIndex?: number;
}

export interface RuntimeKnowledgeMatch {
  corpusId: string;
  documentId: string;
  chunkId: string;
  chunkIndex: number;
  score: number;
  content: string;
  title: string;
  sourceType: string;
  metadata: unknown;
}

export interface RuntimeKnowledgeQueryResult {
  query: string;
  topK: number;
  matches: RuntimeKnowledgeMatch[];
  orchestration?: {
    strategy: RuntimeKnowledgeRetrievalStrategy;
    speculative: boolean;
    retrieversTried: string[];
    selectedRetrieverKey?: string;
    branchCount: number;
  };
}

export type RuntimeKnowledgeRetrievalStatus = "success" | "empty" | "failed";

export interface RuntimeKnowledgeRetrievalEvent {
  executionId: string;
  workflowId: string;
  userId: string;
  nodeId: string;
  nodeType: string;
  query: string;
  topK: number;
  attempt: number;
  maxAttempts: number;
  durationMs: number;
  matchesCount: number;
  status: RuntimeKnowledgeRetrievalStatus;
  errorMessage: string | null;
  scopeType?: KnowledgeScopeType;
  corpusId?: string;
  workflowIdScope?: string;
  executionIdScope?: string;
  retrieverKey?: string;
  strategy?: RuntimeKnowledgeRetrievalStrategy;
  branchIndex?: number;
  selected?: boolean;
}
