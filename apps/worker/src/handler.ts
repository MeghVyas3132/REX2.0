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
  ApiProviderType,
  EmbeddingProviderType,
  RerankerProviderType,
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
  executionAuthorizations,
  guardrailEvents,
  alertRules,
  alertEvents,
  apiKeys,
  domainConfigs,
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
  lexicalRelevanceScore,
} from "@rex/utils";
import { eq, and, inArray, desc, or, isNull, gt, gte } from "drizzle-orm";

const logger = createLogger("job-handler");
const EXECUTION_STOPPED_CODE = "EXECUTION_STOPPED";

class ExecutionStoppedError extends Error {
  readonly code = EXECUTION_STOPPED_CODE;
}

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

  const [currentExecution] = await db
    .select({ status: executions.status })
    .from(executions)
    .where(eq(executions.id, executionId))
    .limit(1);

  // Execution may have been deleted/canceled before worker picked up the job.
  if (!currentExecution || currentExecution.status === "canceled") {
    logger.info({ executionId, workflowId }, "Skipping execution job; execution is missing or canceled");
    return;
  }

  // Update status to running
  await db
    .update(executions)
    .set({ status: "running", startedAt: new Date() })
    .where(eq(executions.id, executionId));

  try {
    await assertExecutionAuthorized(db, {
      executionAuthorizationId: job.data.executionAuthorizationId,
      executionId,
      workflowId,
      userId,
    });

    // Load workflow
    const [workflow] = await db
      .select()
      .from(workflows)
      .where(eq(workflows.id, workflowId))
      .limit(1);

    if (!workflow) {
      throw new ExecutionStoppedError(`Workflow ${workflowId} not found`);
    }

    const resolvedDomainConfig = await resolveRuntimeDomainConfig(
      db,
      userId,
      workflowId,
      toRecord(job.data.domainConfig)
    );
    const nodes = applyDomainConfigToNodes(
      workflow.nodes as WorkflowNode[],
      resolvedDomainConfig
    );
    const edges = workflow.edges as WorkflowEdge[];
    let contextSequence = 0;
    const decryptedApiKeyCache = new Map<ApiProviderType, string>();

    const getProviderApiKey = async (provider: ApiProviderType): Promise<string | null> => {
      const cached = decryptedApiKeyCache.get(provider);
      if (cached) return cached;

      const [key] = await db
        .select()
        .from(apiKeys)
        .where(and(eq(apiKeys.userId, userId), eq(apiKeys.provider, provider)))
        .limit(1);

      if (!key) {
        return null;
      }

      const decrypted = decrypt(key.encryptedKey, config.encryption.masterKey);
      decryptedApiKeyCache.set(provider, decrypted);
      return decrypted;
    };

    // LLM API key resolver
    const getApiKey = async (provider: LLMProviderType): Promise<string> => {
      const key = await getProviderApiKey(provider);
      if (!key) {
        throw new Error(
          `No ${provider} API key found for user. Please add your API key in settings.`
        );
      }
      return key;
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
      retrieveKnowledge: async (query) =>
        queryKnowledgeForExecution(db, query, resolvedDomainConfig, getProviderApiKey),
      ingestKnowledge: async (input) =>
        ingestKnowledgeForExecution(db, input, resolvedDomainConfig, getProviderApiKey),
      initialContext: {
        memory: {
          triggerPayload,
          domainConfig: resolvedDomainConfig,
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
        await assertExecutionStillRunnable(db, executionId);
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
        await persistGuardrailEvent(db, {
          executionId,
          workflowId,
          userId,
          step,
        });
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

    await evaluateAlertRulesForExecution(db, userId, workflowId, executionId);

    logger.info({
      executionId,
      status: result.status,
      totalDurationMs: result.totalDurationMs,
      stepsCompleted: result.steps.filter((s: ExecutionStepResult) => s.status === "completed").length,
    }, "Execution completed");
  } catch (err) {
    if (isExecutionStoppedError(err)) {
      await db
        .update(executions)
        .set({
          status: "canceled",
          finishedAt: new Date(),
          errorMessage: "Stopped by user",
        })
        .where(eq(executions.id, executionId));

      logger.info({ executionId, workflowId }, "Execution stopped by user request");
      return;
    }

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

    await evaluateAlertRulesForExecution(db, userId, workflowId, executionId);

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

async function persistGuardrailEvent(
  db: Database,
  input: {
    executionId: string;
    workflowId: string;
    userId: string;
    step: ExecutionStepResult;
  }
): Promise<void> {
  if (input.step.nodeType !== "input-guard" && input.step.nodeType !== "output-guard") {
    return;
  }

  const guard = input.step.output && typeof input.step.output === "object"
    ? toRecord(input.step.output["_guard"])
    : {};
  const triggered = guard["triggered"] === true || input.step.status === "failed";
  if (!triggered) {
    return;
  }

  const reason =
    typeof guard["reason"] === "string"
      ? guard["reason"]
      : input.step.error ?? "Guardrail triggered";
  const severity = input.step.status === "failed" ? "block" : "warn";
  const guardType = input.step.nodeType === "input-guard" ? "input" : "output";

  try {
    await db.insert(guardrailEvents).values({
      userId: input.userId,
      workflowId: input.workflowId,
      executionId: input.executionId,
      nodeId: input.step.nodeId,
      nodeType: input.step.nodeType,
      guardType,
      severity,
      reason: reason.slice(0, 1024),
      payload: guard,
    });
  } catch (err) {
    if (isMissingRelationError(err)) {
      logger.warn(
        { executionId: input.executionId, nodeId: input.step.nodeId },
        "Guardrail events table not found; skipping persistence"
      );
      return;
    }
    logger.warn(
      {
        executionId: input.executionId,
        nodeId: input.step.nodeId,
        error: err instanceof Error ? err.message : "Unknown error",
      },
      "Failed to persist guardrail event"
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

async function assertExecutionStillRunnable(
  db: Database,
  executionId: string
): Promise<void> {
  const [execution] = await db
    .select({ status: executions.status })
    .from(executions)
    .where(eq(executions.id, executionId))
    .limit(1);

  if (!execution || execution.status === "canceled") {
    throw new ExecutionStoppedError("Execution was stopped");
  }
}

function isExecutionStoppedError(err: unknown): boolean {
  if (!err || typeof err !== "object") return false;
  const maybeCode = (err as { code?: unknown }).code;
  return maybeCode === EXECUTION_STOPPED_CODE;
}

async function assertExecutionAuthorized(
  db: Database,
  input: {
    executionAuthorizationId?: string;
    executionId: string;
    workflowId: string;
    userId: string;
  }
): Promise<void> {
  if (!input.executionAuthorizationId) {
    throw new Error("Execution authorization token missing from job payload");
  }

  const [authorization] = await db
    .select({
      id: executionAuthorizations.id,
      validatedAt: executionAuthorizations.validatedAt,
    })
    .from(executionAuthorizations)
    .where(
      and(
        eq(executionAuthorizations.id, input.executionAuthorizationId),
        eq(executionAuthorizations.executionId, input.executionId),
        eq(executionAuthorizations.workflowId, input.workflowId),
        eq(executionAuthorizations.userId, input.userId),
        eq(executionAuthorizations.revoked, false),
        gt(executionAuthorizations.expiresAt, new Date())
      )
    )
    .limit(1);

  if (!authorization) {
    throw new Error("Execution authorization is invalid, revoked, or expired");
  }

  if (!authorization.validatedAt) {
    await db
      .update(executionAuthorizations)
      .set({ validatedAt: new Date() })
      .where(eq(executionAuthorizations.id, authorization.id));
  }
}

async function evaluateAlertRulesForExecution(
  db: Database,
  userId: string,
  workflowId: string,
  executionId: string
): Promise<void> {
  try {
    const rules = await db
      .select()
      .from(alertRules)
      .where(
        and(
          eq(alertRules.userId, userId),
          eq(alertRules.isActive, true),
          or(eq(alertRules.workflowId, workflowId), isNull(alertRules.workflowId))
        )
      );

    if (rules.length === 0) return;

    for (const rule of rules) {
      if (rule.ruleType === "latency-breach") {
        const [step] = await db
          .select({ id: executionSteps.id })
          .from(executionSteps)
          .where(
            and(
              eq(executionSteps.executionId, executionId),
              gte(executionSteps.durationMs, rule.threshold)
            )
          )
          .limit(1);
        if (!step) continue;

        await db.insert(alertEvents).values({
          userId,
          workflowId,
          alertRuleId: rule.id,
          ruleType: rule.ruleType,
          severity: rule.severity,
          message: `Latency threshold breached on execution ${executionId}`,
          payload: {
            executionId,
            thresholdMs: rule.threshold,
          },
        });
        continue;
      }

      if (rule.ruleType === "guardrail-triggered") {
        const windowStart = new Date(Date.now() - rule.windowMinutes * 60 * 1000);
        const events = await db
          .select({ id: guardrailEvents.id })
          .from(guardrailEvents)
          .where(
            and(
              eq(guardrailEvents.userId, userId),
              eq(guardrailEvents.workflowId, workflowId),
              gte(guardrailEvents.createdAt, windowStart)
            )
          );

        if (events.length < rule.threshold) continue;
        await db.insert(alertEvents).values({
          userId,
          workflowId,
          alertRuleId: rule.id,
          ruleType: rule.ruleType,
          severity: rule.severity,
          message: `Guardrail threshold reached (${events.length})`,
          payload: {
            workflowId,
            executionId,
            count: events.length,
            threshold: rule.threshold,
            windowMinutes: rule.windowMinutes,
          },
        });
        continue;
      }

      if (rule.ruleType === "corpus-health-alert") {
        const failed = await db
          .select({ id: knowledgeDocuments.id })
          .from(knowledgeDocuments)
          .where(and(eq(knowledgeDocuments.userId, userId), eq(knowledgeDocuments.status, "failed")));
        const total = await db
          .select({ id: knowledgeDocuments.id })
          .from(knowledgeDocuments)
          .where(eq(knowledgeDocuments.userId, userId));

        const failurePct = total.length === 0 ? 0 : (failed.length / total.length) * 100;
        if (failurePct < rule.threshold) continue;

        await db.insert(alertEvents).values({
          userId,
          workflowId: null,
          alertRuleId: rule.id,
          ruleType: rule.ruleType,
          severity: rule.severity,
          message: `Corpus health threshold breached (${failurePct.toFixed(2)}% failed)`,
          payload: {
            failedDocuments: failed.length,
            totalDocuments: total.length,
            failurePct,
            thresholdPct: rule.threshold,
          },
        });
      }
    }
  } catch (err) {
    if (isMissingRelationError(err)) {
      logger.warn({ userId, workflowId, executionId }, "Alert tables missing; skipping alert evaluation");
      return;
    }
    logger.warn(
      {
        userId,
        workflowId,
        executionId,
        error: err instanceof Error ? err.message : "Unknown error",
      },
      "Failed to evaluate alert rules for execution"
    );
  }
}

async function resolveRuntimeDomainConfig(
  db: Database,
  userId: string,
  workflowId: string,
  queuedConfig: Record<string, unknown>
): Promise<Record<string, unknown>> {
  let rows: Array<{ config: unknown; userId: string | null; workflowId: string | null }> = [];
  try {
    rows = await db
      .select({ config: domainConfigs.config, userId: domainConfigs.userId, workflowId: domainConfigs.workflowId })
      .from(domainConfigs)
      .where(
        and(
          eq(domainConfigs.isActive, true),
          or(
            and(isNull(domainConfigs.userId), isNull(domainConfigs.workflowId)),
            and(eq(domainConfigs.userId, userId), isNull(domainConfigs.workflowId)),
            and(isNull(domainConfigs.userId), eq(domainConfigs.workflowId, workflowId)),
            and(eq(domainConfigs.userId, userId), eq(domainConfigs.workflowId, workflowId))
          )
        )
      );
  } catch (err) {
    if (isMissingRelationError(err)) {
      return queuedConfig;
    }
    throw err;
  }

  const sorted = rows.sort((a, b) => {
    const left = (a.userId ? 1 : 0) + (a.workflowId ? 2 : 0);
    const right = (b.userId ? 1 : 0) + (b.workflowId ? 2 : 0);
    return left - right;
  });

  const mergedFromDb = sorted.reduce<Record<string, unknown>>(
    (acc, row) => deepMerge(acc, toRecord(row.config)),
    {}
  );
  return deepMerge(mergedFromDb, queuedConfig);
}

function applyDomainConfigToNodes(
  nodes: WorkflowNode[],
  config: Record<string, unknown>
): WorkflowNode[] {
  const llmConfig = toRecord(config["llm"]);
  const retrievalConfig = toRecord(config["retrieval"]);
  const defaultProvider = asString(llmConfig["defaultProvider"]);
  const defaultModel = asString(llmConfig["defaultModel"]);
  const defaultTemperature = asNumber(llmConfig["temperature"]);
  const defaultMaxTokens = asNumber(llmConfig["maxTokens"]);
  const defaultTopK = asNumber(retrievalConfig["topK"]);
  const defaultStrategy = asString(retrievalConfig["strategy"]);

  return nodes.map((node) => {
    const nodeConfig = { ...node.config };
    if (node.type === "llm") {
      if (!nodeConfig["provider"] && defaultProvider) nodeConfig["provider"] = defaultProvider;
      if (!nodeConfig["model"] && defaultModel) nodeConfig["model"] = defaultModel;
      if (nodeConfig["temperature"] === undefined && defaultTemperature !== null) {
        nodeConfig["temperature"] = defaultTemperature;
      }
      if (nodeConfig["maxTokens"] === undefined && defaultMaxTokens !== null) {
        nodeConfig["maxTokens"] = defaultMaxTokens;
      }
    } else if (node.type === "knowledge-retrieve") {
      if (nodeConfig["topK"] === undefined && defaultTopK !== null) {
        nodeConfig["topK"] = defaultTopK;
      }
      if (!nodeConfig["strategy"] && defaultStrategy) {
        nodeConfig["strategy"] = defaultStrategy;
      }
    } else if (node.type === "input-guard") {
      const guardrails = toRecord(config["guardrails"]);
      const blockPromptInjection = guardrails["blockPromptInjection"];
      if (nodeConfig["blockOnPromptInjection"] === undefined && typeof blockPromptInjection === "boolean") {
        nodeConfig["blockOnPromptInjection"] = blockPromptInjection;
      }
    } else if (node.type === "output-guard") {
      const guardrails = toRecord(config["guardrails"]);
      const blockToxicity = guardrails["blockToxicity"];
      if (nodeConfig["blockOnToxicity"] === undefined && typeof blockToxicity === "boolean") {
        nodeConfig["blockOnToxicity"] = blockToxicity;
      }
    }

    return {
      ...node,
      config: nodeConfig,
    };
  });
}

function deepMerge(
  base: Record<string, unknown>,
  overlay: Record<string, unknown>
): Record<string, unknown> {
  const out: Record<string, unknown> = { ...base };
  for (const [key, overlayValue] of Object.entries(overlay)) {
    const baseValue = out[key];
    if (
      baseValue &&
      typeof baseValue === "object" &&
      !Array.isArray(baseValue) &&
      overlayValue &&
      typeof overlayValue === "object" &&
      !Array.isArray(overlayValue)
    ) {
      out[key] = deepMerge(
        baseValue as Record<string, unknown>,
        overlayValue as Record<string, unknown>
      );
      continue;
    }
    out[key] = overlayValue;
  }
  return out;
}

function toRecord(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }
  return value as Record<string, unknown>;
}

function asString(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function asNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim().length > 0) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

async function queryKnowledgeForExecution(
  db: Database,
  query: RuntimeKnowledgeQuery,
  domainConfig: Record<string, unknown>,
  getProviderApiKey: (provider: ApiProviderType) => Promise<string | null>
): Promise<RuntimeKnowledgeQueryResult> {
  const topK = Math.max(1, Math.min(Math.floor(query.topK), 50));
  const retrievalConfig = toRecord(domainConfig["retrieval"]);
  const embeddingProviderType = parseEmbeddingProvider(retrievalConfig["embeddingProvider"]) ?? "deterministic";
  const embeddingModel = asString(retrievalConfig["embeddingModel"]) ?? undefined;
  const rerankEnabled = asBoolean(retrievalConfig["rerankEnabled"], false);
  const rerankerProviderType = parseRerankerProvider(retrievalConfig["rerankerProvider"]) ?? "heuristic";
  const rerankerModel = asString(retrievalConfig["rerankerModel"]) ?? undefined;
  const candidateMultiplier = clampNumber(asNumber(retrievalConfig["candidateMultiplier"]), 8, 80, 40);

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

  const candidateLimit = Math.max(Math.min(topK * candidateMultiplier, 1000), topK * 8);
  const candidates = await db
    .select({
      chunkId: knowledgeChunks.id,
      corpusId: knowledgeChunks.corpusId,
      documentId: knowledgeChunks.documentId,
      chunkIndex: knowledgeChunks.chunkIndex,
      content: knowledgeChunks.content,
      embedding: knowledgeChunks.embedding,
      embeddingVector: knowledgeChunks.embeddingVector,
      metadata: knowledgeChunks.metadata,
      pageNumber: knowledgeChunks.pageNumber,
      sectionPath: knowledgeChunks.sectionPath,
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

  const queryEmbedding = await embedQueryVector(
    query.query,
    embeddingProviderType,
    embeddingModel,
    getProviderApiKey
  );

  const preliminaryMatches = candidates
    .map((candidate) => {
      const embedding = parseStoredEmbedding(candidate.embeddingVector, candidate.embedding);
      const semanticScore = cosineSimilarity(queryEmbedding, embedding);
      const lexicalScore = lexicalRelevanceScore(query.query, candidate.content);
      const score = semanticScore * 0.7 + lexicalScore * 0.3;
      return {
        corpusId: candidate.corpusId,
        documentId: candidate.documentId,
        chunkId: candidate.chunkId,
        chunkIndex: candidate.chunkIndex,
        score,
        semanticScore,
        lexicalScore,
        content: candidate.content,
        title: candidate.title,
        sourceType: candidate.sourceType,
        metadata: {
          ...toRecord(candidate.metadata),
          pageNumber: candidate.pageNumber,
          sectionPath: candidate.sectionPath,
          semanticScore,
          lexicalScore,
        },
      };
    })
    .filter((match) => Number.isFinite(match.score))
    .sort((a, b) => b.score - a.score);

  const matches = rerankEnabled
    ? await rerankMatches(
        query.query,
        preliminaryMatches,
        rerankerProviderType,
        rerankerModel,
        getProviderApiKey
      )
    : preliminaryMatches;

  return {
    query: query.query,
    topK,
    matches: matches.slice(0, topK),
  };
}

async function ingestKnowledgeForExecution(
  db: Database,
  input: RuntimeKnowledgeIngestionRequest,
  domainConfig: Record<string, unknown>,
  getProviderApiKey: (provider: ApiProviderType) => Promise<string | null>
): Promise<RuntimeKnowledgeIngestionResult> {
  const scope = normalizeRuntimeIngestionScope(input);
  const retrievalConfig = toRecord(domainConfig["retrieval"]);
  const embeddingProviderType = parseEmbeddingProvider(retrievalConfig["embeddingProvider"]) ?? "deterministic";
  const embeddingModel = asString(retrievalConfig["embeddingModel"]) ?? undefined;
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
    const chunks = chunkDocumentByPage(contentText);
    if (chunks.length === 0) {
      throw new Error("Document content is empty after normalization");
    }

    const vectorResponse = await embedTexts(
      chunks.map((chunk) => chunk.content),
      embeddingProviderType,
      embeddingModel,
      getProviderApiKey
    );

    await db.delete(knowledgeChunks).where(eq(knowledgeChunks.documentId, document.id));
    await db.insert(knowledgeChunks).values(
      chunks.map((chunk, index) => ({
        corpusId,
        documentId: document.id,
        chunkIndex: chunk.index,
        content: chunk.content,
        tokenCount: estimateTokens(chunk.content),
        embedding: vectorResponse.vectors[index] ?? [],
        embeddingVector: toVectorLiteral(vectorResponse.vectors[index] ?? []),
        embeddingModel: vectorResponse.model,
        pageNumber: chunk.pageNumber,
        sectionPath: chunk.sectionPath,
        metadata: {
          start: chunk.startOffset,
          end: chunk.endOffset,
          runtimeIngestion: true,
          pageNumber: chunk.pageNumber,
          sectionPath: chunk.sectionPath,
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

async function embedQueryVector(
  query: string,
  provider: EmbeddingProviderType,
  model: string | undefined,
  getProviderApiKey: (provider: ApiProviderType) => Promise<string | null>
): Promise<number[]> {
  const response = await embedTexts([query], provider, model, getProviderApiKey);
  return response.vectors[0] ?? buildDeterministicEmbedding(query, 1536);
}

async function embedTexts(
  texts: string[],
  provider: EmbeddingProviderType,
  model: string | undefined,
  getProviderApiKey: (provider: ApiProviderType) => Promise<string | null>
): Promise<{ vectors: number[][]; model: string }> {
  try {
    if (provider === "openai") {
      const key = await getProviderApiKey("openai");
      if (key) {
        const response = await embedWithOpenAI(texts, key, model);
        return { vectors: response.vectors, model: response.model };
      }
      logger.warn("Missing OpenAI API key for embeddings; using deterministic embeddings");
    }

    if (provider === "cohere") {
      const key = await getProviderApiKey("cohere");
      if (key) {
        const response = await embedWithCohere(texts, key, model);
        return { vectors: response.vectors, model: response.model };
      }
      logger.warn("Missing Cohere API key for embeddings; using deterministic embeddings");
    }

    return {
      vectors: texts.map((text) => buildDeterministicEmbedding(text, 1536)),
      model: "rex-hash-v1-1536",
    };
  } catch (err) {
    logger.warn(
      { provider, error: err instanceof Error ? err.message : "Unknown error" },
      "Embedding provider failed; falling back to deterministic embeddings"
    );
    return {
      vectors: texts.map((text) => buildDeterministicEmbedding(text, 1536)),
      model: "rex-hash-v1-1536",
    };
  }
}

async function rerankMatches(
  query: string,
  matches: RuntimeKnowledgeQueryResult["matches"],
  provider: RerankerProviderType,
  model: string | undefined,
  getProviderApiKey: (provider: ApiProviderType) => Promise<string | null>
): Promise<RuntimeKnowledgeQueryResult["matches"]> {
  if (matches.length <= 1) return matches;

  let scores: number[] = [];
  let rerankerUsed: RerankerProviderType = "heuristic";
  try {
    if (provider === "cohere") {
      const key = await getProviderApiKey("cohere");
      if (key) {
        scores = await rerankWithCohere(
          query,
          matches.map((match) => match.content),
          key,
          model
        );
        rerankerUsed = "cohere";
      } else {
        logger.warn("Missing Cohere API key for reranker; using heuristic reranker");
        scores = matches.map((match) => lexicalRelevanceScore(query, match.content));
      }
    } else {
      scores = matches.map((match) => lexicalRelevanceScore(query, match.content));
    }
  } catch (err) {
    logger.warn(
      { provider, error: err instanceof Error ? err.message : "Unknown error" },
      "Reranker provider failed; falling back to heuristic reranker"
    );
    scores = matches.map((match) => lexicalRelevanceScore(query, match.content));
    rerankerUsed = "heuristic";
  }

  return matches
    .map((match, index) => {
      const rerankScore = typeof scores[index] === "number" && Number.isFinite(scores[index])
        ? scores[index]
        : 0;
      const score = match.score * 0.65 + rerankScore * 0.35;
      const metadata = toRecord(match.metadata);
      return {
        ...match,
        score,
        metadata: {
          ...metadata,
          rerankScore,
          reranker: rerankerUsed,
        },
      };
    })
    .sort((a, b) => b.score - a.score);
}

async function embedWithOpenAI(
  texts: string[],
  apiKey: string,
  model?: string
): Promise<{ vectors: number[][]; model: string }> {
  const response = await fetch("https://api.openai.com/v1/embeddings", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: model ?? "text-embedding-3-small",
      input: texts,
    }),
  });
  if (!response.ok) {
    const body = await response.text().catch(() => "Unknown error");
    throw new Error(`OpenAI embeddings failed (${response.status}): ${body}`);
  }

  const json = (await response.json()) as {
    data?: Array<{ embedding?: number[] }>;
    model?: string;
  };
  return {
    vectors: (json.data ?? []).map((item) => item.embedding ?? []),
    model: json.model ?? model ?? "text-embedding-3-small",
  };
}

async function embedWithCohere(
  texts: string[],
  apiKey: string,
  model?: string
): Promise<{ vectors: number[][]; model: string }> {
  const resolvedModel = model ?? "embed-english-v3.0";
  const response = await fetch("https://api.cohere.com/v1/embed", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: resolvedModel,
      texts,
      input_type: "search_document",
    }),
  });
  if (!response.ok) {
    const body = await response.text().catch(() => "Unknown error");
    throw new Error(`Cohere embeddings failed (${response.status}): ${body}`);
  }

  const json = (await response.json()) as { embeddings?: number[][] };
  return {
    vectors: json.embeddings ?? [],
    model: resolvedModel,
  };
}

async function rerankWithCohere(
  query: string,
  documents: string[],
  apiKey: string,
  model?: string
): Promise<number[]> {
  const resolvedModel = model ?? "rerank-v3.5";
  const response = await fetch("https://api.cohere.com/v2/rerank", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: resolvedModel,
      query,
      documents,
      top_n: documents.length,
    }),
  });
  if (!response.ok) {
    const body = await response.text().catch(() => "Unknown error");
    throw new Error(`Cohere rerank failed (${response.status}): ${body}`);
  }

  const json = (await response.json()) as {
    results?: Array<{ index: number; relevance_score: number }>;
  };
  const scores = new Array(documents.length).fill(0);
  for (const result of json.results ?? []) {
    if (typeof result.index !== "number") continue;
    scores[result.index] =
      typeof result.relevance_score === "number" ? result.relevance_score : 0;
  }
  return scores;
}

function parseStoredEmbedding(embeddingVector: unknown, embeddingJson: unknown): number[] {
  const parsedVector = parseVectorLiteral(embeddingVector);
  if (parsedVector.length > 0) return parsedVector;
  return parseEmbedding(embeddingJson);
}

function parseVectorLiteral(value: unknown): number[] {
  if (Array.isArray(value)) return parseEmbedding(value);
  if (typeof value !== "string" || value.trim().length === 0) return [];
  const raw = value.trim();
  if (!raw.startsWith("[") || !raw.endsWith("]")) return [];
  try {
    const parsed = JSON.parse(raw) as unknown;
    return parseEmbedding(parsed);
  } catch {
    return [];
  }
}

function toVectorLiteral(vector: number[]): string {
  const normalized = vector
    .filter((value) => Number.isFinite(value))
    .map((value) => Number(value.toFixed(8)));
  return `[${normalized.join(",")}]`;
}

function parseEmbeddingProvider(value: unknown): EmbeddingProviderType | null {
  if (value === "deterministic" || value === "openai" || value === "cohere") {
    return value;
  }
  return null;
}

function parseRerankerProvider(value: unknown): RerankerProviderType | null {
  if (value === "heuristic" || value === "cohere") {
    return value;
  }
  return null;
}

function asBoolean(value: unknown, fallback: boolean): boolean {
  if (typeof value === "boolean") return value;
  if (typeof value === "string") {
    if (value.toLowerCase() === "true") return true;
    if (value.toLowerCase() === "false") return false;
  }
  return fallback;
}

function clampNumber(
  value: number | null,
  min: number,
  max: number,
  fallback: number
): number {
  if (value === null || !Number.isFinite(value)) return fallback;
  return Math.max(min, Math.min(max, Math.floor(value)));
}

interface ChunkWithPage {
  index: number;
  content: string;
  startOffset: number;
  endOffset: number;
  pageNumber: number;
  sectionPath: string | null;
}

function chunkDocumentByPage(contentText: string): ChunkWithPage[] {
  const pageTexts = contentText.split("\f");
  const chunksWithPage: ChunkWithPage[] = [];
  let chunkIndex = 0;
  let cumulativeOffset = 0;

  for (let pageIndex = 0; pageIndex < pageTexts.length; pageIndex++) {
    const pageText = pageTexts[pageIndex] ?? "";
    const pageNumber = pageIndex + 1;
    const sectionPath = extractSectionPath(pageText, pageNumber);
    const pageChunks = chunkText(pageText, {
      chunkSizeChars: 1200,
      chunkOverlapChars: 200,
    });

    for (const chunk of pageChunks) {
      chunksWithPage.push({
        index: chunkIndex,
        content: chunk.content,
        startOffset: cumulativeOffset + chunk.start,
        endOffset: cumulativeOffset + chunk.end,
        pageNumber,
        sectionPath,
      });
      chunkIndex += 1;
    }

    cumulativeOffset += pageText.length + 1;
  }

  return chunksWithPage;
}

function extractSectionPath(pageText: string, pageNumber: number): string | null {
  const lines = pageText.split("\n");
  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) continue;
    if (line.startsWith("#")) {
      return line.replace(/^#+\s*/, "").slice(0, 255) || `page-${pageNumber}`;
    }
    if (line.toUpperCase() === line && line.length > 4 && line.length <= 80) {
      return line.slice(0, 255);
    }
  }
  return `page-${pageNumber}`;
}
