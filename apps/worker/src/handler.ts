// ──────────────────────────────────────────────
// REX - Workflow Execution Job Handler
// Pure job processing — no HTTP logic
// ──────────────────────────────────────────────

import type { Job } from "bullmq";
import type {
  ExecutionJobPayload,
  WorkflowNode,
  WorkflowEdge,
  LLMProviderType,
  ExecutionStepResult,
  ExecutionContextUpdate,
  RuntimeKnowledgeQuery,
  RuntimeKnowledgeQueryResult,
  RuntimeKnowledgeRetrievalEvent,
  RuntimeKnowledgeIngestionRequest,
  RuntimeKnowledgeIngestionResult,
} from "@rex/types";
import type { Database } from "@rex/database";
import {
  workflows,
  executions,
  executionSteps,
  executionStepAttempts,
  executionContextSnapshots,
  executionRetrievalEvents,
  apiKeys,
  knowledgeCorpora,
  knowledgeChunks,
  knowledgeDocuments,
} from "@rex/database";
import { executeWorkflow, registerAllNodes } from "@rex/engine";
import {
  createLogger,
  decrypt,
  loadConfig,
  buildDeterministicEmbedding,
  cosineSimilarity,
  parseEmbedding,
  chunkText,
  estimateTokens,
  sanitizeErrorMessage,
} from "@rex/utils";
import { eq, and, inArray, desc } from "drizzle-orm";

const logger = createLogger("job-handler");

// Register all nodes once at module load
registerAllNodes();

export async function handleExecutionJob(
  job: Job<ExecutionJobPayload>,
  db: Database
): Promise<void> {
  const { executionId, workflowId, triggerPayload, userId } = job.data;
  const config = loadConfig();

  logger.info({
    jobId: job.id,
    executionId,
    workflowId,
    attempt: job.attemptsMade + 1,
  }, "Processing execution job");

  // Update status to running
  await db
    .update(executions)
    .set({ status: "running", startedAt: new Date() })
    .where(eq(executions.id, executionId));

  try {
    // Load workflow
    const [workflow] = await db
      .select()
      .from(workflows)
      .where(eq(workflows.id, workflowId))
      .limit(1);

    if (!workflow) {
      throw new Error(`Workflow ${workflowId} not found`);
    }

    const nodes = workflow.nodes as WorkflowNode[];
    const edges = workflow.edges as WorkflowEdge[];
    let contextSequence = 0;

    // API key resolver
    const getApiKey = async (provider: LLMProviderType): Promise<string> => {
      const [key] = await db
        .select()
        .from(apiKeys)
        .where(and(eq(apiKeys.userId, userId), eq(apiKeys.provider, provider)))
        .limit(1);

      if (!key) {
        throw new Error(
          `No ${provider} API key found for user. Please add your API key in settings.`
        );
      }

      return decrypt(key.encryptedKey, config.encryption.masterKey);
    };

    // Execute workflow via engine
    const result = await executeWorkflow({
      executionId,
      workflowId,
      userId,
      nodes,
      edges,
      triggerPayload,
      getApiKey,
      retrieveKnowledge: async (query) => queryKnowledgeForExecution(db, query),
      ingestKnowledge: async (input) => ingestKnowledgeForExecution(db, input),
      initialContext: {
        memory: {
          triggerPayload,
        },
        retrieval: {
          totalRequests: 0,
          totalSuccesses: 0,
          totalEmpties: 0,
          totalFailures: 0,
          totalDurationMs: 0,
          maxRequests: Math.max(1, config.worker.retrievalMaxRequestsPerExecution),
          maxFailures: Math.max(1, config.worker.retrievalMaxFailuresPerExecution),
          maxDurationMs: Math.max(1000, config.worker.retrievalMaxDurationMsPerExecution),
        },
      },
      onStepStart: async (nodeId: string, nodeType: string) => {
        logger.debug({ executionId, nodeId, nodeType }, "Step starting");
      },
      onStepComplete: async (step: ExecutionStepResult) => {
        // Persist each step result to database
        await db.insert(executionSteps).values({
          executionId,
          nodeId: step.nodeId,
          nodeType: step.nodeType,
          status: step.status,
          input: step.input,
          output: step.output,
          durationMs: step.durationMs,
          error: step.error,
        });

        await persistStepAttempts(db, executionId, step);
      },
      onContextUpdate: async (update: ExecutionContextUpdate) => {
        contextSequence += 1;
        await persistExecutionContextSnapshot(db, executionId, contextSequence, update);
      },
      onRetrievalEvent: async (event: RuntimeKnowledgeRetrievalEvent) => {
        await persistRetrievalEvent(db, executionId, event);
      },
    });

    // Update execution final status
    await db
      .update(executions)
      .set({
        status: result.status,
        finishedAt: new Date(),
        errorMessage: result.errorMessage,
      })
      .where(eq(executions.id, executionId));

    logger.info({
      executionId,
      status: result.status,
      totalDurationMs: result.totalDurationMs,
      stepsCompleted: result.steps.filter((s: ExecutionStepResult) => s.status === "completed").length,
    }, "Execution completed");
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "Unknown error";

    logger.error({
      executionId,
      workflowId,
      error: errorMessage,
      attempt: job.attemptsMade + 1,
    }, "Execution failed");

    // Update status to failed
    await db
      .update(executions)
      .set({
        status: "failed",
        finishedAt: new Date(),
        errorMessage,
      })
      .where(eq(executions.id, executionId));

    throw err; // Re-throw for BullMQ retry logic
  }
}

interface PersistedStepAttempt {
  attempt: number;
  status: "completed" | "retry" | "failed";
  durationMs: number;
  reason: string | null;
}

async function persistStepAttempts(
  db: Database,
  executionId: string,
  step: ExecutionStepResult
): Promise<void> {
  const attempts = extractStepAttempts(step.output);
  if (attempts.length === 0) {
    return;
  }

  try {
    await db.insert(executionStepAttempts).values(
      attempts.map((attempt) => ({
        executionId,
        nodeId: step.nodeId,
        nodeType: step.nodeType,
        attempt: attempt.attempt,
        status: attempt.status,
        durationMs: attempt.durationMs,
        reason: attempt.reason,
      }))
    );
  } catch (err) {
    if (isMissingRelationError(err)) {
      logger.warn(
        { executionId, nodeId: step.nodeId },
        "Execution step attempts table not found; skipping persistence"
      );
      return;
    }

    logger.warn(
      {
        executionId,
        nodeId: step.nodeId,
        error: err instanceof Error ? err.message : "Unknown error",
      },
      "Failed to persist execution step attempts"
    );
  }
}

function extractStepAttempts(output: Record<string, unknown> | null): PersistedStepAttempt[] {
  if (!output || !Array.isArray(output["_attempts"])) {
    return [];
  }

  const rawAttempts = output["_attempts"] as unknown[];
  const attempts: PersistedStepAttempt[] = [];

  for (const raw of rawAttempts) {
    if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
      continue;
    }
    const attempt = raw as Record<string, unknown>;
    const attemptNumber = Number(attempt["attempt"]);
    const durationMs = Number(attempt["durationMs"]);
    const status = attempt["status"];
    const reason = attempt["reason"];

    if (
      !Number.isInteger(attemptNumber) ||
      attemptNumber < 1 ||
      !Number.isFinite(durationMs) ||
      durationMs < 0 ||
      (status !== "completed" && status !== "retry" && status !== "failed")
    ) {
      continue;
    }

    attempts.push({
      attempt: attemptNumber,
      durationMs: Math.floor(durationMs),
      status,
      reason: typeof reason === "string" ? reason : null,
    });
  }

  return attempts;
}

async function persistRetrievalEvent(
  db: Database,
  executionId: string,
  event: RuntimeKnowledgeRetrievalEvent
): Promise<void> {
  try {
    await db.insert(executionRetrievalEvents).values({
      executionId,
      nodeId: event.nodeId,
      nodeType: event.nodeType,
      query: event.query,
      topK: event.topK,
      attempt: event.attempt,
      maxAttempts: event.maxAttempts,
      status: event.status,
      matchesCount: event.matchesCount,
      durationMs: event.durationMs,
      errorMessage: event.errorMessage,
      scopeType: event.scopeType ?? null,
      corpusId: event.corpusId ?? null,
      workflowIdScope: event.workflowIdScope ?? null,
      executionIdScope: event.executionIdScope ?? null,
      strategy: event.strategy ?? null,
      retrieverKey: event.retrieverKey ?? null,
      branchIndex: event.branchIndex ?? null,
      selected:
        typeof event.selected === "boolean"
          ? event.selected
          : null,
    });
  } catch (err) {
    if (isMissingRelationError(err)) {
      logger.warn(
        { executionId, nodeId: event.nodeId, attempt: event.attempt },
        "Execution retrieval events table not found; skipping persistence"
      );
      return;
    }

    logger.warn(
      {
        executionId,
        nodeId: event.nodeId,
        attempt: event.attempt,
        error: err instanceof Error ? err.message : "Unknown error",
      },
      "Failed to persist execution retrieval event"
    );
  }
}

async function persistExecutionContextSnapshot(
  db: Database,
  executionId: string,
  sequence: number,
  update: ExecutionContextUpdate
): Promise<void> {
  try {
    const state = JSON.parse(JSON.stringify(update.state)) as Record<string, unknown>;

    await db.insert(executionContextSnapshots).values({
      executionId,
      sequence,
      reason: update.reason,
      nodeId: update.nodeId,
      nodeType: update.nodeType,
      state,
    });
  } catch (err) {
    if (isMissingRelationError(err)) {
      logger.warn(
        {
          executionId,
          sequence,
          reason: update.reason,
        },
        "Execution context snapshot table not found; skipping persistence"
      );
      return;
    }

    logger.warn(
      {
        executionId,
        sequence,
        reason: update.reason,
        error: err instanceof Error ? err.message : "Unknown error",
      },
      "Failed to persist execution context snapshot"
    );
  }
}

function isMissingRelationError(err: unknown): boolean {
  if (!err || typeof err !== "object") return false;
  const maybeCode = (err as { code?: unknown }).code;
  return typeof maybeCode === "string" && maybeCode === "42P01";
}

async function queryKnowledgeForExecution(
  db: Database,
  query: RuntimeKnowledgeQuery
): Promise<RuntimeKnowledgeQueryResult> {
  const topK = Math.max(1, Math.min(Math.floor(query.topK), 50));
  const scope = normalizeRuntimeQueryScope(query);
  const corpusConditions = [
    eq(knowledgeCorpora.userId, query.userId),
    eq(knowledgeCorpora.status, "ready"),
  ];

  if (query.corpusId) {
    corpusConditions.push(eq(knowledgeCorpora.id, query.corpusId));
  }
  if (scope.scopeType) {
    corpusConditions.push(eq(knowledgeCorpora.scopeType, scope.scopeType));
  }
  if (scope.workflowIdScope) {
    corpusConditions.push(eq(knowledgeCorpora.workflowId, scope.workflowIdScope));
  }
  if (scope.executionIdScope) {
    corpusConditions.push(eq(knowledgeCorpora.executionId, scope.executionIdScope));
  }

  const corpusWhere =
    corpusConditions.length === 1 ? corpusConditions[0] : and(...corpusConditions);

  const corpora = await db
    .select({ id: knowledgeCorpora.id })
    .from(knowledgeCorpora)
    .where(corpusWhere);
  const corpusIds = corpora.map((corpus) => corpus.id);

  if (corpusIds.length === 0) {
    return { query: query.query, topK, matches: [] };
  }

  const candidateLimit = Math.max(Math.min(topK * 40, 1000), topK * 8);
  const candidates = await db
    .select({
      chunkId: knowledgeChunks.id,
      corpusId: knowledgeChunks.corpusId,
      documentId: knowledgeChunks.documentId,
      chunkIndex: knowledgeChunks.chunkIndex,
      content: knowledgeChunks.content,
      embedding: knowledgeChunks.embedding,
      metadata: knowledgeChunks.metadata,
      title: knowledgeDocuments.title,
      sourceType: knowledgeDocuments.sourceType,
    })
    .from(knowledgeChunks)
    .innerJoin(knowledgeDocuments, eq(knowledgeDocuments.id, knowledgeChunks.documentId))
    .where(
      and(
        inArray(knowledgeChunks.corpusId, corpusIds),
        eq(knowledgeDocuments.status, "ready")
      )
    )
    .limit(candidateLimit);

  const queryEmbedding = buildDeterministicEmbedding(query.query, 64);
  const matches = candidates
    .map((candidate) => {
      const embedding = parseEmbedding(candidate.embedding);
      const score = cosineSimilarity(queryEmbedding, embedding);
      return {
        corpusId: candidate.corpusId,
        documentId: candidate.documentId,
        chunkId: candidate.chunkId,
        chunkIndex: candidate.chunkIndex,
        score,
        content: candidate.content,
        title: candidate.title,
        sourceType: candidate.sourceType,
        metadata: candidate.metadata,
      };
    })
    .filter((match) => Number.isFinite(match.score))
    .sort((a, b) => b.score - a.score)
    .slice(0, topK);

  return {
    query: query.query,
    topK,
    matches,
  };
}

async function ingestKnowledgeForExecution(
  db: Database,
  input: RuntimeKnowledgeIngestionRequest
): Promise<RuntimeKnowledgeIngestionResult> {
  const scope = normalizeRuntimeIngestionScope(input);
  const corpusId = await resolveRuntimeCorpusForIngestion(db, input, scope);
  const sourceType = input.sourceType ?? "inline";
  const title = input.title.trim().slice(0, 255) || "Runtime Document";
  const contentText = input.contentText.trim();

  if (!contentText) {
    throw new Error("Knowledge ingestion content is empty");
  }

  const [document] = await db
    .insert(knowledgeDocuments)
    .values({
      corpusId,
      userId: input.userId,
      sourceType,
      title,
      mimeType: null,
      contentText,
      status: "processing",
      error: null,
      metadata: input.metadata ?? {
        runtimeIngestion: true,
        executionId: input.executionId,
        nodeId: input.nodeId,
      },
    })
    .returning({ id: knowledgeDocuments.id });

  if (!document) {
    throw new Error("Failed to create runtime knowledge document");
  }

  try {
    const chunks = chunkText(contentText, {
      chunkSizeChars: 1200,
      chunkOverlapChars: 200,
    });
    if (chunks.length === 0) {
      throw new Error("Document content is empty after normalization");
    }

    await db.delete(knowledgeChunks).where(eq(knowledgeChunks.documentId, document.id));
    await db.insert(knowledgeChunks).values(
      chunks.map((chunk) => ({
        corpusId,
        documentId: document.id,
        chunkIndex: chunk.index,
        content: chunk.content,
        tokenCount: estimateTokens(chunk.content),
        embedding: buildDeterministicEmbedding(chunk.content, 64),
        embeddingModel: "rex-hash-v1",
        metadata: {
          start: chunk.start,
          end: chunk.end,
          runtimeIngestion: true,
        },
      }))
    );

    await db
      .update(knowledgeDocuments)
      .set({ status: "ready", error: null, updatedAt: new Date() })
      .where(eq(knowledgeDocuments.id, document.id));

    await updateRuntimeCorpusStatus(db, corpusId);

    return {
      corpusId,
      documentId: document.id,
      chunkCount: chunks.length,
      status: "ready",
    };
  } catch (err) {
    const error = sanitizeErrorMessage(err);
    await db
      .update(knowledgeDocuments)
      .set({ status: "failed", error, updatedAt: new Date() })
      .where(eq(knowledgeDocuments.id, document.id));
    await updateRuntimeCorpusStatus(db, corpusId);
    throw new Error(`Knowledge ingestion failed: ${error}`);
  }
}

async function resolveRuntimeCorpusForIngestion(
  db: Database,
  input: RuntimeKnowledgeIngestionRequest,
  scope: {
    scopeType: "user" | "workflow" | "execution";
    workflowIdScope?: string;
    executionIdScope?: string;
  }
): Promise<string> {
  if (input.corpusId) {
    const [existing] = await db
      .select({ id: knowledgeCorpora.id })
      .from(knowledgeCorpora)
      .where(
        and(
          eq(knowledgeCorpora.id, input.corpusId),
          eq(knowledgeCorpora.userId, input.userId)
        )
      )
      .limit(1);
    if (!existing) {
      throw new Error("Specified corpusId was not found or is not accessible");
    }
    return existing.id;
  }

  const conditions = [
    eq(knowledgeCorpora.userId, input.userId),
    eq(knowledgeCorpora.scopeType, scope.scopeType),
  ];
  if (scope.workflowIdScope) {
    conditions.push(eq(knowledgeCorpora.workflowId, scope.workflowIdScope));
  }
  if (scope.executionIdScope) {
    conditions.push(eq(knowledgeCorpora.executionId, scope.executionIdScope));
  }

  const [existingScoped] = await db
    .select({ id: knowledgeCorpora.id })
    .from(knowledgeCorpora)
    .where(conditions.length === 1 ? conditions[0]! : and(...conditions))
    .orderBy(desc(knowledgeCorpora.updatedAt))
    .limit(1);

  if (existingScoped) {
    return existingScoped.id;
  }

  const [created] = await db
    .insert(knowledgeCorpora)
    .values({
      userId: input.userId,
      name: `Runtime Corpus ${new Date().toISOString()}`,
      description: "Runtime-ingested corpus for workflow execution",
      scopeType: scope.scopeType,
      workflowId: scope.scopeType === "workflow" ? (scope.workflowIdScope ?? null) : null,
      executionId: scope.scopeType === "execution" ? (scope.executionIdScope ?? null) : null,
      status: "ingesting",
      metadata: {
        runtimeIngestion: true,
        executionId: input.executionId,
      },
    })
    .returning({ id: knowledgeCorpora.id });

  if (!created) {
    throw new Error("Failed to create runtime knowledge corpus");
  }

  return created.id;
}

async function updateRuntimeCorpusStatus(db: Database, corpusId: string): Promise<void> {
  const statuses = await db
    .select({ status: knowledgeDocuments.status })
    .from(knowledgeDocuments)
    .where(eq(knowledgeDocuments.corpusId, corpusId));

  let status: "ingesting" | "ready" | "failed" = "ready";
  if (statuses.some((row) => row.status === "failed")) {
    status = "failed";
  } else if (
    statuses.some((row) => row.status === "pending" || row.status === "processing")
  ) {
    status = "ingesting";
  }

  await db
    .update(knowledgeCorpora)
    .set({ status, updatedAt: new Date() })
    .where(eq(knowledgeCorpora.id, corpusId));
}

function normalizeRuntimeQueryScope(query: RuntimeKnowledgeQuery): {
  scopeType?: RuntimeKnowledgeQuery["scopeType"];
  workflowIdScope?: string;
  executionIdScope?: string;
} {
  if (query.scopeType === "workflow") {
    return {
      scopeType: "workflow",
      workflowIdScope: query.workflowIdScope ?? query.workflowId,
    };
  }

  if (query.scopeType === "execution") {
    return {
      scopeType: "execution",
      executionIdScope: query.executionIdScope ?? query.executionId,
    };
  }

  return {
    scopeType: query.scopeType,
    workflowIdScope: query.workflowIdScope,
    executionIdScope: query.executionIdScope,
  };
}

function normalizeRuntimeIngestionScope(input: RuntimeKnowledgeIngestionRequest): {
  scopeType: "user" | "workflow" | "execution";
  workflowIdScope?: string;
  executionIdScope?: string;
} {
  if (input.scopeType === "workflow") {
    return {
      scopeType: "workflow",
      workflowIdScope: input.workflowIdScope ?? input.workflowId,
    };
  }

  if (input.scopeType === "execution") {
    return {
      scopeType: "execution",
      executionIdScope: input.executionIdScope ?? input.executionId,
    };
  }

  return {
    scopeType: "user",
  };
}
