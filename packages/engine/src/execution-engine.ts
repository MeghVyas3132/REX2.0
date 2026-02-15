// ──────────────────────────────────────────────
// REX - Workflow Execution Engine
// Pure domain logic — no HTTP, no framework deps
// ──────────────────────────────────────────────

import type {
  WorkflowNode,
  WorkflowEdge,
  NodeInput,
  NodeOutput,
  NodeExecutionContext,
  NodeLogger,
  ExecutionStepResult,
  ExecutionResult,
  ExecutionStatus,
  StepStatus,
  LLMProviderType,
  ExecutionContextState,
  ExecutionContextRetrievalState,
  ExecutionContextPatch,
  ExecutionContextUpdate,
  RuntimeKnowledgeQuery,
  RuntimeKnowledgeQueryResult,
  RuntimeKnowledgeRetrievalEvent,
  RuntimeKnowledgeIngestionRequest,
  RuntimeKnowledgeIngestionResult,
  RuntimeKnowledgeNodeQueryInput,
  RuntimeKnowledgeNodeIngestionInput,
  KnowledgeScopeType,
  RuntimeKnowledgeRetrievalStrategy,
} from "@rex/types";
import {
  createExecutionLogger,
  createCorrelationId,
  startTimer,
  measureDuration,
  sanitizeErrorMessage,
  sleep,
} from "@rex/utils";
import { validateDAG } from "./dag-validator.js";
import { resolveNode } from "./registry.js";

export interface EngineExecutionParams {
  executionId: string;
  workflowId: string;
  userId: string;
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  triggerPayload: Record<string, unknown>;
  getApiKey: (provider: LLMProviderType) => Promise<string>;
  retrieveKnowledge?: (query: RuntimeKnowledgeQuery) => Promise<RuntimeKnowledgeQueryResult>;
  ingestKnowledge?: (
    input: RuntimeKnowledgeIngestionRequest
  ) => Promise<RuntimeKnowledgeIngestionResult>;
  onRetrievalEvent?: (event: RuntimeKnowledgeRetrievalEvent) => Promise<void>;
  initialContext?: Partial<ExecutionContextState>;
  onStepStart?: (nodeId: string, nodeType: string) => Promise<void>;
  onStepComplete?: (step: ExecutionStepResult) => Promise<void>;
  onContextUpdate?: (update: ExecutionContextUpdate) => Promise<void>;
}

export async function executeWorkflow(
  params: EngineExecutionParams
): Promise<ExecutionResult> {
  const {
    executionId,
    workflowId,
    userId,
    nodes,
    edges,
    triggerPayload,
    getApiKey,
    retrieveKnowledge,
    ingestKnowledge,
    onRetrievalEvent,
    initialContext,
    onStepStart,
    onStepComplete,
    onContextUpdate,
  } = params;

  const correlationId = createCorrelationId();
  const logger = createExecutionLogger(executionId, workflowId, correlationId);
  const engineTimer = startTimer();

  logger.info({ nodeCount: nodes.length, edgeCount: edges.length }, "Workflow execution started");

  const steps: ExecutionStepResult[] = [];
  const executionContext = createInitialExecutionContext(initialContext);
  let finalStatus: ExecutionStatus = "completed";
  let errorMessage: string | null = null;

  const emitContextUpdate = async (
    update: Omit<ExecutionContextUpdate, "state">
  ): Promise<void> => {
    if (!onContextUpdate) return;
    try {
      await onContextUpdate({
        ...update,
        state: cloneExecutionContext(executionContext),
      });
    } catch (err) {
      logger.warn(
        {
          error: sanitizeErrorMessage(err),
          reason: update.reason,
          nodeId: update.nodeId,
          stepIndex: update.stepIndex,
        },
        "Execution context update hook failed"
      );
    }
  };

  await emitContextUpdate({
    reason: "init",
    nodeId: null,
    nodeType: null,
    stepIndex: 0,
  });

  try {
    // 1. Validate DAG
    const dagResult = validateDAG(nodes, edges);
    if (!dagResult.valid) {
      throw new Error(`Invalid workflow DAG: ${dagResult.errors.join("; ")}`);
    }

    logger.info({ executionOrder: dagResult.executionOrder }, "DAG validated");

    // 2. Build node map for lookup
    const nodeMap = new Map(nodes.map((n) => [n.id, n]));

    // 3. Build parent output map — stores output of each executed node
    const outputMap = new Map<string, NodeOutput>();

    const appendSkippedSteps = async (fromNodeId: string, reason: string): Promise<void> => {
      const remainingIndex = dagResult.executionOrder.indexOf(fromNodeId) + 1;
      for (let i = remainingIndex; i < dagResult.executionOrder.length; i++) {
        const skippedId = dagResult.executionOrder[i]!;
        const skippedNode = nodeMap.get(skippedId);
        const skippedStep: ExecutionStepResult = {
          nodeId: skippedId,
          nodeType: skippedNode?.type ?? "unknown",
          status: "skipped",
          input: {},
          output: null,
          durationMs: 0,
          error: reason,
        };
        steps.push(skippedStep);
        await onStepComplete?.(skippedStep);
        applyExecutionContextPatch(executionContext, {
          runtime: {
            lastCompletedNodeId: skippedId,
          },
        });
        await emitContextUpdate({
          reason: "step",
          nodeId: skippedId,
          nodeType: skippedNode?.type ?? "unknown",
          stepIndex: steps.length,
        });
      }
    };

    const executionWaves = buildExecutionWaves(dagResult.executionOrder, edges);
    logger.info(
      {
        waveCount: executionWaves.length,
        parallelCandidateWaves: executionWaves.filter((wave) => wave.length > 1).length,
      },
      "Execution waves planned"
    );
    applyExecutionContextPatch(executionContext, {
      knowledge: {
        "scheduler.waves": executionWaves.map((wave, index) => ({
          index: index + 1,
          nodes: wave,
          parallelCandidate: wave.length > 1,
        })),
      },
    });

    // 4. Execute nodes in wave order (wave semantics preserve topological guarantees)
    waveLoop: for (let waveIndex = 0; waveIndex < executionWaves.length; waveIndex++) {
      const waveNodeIds = executionWaves[waveIndex]!;
      applyExecutionContextPatch(executionContext, {
        memory: {
          "scheduler.currentWave": {
            index: waveIndex + 1,
            total: executionWaves.length,
            nodes: waveNodeIds,
          },
        },
      });

      for (const nodeId of waveNodeIds) {
      const node = nodeMap.get(nodeId);
      if (!node) {
        throw new Error(`Node "${nodeId}" not found in workflow`);
      }

      const stepTimer = startTimer();
      let stepStatus: StepStatus = "running";
      let stepInput: Record<string, unknown> = {};
      let stepOutput: Record<string, unknown> | null = null;
      let stepError: string | null = null;
      let stepAttempts: NodeExecutionAttemptSummary[] = [];

      applyExecutionContextPatch(executionContext, {
        runtime: { activeNodeId: nodeId },
      });

      await onStepStart?.(nodeId, node.type);

      try {
        // Resolve node implementation from registry
        const nodeImpl = resolveNode(node.type);

        // Validate node config
        const validation = nodeImpl.validate(node.config);
        if (!validation.valid) {
          throw new Error(
            `Node "${nodeId}" (${node.type}) validation failed: ${validation.errors.join("; ")}`
          );
        }

        // Build input — merge trigger payload + parent outputs
        const parentResolution = resolveParentOutputs(nodeId, edges, outputMap);
        if (parentResolution.skipNode) {
          stepStatus = "skipped";
          stepError = parentResolution.reason;
          logger.info(
            { nodeId, nodeType: node.type, reason: parentResolution.reason },
            "Node skipped due to unsatisfied branch conditions"
          );
          const skippedStep: ExecutionStepResult = {
            nodeId,
            nodeType: node.type,
            status: "skipped",
            input: {},
            output: null,
            durationMs: measureDuration(stepTimer),
            error: stepError,
          };

          steps.push(skippedStep);
          await onStepComplete?.(skippedStep);
          applyExecutionContextPatch(executionContext, {
            runtime: {
              activeNodeId: null,
              lastCompletedNodeId: nodeId,
            },
          });
          await emitContextUpdate({
            reason: "step",
            nodeId,
            nodeType: node.type,
            stepIndex: steps.length,
          });
          continue;
        }
        const parentOutputs = parentResolution.merged;
        let nodeInputData: Record<string, unknown> = {
          ...triggerPayload,
          ...parentOutputs,
        };
        let retrievalResult: RuntimeKnowledgeQueryResult | null = null;
        const retrievalConfig = getNodeRetrievalConfig(node.config);

        if (retrieveKnowledge && retrievalConfig?.enabled) {
          retrievalResult = await runNodeRetrieval({
            retrieveKnowledge,
            onRetrievalEvent,
            executionContext,
            config: retrievalConfig,
            inputData: nodeInputData,
            executionId,
            workflowId,
            userId,
            nodeId,
            nodeType: node.type,
          });

          if (retrievalResult) {
            nodeInputData = injectRetrievalContext(
              nodeInputData,
              retrievalResult,
              retrievalConfig.injectAs
            );

            applyExecutionContextPatch(executionContext, {
              knowledge: {
                [`retrieval.${nodeId}`]: {
                  query: retrievalResult.query,
                  topK: retrievalResult.topK,
                  matches: retrievalResult.matches.map((match) => ({
                    chunkId: match.chunkId,
                    score: match.score,
                    corpusId: match.corpusId,
                    documentId: match.documentId,
                  })),
                  orchestration: retrievalResult.orchestration,
                  capturedAt: new Date().toISOString(),
                },
              },
            });
          }
        }

        const nodeInput: NodeInput = {
          data: nodeInputData,
          metadata: {
            nodeConfig: node.config,
            executionId,
            workflowId,
            retrieval: retrievalResult
              ? {
                  query: retrievalResult.query,
                  topK: retrievalResult.topK,
                  matchesCount: retrievalResult.matches.length,
                }
              : undefined,
          },
        };
        stepInput = { ...nodeInput.data };

        // Build execution context
        const nodeLogger: NodeLogger = {
          info: (msg: string, data?: Record<string, unknown>) => logger.info({ nodeId, nodeType: node.type, ...data }, msg),
          warn: (msg: string, data?: Record<string, unknown>) => logger.warn({ nodeId, nodeType: node.type, ...data }, msg),
          error: (msg: string, data?: Record<string, unknown>) => logger.error({ nodeId, nodeType: node.type, ...data }, msg),
          debug: (msg: string, data?: Record<string, unknown>) => logger.debug({ nodeId, nodeType: node.type, ...data }, msg),
        };

        const context: NodeExecutionContext = {
          executionId,
          workflowId,
          userId,
          correlationId,
          nodeId,
          logger: nodeLogger,
          getApiKey,
          getExecutionContext: () => cloneExecutionContext(executionContext),
          updateExecutionContext: (patch: ExecutionContextPatch) => {
            applyExecutionContextPatch(executionContext, patch);
          },
          getMemory: <T = unknown>(key: string): T | undefined =>
            executionContext.memory[key] as T | undefined,
          setMemory: (key: string, value: unknown) => {
            applyExecutionContextPatch(executionContext, { memory: { [key]: value } });
          },
          retrieveKnowledge: retrieveKnowledge
            ? async (
                queryInput: RuntimeKnowledgeNodeQueryInput
              ): Promise<RuntimeKnowledgeQueryResult> => {
                const limitViolation = getRetrievalBudgetExceededReason(
                  executionContext.retrieval
                );
                if (limitViolation) {
                  throw new Error(`Retrieval limit reached before request: ${limitViolation}`);
                }

                const startedAt = Date.now();
                let status: "success" | "empty" | "failed" = "failed";
                let matchesCount = 0;
                let errorMessage: string | null = null;
                const topK = Math.max(1, Math.min(Math.floor(queryInput.topK), 50));
                const queryText = queryInput.query;
                try {
                  const result = await retrieveKnowledge({
                    executionId,
                    workflowId,
                    userId,
                    nodeId,
                    nodeType: node.type,
                    query: queryText,
                    topK,
                    corpusId: queryInput.corpusId,
                    scopeType: queryInput.scopeType,
                    workflowIdScope:
                      queryInput.scopeType === "workflow"
                        ? (queryInput.workflowIdScope ?? workflowId)
                        : queryInput.workflowIdScope,
                    executionIdScope:
                      queryInput.scopeType === "execution"
                        ? (queryInput.executionIdScope ?? executionId)
                        : queryInput.executionIdScope,
                    retrieverKey: queryInput.retrieverKey,
                    retrievalStrategy: queryInput.retrievalStrategy,
                    branchIndex: queryInput.branchIndex,
                  });
                  matchesCount = result.matches.length;
                  status = matchesCount > 0 ? "success" : "empty";
                  return result;
                } catch (err) {
                  errorMessage = sanitizeErrorMessage(err);
                  status = "failed";
                  throw err;
                } finally {
                  const durationMs = Math.max(0, Date.now() - startedAt);
                  recordRetrievalAttempt(executionContext, durationMs, status);
                  await emitRetrievalEventSafe(onRetrievalEvent, {
                    executionId,
                    workflowId,
                    userId,
                    nodeId,
                    nodeType: node.type,
                    query: queryText,
                    topK,
                    attempt: 1,
                    maxAttempts: 1,
                    durationMs,
                    matchesCount,
                    status,
                    errorMessage,
                    scopeType: queryInput.scopeType,
                    corpusId: queryInput.corpusId,
                    workflowIdScope: queryInput.workflowIdScope,
                    executionIdScope: queryInput.executionIdScope,
                    retrieverKey: queryInput.retrieverKey,
                    strategy: queryInput.retrievalStrategy,
                    branchIndex: queryInput.branchIndex,
                    selected: true,
                  });
                }
              }
            : undefined,
          ingestKnowledge: ingestKnowledge
            ? async (
                ingestionInput: RuntimeKnowledgeNodeIngestionInput
              ): Promise<RuntimeKnowledgeIngestionResult> => {
                const scopeType = ingestionInput.scopeType;
                return await ingestKnowledge({
                  executionId,
                  workflowId,
                  userId,
                  nodeId,
                  nodeType: node.type,
                  title: ingestionInput.title,
                  contentText: ingestionInput.contentText,
                  sourceType: ingestionInput.sourceType,
                  corpusId: ingestionInput.corpusId,
                  scopeType,
                  workflowIdScope:
                    scopeType === "workflow"
                      ? (ingestionInput.workflowIdScope ?? workflowId)
                      : ingestionInput.workflowIdScope,
                  executionIdScope:
                    scopeType === "execution"
                      ? (ingestionInput.executionIdScope ?? executionId)
                      : ingestionInput.executionIdScope,
                  metadata: ingestionInput.metadata,
                });
              }
            : undefined,
        };

        const retryPolicy = getNodeRetryPolicy(node.config);
        const attempts: NodeExecutionAttemptSummary[] = [];
        let attempt = 0;
        let finalOutput: NodeOutput | null = null;

        while (attempt < retryPolicy.maxAttempts) {
          attempt += 1;
          const attemptTimer = startTimer();

          try {
            const output = await nodeImpl.execute(nodeInput, context);
            const contextPatch = extractContextPatch(output);
            if (contextPatch) {
              applyExecutionContextPatch(executionContext, contextPatch);
            }

            const retryDirective = extractNodeRetryDirective(output);
            const retryReason = retryDirective?.reason ?? "Node requested retry";
            const retryDelayMs = retryDirective?.delayMs ?? retryPolicy.delayMs;
            const canRetryFromDirective =
              retryPolicy.enabled &&
              retryPolicy.retryOnDirective &&
              retryDirective?.requested === true &&
              attempt < retryPolicy.maxAttempts;

            if (canRetryFromDirective) {
              const limitViolation = registerNodeRetry(executionContext, retryPolicy.incrementLoopOnRetry);
              attempts.push({
                attempt,
                status: "retry",
                durationMs: measureDuration(attemptTimer),
                reason: retryReason,
              });
              stepAttempts = attempts;

              if (limitViolation) {
                throw new Error(limitViolation);
              }

              logger.warn(
                {
                  nodeId,
                  nodeType: node.type,
                  attempt,
                  maxAttempts: retryPolicy.maxAttempts,
                  reason: retryReason,
                },
                "Node execution requested retry"
              );

              if (retryDelayMs > 0) {
                await sleep(retryDelayMs);
              }
              continue;
            }

            if (
              retryDirective?.requested === true &&
              retryPolicy.enabled &&
              retryPolicy.retryOnDirective &&
              attempt >= retryPolicy.maxAttempts &&
              retryPolicy.failOnMaxAttempts
            ) {
              stepAttempts = attempts;
              throw new Error(
                `Node retry attempts exhausted (${attempt}/${retryPolicy.maxAttempts}): ${retryReason}`
              );
            }

            attempts.push({
              attempt,
              status: "completed",
              durationMs: measureDuration(attemptTimer),
              reason: null,
            });
            stepAttempts = attempts;

            finalOutput = output;
            break;
          } catch (attemptErr) {
            const attemptError = sanitizeErrorMessage(attemptErr);
            const canRetryFromError =
              retryPolicy.enabled &&
              retryPolicy.retryOnError &&
              attempt < retryPolicy.maxAttempts;

            attempts.push({
              attempt,
              status: "failed",
              durationMs: measureDuration(attemptTimer),
              reason: attemptError,
            });
            stepAttempts = attempts;

            if (canRetryFromError) {
              const limitViolation = registerNodeRetry(executionContext, false);
              if (limitViolation) {
                throw new Error(limitViolation);
              }

              logger.warn(
                {
                  nodeId,
                  nodeType: node.type,
                  attempt,
                  maxAttempts: retryPolicy.maxAttempts,
                  error: attemptError,
                },
                "Node execution failed; retrying"
              );

              if (retryPolicy.delayMs > 0) {
                await sleep(retryPolicy.delayMs);
              }
              continue;
            }

            throw attemptErr;
          }
        }

        stepAttempts = attempts;

        if (!finalOutput) {
          throw new Error(`Node "${nodeId}" (${node.type}) produced no output`);
        }

        outputMap.set(nodeId, finalOutput);

        stepStatus = "completed";
        stepOutput = attachAttemptMetadata(finalOutput.data, attempts);
        persistNodeRetryOutcome(executionContext, nodeId, {
          status: deriveRetryOutcomeStatus("completed", attempts),
          attemptCount: attempts.length,
          updatedAt: new Date().toISOString(),
        });

        logger.info({ nodeId, nodeType: node.type, durationMs: measureDuration(stepTimer) }, "Node executed successfully");
      } catch (err) {
        stepStatus = "failed";
        stepError = sanitizeErrorMessage(err);
        finalStatus = "failed";
        errorMessage = `Node "${nodeId}" (${node.type}) failed: ${stepError}`;
        applyExecutionContextPatch(executionContext, {
          control: {
            terminate: true,
            retryCount: executionContext.control.retryCount + 1,
          },
        });
        persistNodeRetryOutcome(executionContext, nodeId, {
          status: deriveRetryOutcomeStatus("failed", stepAttempts),
          attemptCount: stepAttempts.length,
          error: stepError,
          updatedAt: new Date().toISOString(),
        });
        if (stepAttempts.length > 0) {
          stepOutput = {
            _attempts: stepAttempts,
            _attemptCount: stepAttempts.length,
            _retryOutcome: {
              status: deriveRetryOutcomeStatus("failed", stepAttempts),
              attemptCount: stepAttempts.length,
              error: stepError,
            },
          };
        }

        logger.error({ nodeId, nodeType: node.type, error: stepError, durationMs: measureDuration(stepTimer) }, "Node execution failed");
      }

      const stepResult: ExecutionStepResult = {
        nodeId,
        nodeType: node.type,
        status: stepStatus,
        input: stepInput,
        output: stepOutput,
        durationMs: measureDuration(stepTimer),
        error: stepError,
      };

      steps.push(stepResult);
      await onStepComplete?.(stepResult);
      applyExecutionContextPatch(executionContext, {
        runtime: {
          activeNodeId: null,
          lastCompletedNodeId: nodeId,
        },
      });
      await emitContextUpdate({
        reason: "step",
        nodeId,
        nodeType: node.type,
        stepIndex: steps.length,
      });

      if (stepStatus === "completed") {
        const controlLimitViolation = getControlLimitViolation(executionContext.control);
        if (controlLimitViolation) {
          finalStatus = "failed";
          errorMessage = controlLimitViolation;
          applyExecutionContextPatch(executionContext, {
            control: { terminate: true },
          });
          setExecutionOutcome(executionContext, {
            status: "terminated_by_control",
            reason: controlLimitViolation,
            updatedAt: new Date().toISOString(),
          });

          logger.error(
            { nodeId, nodeType: node.type, control: executionContext.control },
            "Execution halted due to control limit violation"
          );

          await appendSkippedSteps(nodeId, "Skipped due to execution control limits");
          break waveLoop;
        }

        if (executionContext.control.terminate) {
          const terminateReason = executionContext.memory["control.terminateReason"];
          setExecutionOutcome(executionContext, {
            status: "terminated_by_control",
            reason:
              typeof terminateReason === "string" && terminateReason.trim().length > 0
                ? terminateReason
                : "Execution control requested termination",
            updatedAt: new Date().toISOString(),
          });
          logger.info(
            {
              nodeId,
              nodeType: node.type,
              reason:
                typeof terminateReason === "string" && terminateReason.trim().length > 0
                  ? terminateReason
                  : undefined,
            },
            "Execution terminated by control state"
          );

          await appendSkippedSteps(
            nodeId,
            "Skipped due to execution termination request"
          );
          break waveLoop;
        }
      }

      // Stop execution on failure (sequential mode)
      if (stepStatus === "failed") {
        await appendSkippedSteps(nodeId, "Skipped due to previous node failure");
        break waveLoop;
      }
    }
    }
  } catch (err) {
    finalStatus = "failed";
    errorMessage = sanitizeErrorMessage(err);
    applyExecutionContextPatch(executionContext, {
      control: { terminate: true },
      runtime: { activeNodeId: null },
    });
    logger.error({ error: errorMessage }, "Workflow execution failed");
  }

  const totalDurationMs = measureDuration(engineTimer);

  logger.info({
    status: finalStatus,
    totalDurationMs,
    stepsCompleted: steps.filter((s) => s.status === "completed").length,
    stepsFailed: steps.filter((s) => s.status === "failed").length,
    stepsSkipped: steps.filter((s) => s.status === "skipped").length,
  }, "Workflow execution finished");

  await emitContextUpdate({
    reason: finalStatus === "failed" ? "error" : "final",
    nodeId: executionContext.runtime.lastCompletedNodeId,
    nodeType: null,
    stepIndex: steps.length,
  });

  return {
    executionId,
    status: finalStatus,
    steps,
    totalDurationMs,
    errorMessage,
    context: cloneExecutionContext(executionContext),
  };
}

interface ParentOutputResolution {
  merged: Record<string, unknown>;
  skipNode: boolean;
  reason: string | null;
}

function buildExecutionWaves(
  executionOrder: string[],
  edges: WorkflowEdge[]
): string[][] {
  if (executionOrder.length === 0) return [];

  const parentsByNode = new Map<string, string[]>();
  for (const nodeId of executionOrder) {
    parentsByNode.set(nodeId, []);
  }
  for (const edge of edges) {
    if (!parentsByNode.has(edge.target)) continue;
    const list = parentsByNode.get(edge.target)!;
    list.push(edge.source);
  }

  const levelByNode = new Map<string, number>();
  for (const nodeId of executionOrder) {
    const parents = parentsByNode.get(nodeId) ?? [];
    let level = 0;
    for (const parentId of parents) {
      const parentLevel = levelByNode.get(parentId) ?? 0;
      level = Math.max(level, parentLevel + 1);
    }
    levelByNode.set(nodeId, level);
  }

  const wavesByLevel = new Map<number, string[]>();
  for (const nodeId of executionOrder) {
    const level = levelByNode.get(nodeId) ?? 0;
    const wave = wavesByLevel.get(level) ?? [];
    wave.push(nodeId);
    wavesByLevel.set(level, wave);
  }

  return Array.from(wavesByLevel.entries())
    .sort((a, b) => a[0] - b[0])
    .map((entry) => entry[1]);
}

function resolveParentOutputs(
  nodeId: string,
  edges: WorkflowEdge[],
  outputMap: Map<string, NodeOutput>
): ParentOutputResolution {
  const parentEdges = edges.filter((e) => e.target === nodeId);
  const merged: Record<string, unknown> = {};
  let matchedParents = 0;

  for (const edge of parentEdges) {
    const parentOutput = outputMap.get(edge.source);
    if (parentOutput && edgeConditionMatches(edge, parentOutput.data)) {
      Object.assign(merged, parentOutput.data);
      matchedParents += 1;
    }
  }

  if (parentEdges.length > 0 && matchedParents === 0) {
    return {
      merged,
      skipNode: true,
      reason: "No parent branch satisfied edge conditions",
    };
  }

  return {
    merged,
    skipNode: false,
    reason: null,
  };
}

function edgeConditionMatches(
  edge: WorkflowEdge,
  parentOutput: Record<string, unknown>
): boolean {
  const rawCondition = (edge as unknown as Record<string, unknown>)["condition"];
  if (rawCondition === undefined || rawCondition === null) {
    return true;
  }

  if (typeof rawCondition === "boolean") {
    return evaluateEdgeBooleanCondition(rawCondition, parentOutput);
  }

  if (typeof rawCondition !== "string") {
    return true;
  }

  const condition = rawCondition.trim().toLowerCase();
  if (condition.length === 0 || condition === "always" || condition === "any") {
    return true;
  }

  if (condition === "true") {
    return evaluateEdgeBooleanCondition(true, parentOutput);
  }
  if (condition === "false") {
    return evaluateEdgeBooleanCondition(false, parentOutput);
  }
  if (condition === "pass") {
    const passed = readBooleanPath(parentOutput, "_evaluation.passed");
    return passed === true;
  }
  if (condition === "fail") {
    const passed = readBooleanPath(parentOutput, "_evaluation.passed");
    return passed === false;
  }

  const routeCandidate = readStringPath(parentOutput, "_route")
    ?? readStringPath(parentOutput, "_branch.route")
    ?? readStringPath(parentOutput, "route");
  if (!routeCandidate) {
    return false;
  }
  return routeCandidate.toLowerCase() === condition;
}

function evaluateEdgeBooleanCondition(
  expected: boolean,
  parentOutput: Record<string, unknown>
): boolean {
  const conditionResult = readBooleanPath(parentOutput, "_condition.result");
  if (conditionResult !== undefined) {
    return conditionResult === expected;
  }

  const evaluationPassed = readBooleanPath(parentOutput, "_evaluation.passed");
  if (evaluationPassed !== undefined) {
    return evaluationPassed === expected;
  }

  const directBool = readBooleanPath(parentOutput, "result");
  if (directBool !== undefined) {
    return directBool === expected;
  }

  return false;
}

function readBooleanPath(
  source: Record<string, unknown>,
  path: string
): boolean | undefined {
  const value = readPathValue(source, path);
  return typeof value === "boolean" ? value : undefined;
}

function readStringPath(
  source: Record<string, unknown>,
  path: string
): string | undefined {
  const value = readPathValue(source, path);
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function readPathValue(
  source: Record<string, unknown>,
  path: string
): unknown {
  const parts = path.split(".");
  let current: unknown = source;
  for (const part of parts) {
    if (!isRecord(current)) {
      return undefined;
    }
    current = current[part];
  }
  return current;
}

function createInitialExecutionContext(
  initialContext?: Partial<ExecutionContextState>
): ExecutionContextState {
  const now = new Date().toISOString();

  return {
    version: initialContext?.version ?? 1,
    memory: isRecord(initialContext?.memory) ? { ...initialContext.memory } : {},
    knowledge: isRecord(initialContext?.knowledge) ? { ...initialContext.knowledge } : {},
    control: {
      loopCount: initialContext?.control?.loopCount ?? 0,
      retryCount: initialContext?.control?.retryCount ?? 0,
      maxLoops: initialContext?.control?.maxLoops ?? 20,
      maxRetries: initialContext?.control?.maxRetries ?? 3,
      terminate: initialContext?.control?.terminate ?? false,
    },
    retrieval: {
      totalRequests: coerceNonNegativeInt(initialContext?.retrieval?.totalRequests, 0),
      totalSuccesses: coerceNonNegativeInt(initialContext?.retrieval?.totalSuccesses, 0),
      totalEmpties: coerceNonNegativeInt(initialContext?.retrieval?.totalEmpties, 0),
      totalFailures: coerceNonNegativeInt(initialContext?.retrieval?.totalFailures, 0),
      totalDurationMs: coerceNonNegativeInt(initialContext?.retrieval?.totalDurationMs, 0),
      maxRequests: coerceNonNegativeInt(initialContext?.retrieval?.maxRequests, 64, 1),
      maxFailures: coerceNonNegativeInt(initialContext?.retrieval?.maxFailures, 32, 1),
      maxDurationMs: coerceNonNegativeInt(initialContext?.retrieval?.maxDurationMs, 120_000, 1_000),
    },
    runtime: {
      startedAt: initialContext?.runtime?.startedAt ?? now,
      updatedAt: initialContext?.runtime?.updatedAt ?? now,
      activeNodeId: initialContext?.runtime?.activeNodeId ?? null,
      lastCompletedNodeId: initialContext?.runtime?.lastCompletedNodeId ?? null,
    },
  };
}

function applyExecutionContextPatch(
  state: ExecutionContextState,
  patch: ExecutionContextPatch
): void {
  if (isRecord(patch.memory)) {
    state.memory = { ...state.memory, ...patch.memory };
  }

  if (isRecord(patch.knowledge)) {
    state.knowledge = { ...state.knowledge, ...patch.knowledge };
  }

  if (patch.control) {
    state.control = { ...state.control, ...patch.control };
  }

  if (patch.retrieval) {
    state.retrieval = { ...state.retrieval, ...patch.retrieval };
  }

  if (patch.runtime) {
    state.runtime = { ...state.runtime, ...patch.runtime };
  }

  state.version += 1;
  state.runtime.updatedAt = new Date().toISOString();
}

function extractContextPatch(output: NodeOutput): ExecutionContextPatch | null {
  if (!isRecord(output.metadata)) return null;
  const maybePatch = output.metadata["contextPatch"];
  if (!isRecord(maybePatch)) return null;

  const patch: ExecutionContextPatch = {};

  if (isRecord(maybePatch["memory"])) {
    patch.memory = maybePatch["memory"];
  }

  if (isRecord(maybePatch["knowledge"])) {
    patch.knowledge = maybePatch["knowledge"];
  }

  if (isRecord(maybePatch["control"])) {
    patch.control = maybePatch["control"] as ExecutionContextPatch["control"];
  }

  if (isRecord(maybePatch["retrieval"])) {
    patch.retrieval = maybePatch["retrieval"] as ExecutionContextPatch["retrieval"];
  }

  if (isRecord(maybePatch["runtime"])) {
    patch.runtime = maybePatch["runtime"] as ExecutionContextPatch["runtime"];
  }

  if (!patch.memory && !patch.knowledge && !patch.control && !patch.retrieval && !patch.runtime) {
    return null;
  }

  return patch;
}

function cloneExecutionContext(state: ExecutionContextState): ExecutionContextState {
  return {
    version: state.version,
    memory: { ...state.memory },
    knowledge: { ...state.knowledge },
    control: { ...state.control },
    retrieval: { ...state.retrieval },
    runtime: { ...state.runtime },
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function coerceNonNegativeInt(
  value: unknown,
  fallback: number,
  min = 0
): number {
  if (typeof value === "number" && Number.isInteger(value) && value >= min) {
    return value;
  }
  return fallback;
}

function getControlLimitViolation(control: ExecutionContextState["control"]): string | null {
  if (control.retryCount > control.maxRetries) {
    return `Execution retry limit exceeded (${control.retryCount}/${control.maxRetries})`;
  }
  if (control.loopCount > control.maxLoops) {
    return `Execution loop limit exceeded (${control.loopCount}/${control.maxLoops})`;
  }
  return null;
}

interface NodeRetryPolicy {
  enabled: boolean;
  maxAttempts: number;
  delayMs: number;
  retryOnError: boolean;
  retryOnDirective: boolean;
  failOnMaxAttempts: boolean;
  incrementLoopOnRetry: boolean;
}

interface NodeExecutionAttemptSummary {
  attempt: number;
  status: "completed" | "retry" | "failed";
  durationMs: number;
  reason: string | null;
}

interface NodeRetryDirective {
  requested: boolean;
  reason?: string;
  delayMs?: number;
}

function getNodeRetryPolicy(nodeConfig: Record<string, unknown>): NodeRetryPolicy {
  const raw = nodeConfig["retryPolicy"];
  const asRecord = isRecord(raw) ? raw : {};

  const enabled = parseBooleanLike(
    asRecord["enabled"] ?? nodeConfig["retryEnabled"],
    false
  );
  const maxAttempts = clampInt(
    asRecord["maxAttempts"] ?? nodeConfig["retryMaxAttempts"],
    1,
    10,
    enabled ? 3 : 1
  );
  const delayMs = clampInt(
    asRecord["delayMs"] ?? nodeConfig["retryDelayMs"],
    0,
    10_000,
    0
  );

  return {
    enabled,
    maxAttempts,
    delayMs,
    retryOnError: parseBooleanLike(asRecord["retryOnError"], true),
    retryOnDirective: parseBooleanLike(asRecord["retryOnDirective"], true),
    failOnMaxAttempts: parseBooleanLike(asRecord["failOnMaxAttempts"], true),
    incrementLoopOnRetry: parseBooleanLike(asRecord["incrementLoopOnRetry"], true),
  };
}

function extractNodeRetryDirective(output: NodeOutput): NodeRetryDirective | null {
  if (!isRecord(output.metadata)) return null;

  const metadata = output.metadata;
  const rawRetry = metadata["retry"];
  if (typeof rawRetry === "boolean") {
    return { requested: rawRetry };
  }
  if (isRecord(rawRetry)) {
    return {
      requested: parseBooleanLike(rawRetry["requested"], true),
      reason: typeof rawRetry["reason"] === "string" ? rawRetry["reason"] : undefined,
      delayMs:
        typeof rawRetry["delayMs"] === "number" && Number.isFinite(rawRetry["delayMs"])
          ? clampInt(rawRetry["delayMs"], 0, 10_000, 0)
          : undefined,
    };
  }

  if (typeof metadata["shouldRetry"] === "boolean") {
    return {
      requested: metadata["shouldRetry"],
      reason: typeof metadata["retryReason"] === "string" ? metadata["retryReason"] : undefined,
    };
  }

  return null;
}

function registerNodeRetry(
  executionContext: ExecutionContextState,
  incrementLoopCount: boolean
): string | null {
  applyExecutionContextPatch(executionContext, {
    control: {
      retryCount: executionContext.control.retryCount + 1,
      loopCount: executionContext.control.loopCount + (incrementLoopCount ? 1 : 0),
    },
  });

  return getControlLimitViolation(executionContext.control);
}

interface RetryOutcomePayload {
  status:
    | "no_retry"
    | "retry_succeeded_after_n"
    | "retry_exhausted"
    | "failed_without_retry";
  attemptCount: number;
  error?: string | null;
  updatedAt: string;
}

function deriveRetryOutcomeStatus(
  stepStatus: "completed" | "failed",
  attempts: NodeExecutionAttemptSummary[]
): RetryOutcomePayload["status"] {
  const attemptedRetries = attempts.some((attempt) => attempt.status === "retry");
  if (stepStatus === "completed") {
    return attemptedRetries || attempts.length > 1
      ? "retry_succeeded_after_n"
      : "no_retry";
  }

  return attemptedRetries || attempts.length > 1
    ? "retry_exhausted"
    : "failed_without_retry";
}

function persistNodeRetryOutcome(
  executionContext: ExecutionContextState,
  nodeId: string,
  payload: RetryOutcomePayload
): void {
  applyExecutionContextPatch(executionContext, {
    memory: {
      [`retry.outcome.${nodeId}`]: payload,
      "retry.lastOutcome": {
        nodeId,
        ...payload,
      },
    },
  });
}

function setExecutionOutcome(
  executionContext: ExecutionContextState,
  payload: {
    status: "terminated_by_control";
    reason: string;
    updatedAt: string;
  }
): void {
  applyExecutionContextPatch(executionContext, {
    memory: {
      "execution.outcome": payload,
    },
  });
}

function attachAttemptMetadata(
  data: Record<string, unknown>,
  attempts: NodeExecutionAttemptSummary[]
): Record<string, unknown> {
  const status = deriveRetryOutcomeStatus("completed", attempts);

  return {
    ...data,
    _attempts: attempts,
    _attemptCount: attempts.length,
    _retryOutcome: {
      status,
      attemptCount: attempts.length,
    },
  };
}

function clampInt(value: unknown, min: number, max: number, fallback: number): number {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return fallback;
  }
  return Math.max(min, Math.min(max, Math.floor(value)));
}

function parseBooleanLike(value: unknown, fallback: boolean): boolean {
  if (typeof value === "boolean") return value;
  if (typeof value === "string") {
    if (value.toLowerCase() === "true") return true;
    if (value.toLowerCase() === "false") return false;
  }
  return fallback;
}

interface RetrievalScopeConfig {
  corpusId?: string;
  scopeType?: KnowledgeScopeType;
  workflowId?: string;
  executionId?: string;
}

interface RetrievalQueryConfig extends RetrievalScopeConfig {
  query?: string;
  queryTemplate?: string;
  fallbackQuery?: string;
  fallbackQueryTemplate?: string;
  queryMaxChars: number;
  topK: number;
  maxRetries: number;
  retryDelayMs: number;
  minMatches: number;
  minScore?: number;
  failOnError: boolean;
}

interface NodeRetrieverConfig extends RetrievalQueryConfig {
  key: string;
  enabled: boolean;
}

interface NodeRetrievalConfig extends RetrievalQueryConfig {
  enabled: boolean;
  injectAs: string;
  strategy: RuntimeKnowledgeRetrievalStrategy;
  speculative: boolean;
  preferredRetrieverMemoryKey?: string;
  retrievers: NodeRetrieverConfig[];
}

interface ResolvedRetrieverPlan {
  key: string;
  branchIndex: number;
  query: string;
  fallbackQuery: string | null;
  topK: number;
  maxRetries: number;
  retryDelayMs: number;
  minMatches: number;
  minScore?: number;
  failOnError: boolean;
  corpusId?: string;
  scope: {
    scopeType?: KnowledgeScopeType;
    workflowIdScope?: string;
    executionIdScope?: string;
  };
}

interface RetrieverPlanRunResult {
  plan: ResolvedRetrieverPlan;
  result: RuntimeKnowledgeQueryResult;
  satisfied: boolean;
  error: Error | null;
}

function getNodeRetrievalConfig(
  nodeConfig: Record<string, unknown>
): NodeRetrievalConfig | null {
  const raw = nodeConfig["retrieval"];
  if (!isRecord(raw)) return null;

  const base = parseRetrievalQueryConfig(raw, null);
  const retrievers = parseRetrieverConfigs(raw, base);
  const fallbackStrategy =
    retrievers.length > 1 ? "first-non-empty" : "single";

  return {
    enabled: raw["enabled"] !== false,
    injectAs:
      typeof raw["injectAs"] === "string" && raw["injectAs"].trim().length > 0
        ? raw["injectAs"]
        : "_knowledge",
    strategy: parseRetrievalStrategy(raw["strategy"], fallbackStrategy),
    speculative: parseBooleanLike(raw["speculative"], false),
    preferredRetrieverMemoryKey:
      typeof raw["preferredRetrieverMemoryKey"] === "string" &&
      raw["preferredRetrieverMemoryKey"].trim().length > 0
        ? raw["preferredRetrieverMemoryKey"].trim()
        : undefined,
    retrievers,
    ...base,
  };
}

function parseRetrieverConfigs(
  raw: Record<string, unknown>,
  base: RetrievalQueryConfig
): NodeRetrieverConfig[] {
  const parsed: NodeRetrieverConfig[] = [];
  const retrieversRaw = raw["retrievers"];
  if (Array.isArray(retrieversRaw)) {
    for (let idx = 0; idx < retrieversRaw.length; idx++) {
      const candidate = retrieversRaw[idx];
      if (!isRecord(candidate)) continue;

      const keyBase =
        typeof candidate["key"] === "string" && candidate["key"].trim().length > 0
          ? candidate["key"].trim()
          : `retriever_${idx + 1}`;

      parsed.push({
        key: keyBase,
        enabled: candidate["enabled"] !== false,
        ...parseRetrievalQueryConfig(candidate, base),
      });
    }
  }

  if (parsed.length === 0) {
    parsed.push({
      key: "primary",
      enabled: true,
      ...base,
    });
  }

  const dedup = new Map<string, number>();
  return parsed
    .filter((item) => item.enabled)
    .map((item) => {
      const seen = dedup.get(item.key) ?? 0;
      dedup.set(item.key, seen + 1);
      if (seen === 0) return item;
      return {
        ...item,
        key: `${item.key}_${seen + 1}`,
      };
    });
}

function parseRetrievalQueryConfig(
  raw: Record<string, unknown>,
  fallback: RetrievalQueryConfig | null
): RetrievalQueryConfig {
  const topKRaw = raw["topK"];
  const topK =
    typeof topKRaw === "number" && Number.isInteger(topKRaw) && topKRaw > 0
      ? Math.min(topKRaw, 50)
      : fallback?.topK ?? 8;
  const maxRetriesRaw = raw["maxRetries"];
  const maxRetries =
    typeof maxRetriesRaw === "number" &&
    Number.isInteger(maxRetriesRaw) &&
    maxRetriesRaw >= 0
      ? Math.min(maxRetriesRaw, 5)
      : fallback?.maxRetries ?? 0;
  const retryDelayMsRaw = raw["retryDelayMs"];
  const retryDelayMs =
    typeof retryDelayMsRaw === "number" && retryDelayMsRaw >= 0
      ? Math.min(Math.floor(retryDelayMsRaw), 10000)
      : fallback?.retryDelayMs ?? 0;
  const minMatchesRaw = raw["minMatches"];
  const minMatches =
    typeof minMatchesRaw === "number" &&
    Number.isInteger(minMatchesRaw) &&
    minMatchesRaw >= 0
      ? Math.min(minMatchesRaw, 50)
      : fallback?.minMatches ?? 1;
  const minScoreRaw = raw["minScore"];
  const minScore =
    typeof minScoreRaw === "number" && Number.isFinite(minScoreRaw)
      ? Math.max(-1, Math.min(1, minScoreRaw))
      : fallback?.minScore;
  const queryMaxCharsRaw = raw["queryMaxChars"];
  const queryMaxChars =
    typeof queryMaxCharsRaw === "number" &&
    Number.isInteger(queryMaxCharsRaw) &&
    queryMaxCharsRaw > 0
      ? Math.min(queryMaxCharsRaw, 10_000)
      : fallback?.queryMaxChars ?? 2_000;

  return {
    query:
      typeof raw["query"] === "string"
        ? raw["query"]
        : fallback?.query,
    queryTemplate:
      typeof raw["queryTemplate"] === "string"
        ? raw["queryTemplate"]
        : fallback?.queryTemplate,
    fallbackQuery:
      typeof raw["fallbackQuery"] === "string"
        ? raw["fallbackQuery"]
        : fallback?.fallbackQuery,
    fallbackQueryTemplate:
      typeof raw["fallbackQueryTemplate"] === "string"
        ? raw["fallbackQueryTemplate"]
        : fallback?.fallbackQueryTemplate,
    queryMaxChars,
    topK,
    maxRetries,
    retryDelayMs,
    minMatches,
    minScore,
    failOnError:
      typeof raw["failOnError"] === "boolean"
        ? raw["failOnError"]
        : fallback?.failOnError ?? true,
    corpusId:
      typeof raw["corpusId"] === "string" ? raw["corpusId"] : fallback?.corpusId,
    scopeType: parseScopeType(raw["scopeType"], fallback?.scopeType),
    workflowId:
      typeof raw["workflowId"] === "string"
        ? raw["workflowId"]
        : fallback?.workflowId,
    executionId:
      typeof raw["executionId"] === "string"
        ? raw["executionId"]
        : fallback?.executionId,
  };
}

function parseScopeType(
  value: unknown,
  fallback?: KnowledgeScopeType
): KnowledgeScopeType | undefined {
  if (value === "user" || value === "workflow" || value === "execution") {
    return value;
  }
  return fallback;
}

function parseRetrievalStrategy(
  value: unknown,
  fallback: RuntimeKnowledgeRetrievalStrategy
): RuntimeKnowledgeRetrievalStrategy {
  if (
    value === "single" ||
    value === "merge" ||
    value === "first-non-empty" ||
    value === "best-score" ||
    value === "adaptive"
  ) {
    return value;
  }
  return fallback;
}

function resolveRetrievalQuery(
  config: RetrievalQueryConfig,
  inputData: Record<string, unknown>
): string | null {
  return resolveQueryCandidate(
    config.queryTemplate,
    config.query,
    inputData,
    config.queryMaxChars
  );
}

function resolveFallbackRetrievalQuery(
  config: RetrievalQueryConfig,
  inputData: Record<string, unknown>
): string | null {
  return resolveQueryCandidate(
    config.fallbackQueryTemplate,
    config.fallbackQuery,
    inputData,
    config.queryMaxChars
  );
}

function resolveQueryCandidate(
  template: string | undefined,
  query: string | undefined,
  inputData: Record<string, unknown>,
  maxChars: number
): string | null {
  const clamp = (raw: string): string => raw.trim().slice(0, maxChars);
  if (template) {
    const rendered = clamp(interpolateTemplate(template, inputData));
    return rendered.length > 0 ? rendered : null;
  }
  if (query && query.trim().length > 0) {
    return clamp(query);
  }
  return null;
}

function injectRetrievalContext(
  inputData: Record<string, unknown>,
  retrievalResult: RuntimeKnowledgeQueryResult,
  injectAs: string
): Record<string, unknown> {
  const payload: Record<string, unknown> = {
    query: retrievalResult.query,
    topK: retrievalResult.topK,
    matches: retrievalResult.matches,
  };
  if (retrievalResult.orchestration) {
    payload["orchestration"] = retrievalResult.orchestration;
  }
  return {
    ...inputData,
    [injectAs]: payload,
  };
}

interface RunNodeRetrievalParams {
  retrieveKnowledge: (query: RuntimeKnowledgeQuery) => Promise<RuntimeKnowledgeQueryResult>;
  onRetrievalEvent?: (event: RuntimeKnowledgeRetrievalEvent) => Promise<void>;
  executionContext: ExecutionContextState;
  config: NodeRetrievalConfig;
  inputData: Record<string, unknown>;
  executionId: string;
  workflowId: string;
  userId: string;
  nodeId: string;
  nodeType: string;
}

async function runNodeRetrieval(
  params: RunNodeRetrievalParams
): Promise<RuntimeKnowledgeQueryResult | null> {
  const {
    retrieveKnowledge,
    onRetrievalEvent,
    executionContext,
    config,
    inputData,
    executionId,
    workflowId,
    userId,
    nodeId,
    nodeType,
  } = params;

  const plans = resolveRetrieverPlans(
    config,
    inputData,
    executionContext,
    workflowId,
    executionId
  );
  if (plans.length === 0) {
    throw new Error(
      `Node "${nodeId}" (${nodeType}) retrieval enabled but no retriever plan was resolved`
    );
  }

  const strategy = plans.length === 1 ? "single" : config.strategy;
  const orderedPlans =
    strategy === "adaptive"
      ? applyAdaptiveOrdering(plans, executionContext, config.preferredRetrieverMemoryKey)
      : plans;

  const runPlan = (plan: ResolvedRetrieverPlan): Promise<RetrieverPlanRunResult> =>
    runRetrieverPlan({
      retrieveKnowledge,
      onRetrievalEvent,
      executionContext,
      executionId,
      workflowId,
      userId,
      nodeId,
      nodeType,
      strategy,
      plan,
      softFail: strategy !== "single",
    });

  const collectAll = async (): Promise<RetrieverPlanRunResult[]> => {
    if (config.speculative) {
      return await Promise.all(orderedPlans.map((plan) => runPlan(plan)));
    }
    const sequential: RetrieverPlanRunResult[] = [];
    for (const plan of orderedPlans) {
      sequential.push(await runPlan(plan));
    }
    return sequential;
  };

  if (strategy === "single") {
    const only = await runPlan(orderedPlans[0]!);
    if (only.satisfied) {
      return withRetrievalOrchestration(only.result, {
        strategy,
        speculative: false,
        retrieversTried: [only.plan.key],
        selectedRetrieverKey: only.plan.key,
        branchCount: 1,
      });
    }
    if (only.error && config.failOnError) {
      throw only.error;
    }
    return withRetrievalOrchestration(only.result, {
      strategy,
      speculative: false,
      retrieversTried: [only.plan.key],
      selectedRetrieverKey: only.plan.key,
      branchCount: 1,
    });
  }

  if (strategy === "merge") {
    const all = await collectAll();
    const successful = all.filter((item) => item.result.matches.length > 0);
    const merged = mergeRetrieverMatches(all, config.topK);
    const mergedResult: RuntimeKnowledgeQueryResult = {
      query: all.map((item) => item.result.query).join(" || "),
      topK: config.topK,
      matches: merged,
    };

    const hasEnough = mergedResult.matches.length >= config.minMatches;
    const hardError = all.find((item) => item.error && item.plan.failOnError)?.error ?? null;
    if (!hasEnough && config.failOnError && (hardError || successful.length === 0)) {
      throw (
        hardError ??
        new Error(
          `Merged retrieval returned ${mergedResult.matches.length} matches, below required minMatches=${config.minMatches}`
        )
      );
    }

    return withRetrievalOrchestration(mergedResult, {
      strategy,
      speculative: config.speculative,
      retrieversTried: all.map((item) => item.plan.key),
      branchCount: orderedPlans.length,
    });
  }

  if (strategy === "best-score") {
    const all = await collectAll();
    const best = selectBestScoreResult(all);
    const hardError = all.find((item) => item.error && item.plan.failOnError)?.error ?? null;
    if (!best) {
      if (config.failOnError) {
        throw hardError ?? new Error("No retrieval result was available from configured retrievers");
      }
      return withRetrievalOrchestration(
        { query: orderedPlans[0]!.query, topK: config.topK, matches: [] },
        {
          strategy,
          speculative: config.speculative,
          retrieversTried: all.map((item) => item.plan.key),
          branchCount: orderedPlans.length,
        }
      );
    }

    if (!best.satisfied && config.failOnError) {
      throw (
        best.error ??
        new Error(
          `Best-score retrieval returned ${best.result.matches.length} matches, below required minMatches=${best.plan.minMatches}`
        )
      );
    }

    return withRetrievalOrchestration(best.result, {
      strategy,
      speculative: config.speculative,
      retrieversTried: all.map((item) => item.plan.key),
      selectedRetrieverKey: best.plan.key,
      branchCount: orderedPlans.length,
    });
  }

  // first-non-empty + adaptive
  if (config.speculative) {
    const all = await collectAll();
    const selected = all.find((item) => item.satisfied);
    if (selected) {
      return withRetrievalOrchestration(selected.result, {
        strategy,
        speculative: true,
        retrieversTried: all.map((item) => item.plan.key),
        selectedRetrieverKey: selected.plan.key,
        branchCount: orderedPlans.length,
      });
    }

    const hardError = all.find((item) => item.error && item.plan.failOnError)?.error ?? null;
    if (config.failOnError) {
      throw hardError ?? new Error("All speculative retrieval branches returned empty");
    }

    return withRetrievalOrchestration(all[0]?.result ?? { query: orderedPlans[0]!.query, topK: config.topK, matches: [] }, {
      strategy,
      speculative: true,
      retrieversTried: all.map((item) => item.plan.key),
      branchCount: orderedPlans.length,
    });
  }

  const triedKeys: string[] = [];
  let lastResult: RuntimeKnowledgeQueryResult | null = null;
  let lastError: Error | null = null;
  for (const plan of orderedPlans) {
    const attemptResult = await runPlan(plan);
    triedKeys.push(plan.key);
    lastResult = attemptResult.result;
    lastError = attemptResult.error;
    if (attemptResult.satisfied) {
      return withRetrievalOrchestration(attemptResult.result, {
        strategy,
        speculative: false,
        retrieversTried: triedKeys,
        selectedRetrieverKey: plan.key,
        branchCount: orderedPlans.length,
      });
    }
  }

  if (config.failOnError && lastError) {
    throw lastError;
  }

  return withRetrievalOrchestration(
    lastResult ?? { query: orderedPlans[0]!.query, topK: config.topK, matches: [] },
    {
      strategy,
      speculative: false,
      retrieversTried: triedKeys,
      branchCount: orderedPlans.length,
    }
  );
}

function withRetrievalOrchestration(
  result: RuntimeKnowledgeQueryResult,
  orchestration: RuntimeKnowledgeQueryResult["orchestration"]
): RuntimeKnowledgeQueryResult {
  return {
    ...result,
    orchestration,
  };
}

function resolveRetrieverPlans(
  config: NodeRetrievalConfig,
  inputData: Record<string, unknown>,
  executionContext: ExecutionContextState,
  workflowId: string,
  executionId: string
): ResolvedRetrieverPlan[] {
  const plans: ResolvedRetrieverPlan[] = [];

  for (let index = 0; index < config.retrievers.length; index++) {
    const retriever = config.retrievers[index]!;
    const primaryQuery = resolveRetrievalQuery(retriever, inputData);
    if (!primaryQuery) {
      continue;
    }
    const fallbackQuery = resolveFallbackRetrievalQuery(retriever, inputData);

    plans.push({
      key: retriever.key,
      branchIndex: index + 1,
      query: primaryQuery,
      fallbackQuery: fallbackQuery && fallbackQuery !== primaryQuery ? fallbackQuery : null,
      topK: retriever.topK,
      maxRetries: retriever.maxRetries,
      retryDelayMs: retriever.retryDelayMs,
      minMatches: retriever.minMatches,
      minScore: retriever.minScore,
      failOnError: retriever.failOnError,
      corpusId: retriever.corpusId,
      scope: resolveRuntimeRetrievalScope(retriever, workflowId, executionId),
    });
  }

  if (plans.length > 0) {
    return plans;
  }

  const memoryPreferredKey =
    typeof config.preferredRetrieverMemoryKey === "string" &&
    config.preferredRetrieverMemoryKey.length > 0
      ? executionContext.memory[config.preferredRetrieverMemoryKey]
      : undefined;
  const preferredMessage =
    typeof memoryPreferredKey === "string"
      ? `; preferred retriever "${memoryPreferredKey}" had no resolvable query`
      : "";

  throw new Error(
    `Retrieval enabled but no query or queryTemplate resolved for node${preferredMessage}`
  );
}

function applyAdaptiveOrdering(
  plans: ResolvedRetrieverPlan[],
  executionContext: ExecutionContextState,
  preferredRetrieverMemoryKey?: string
): ResolvedRetrieverPlan[] {
  if (
    !preferredRetrieverMemoryKey ||
    preferredRetrieverMemoryKey.trim().length === 0
  ) {
    return plans;
  }

  const preferred = executionContext.memory[preferredRetrieverMemoryKey];
  if (typeof preferred !== "string" || preferred.trim().length === 0) {
    return plans;
  }
  const normalized = preferred.trim();
  const match = plans.find((plan) => plan.key === normalized);
  if (!match) {
    return plans;
  }

  return [
    match,
    ...plans.filter((plan) => plan.key !== normalized),
  ];
}

interface RunRetrieverPlanParams {
  retrieveKnowledge: (query: RuntimeKnowledgeQuery) => Promise<RuntimeKnowledgeQueryResult>;
  onRetrievalEvent?: (event: RuntimeKnowledgeRetrievalEvent) => Promise<void>;
  executionContext: ExecutionContextState;
  executionId: string;
  workflowId: string;
  userId: string;
  nodeId: string;
  nodeType: string;
  strategy: RuntimeKnowledgeRetrievalStrategy;
  plan: ResolvedRetrieverPlan;
  softFail: boolean;
}

async function runRetrieverPlan(
  params: RunRetrieverPlanParams
): Promise<RetrieverPlanRunResult> {
  const {
    retrieveKnowledge,
    onRetrievalEvent,
    executionContext,
    executionId,
    workflowId,
    userId,
    nodeId,
    nodeType,
    strategy,
    plan,
    softFail,
  } = params;

  const queries = plan.fallbackQuery ? [plan.query, plan.fallbackQuery] : [plan.query];
  const maxAttemptsForPrimary = 1 + plan.maxRetries;
  let lastError: Error | null = null;
  let lastResult: RuntimeKnowledgeQueryResult | null = null;

  for (let queryIdx = 0; queryIdx < queries.length; queryIdx++) {
    const candidateQuery = queries[queryIdx]!;
    const maxAttempts = queryIdx === 0 ? maxAttemptsForPrimary : 1;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      const budgetExceededReason = getRetrievalBudgetExceededReason(executionContext.retrieval);
      if (budgetExceededReason) {
        const errorMessage = `Retrieval budget exceeded: ${budgetExceededReason}`;
        const budgetError = new Error(errorMessage);
        await emitRetrievalEventSafe(onRetrievalEvent, {
          executionId,
          workflowId,
          userId,
          nodeId,
          nodeType,
          query: candidateQuery,
          topK: plan.topK,
          attempt,
          maxAttempts,
          durationMs: 0,
          matchesCount: 0,
          status: "failed",
          errorMessage,
          scopeType: plan.scope.scopeType,
          corpusId: plan.corpusId,
          workflowIdScope: plan.scope.workflowIdScope,
          executionIdScope: plan.scope.executionIdScope,
          strategy,
          retrieverKey: plan.key,
          branchIndex: plan.branchIndex,
        });
        if (plan.failOnError && !softFail) {
          throw budgetError;
        }
        return {
          plan,
          result: { query: plan.query, topK: plan.topK, matches: [] },
          satisfied: false,
          error: budgetError,
        };
      }

      const attemptTimer = startTimer();
      try {
        const response = await retrieveKnowledge({
          executionId,
          workflowId,
          userId,
          nodeId,
          nodeType,
          query: candidateQuery,
          topK: plan.topK,
          corpusId: plan.corpusId,
          scopeType: plan.scope.scopeType,
          workflowIdScope: plan.scope.workflowIdScope,
          executionIdScope: plan.scope.executionIdScope,
          retrieverKey: plan.key,
          retrievalStrategy: strategy,
          branchIndex: plan.branchIndex,
        });

        const filtered = filterRetrievalMatches(response, plan.minScore);
        const matchesCount = filtered.matches.length;
        const durationMs = measureDuration(attemptTimer);
        lastResult = filtered;
        recordRetrievalAttempt(
          executionContext,
          durationMs,
          matchesCount >= plan.minMatches ? "success" : "empty"
        );

        const status = matchesCount >= plan.minMatches ? "success" : "empty";
        await emitRetrievalEventSafe(onRetrievalEvent, {
          executionId,
          workflowId,
          userId,
          nodeId,
          nodeType,
          query: candidateQuery,
          topK: plan.topK,
          attempt,
          maxAttempts,
          durationMs,
          matchesCount,
          status,
          errorMessage: null,
          scopeType: plan.scope.scopeType,
          corpusId: plan.corpusId,
          workflowIdScope: plan.scope.workflowIdScope,
          executionIdScope: plan.scope.executionIdScope,
          strategy,
          retrieverKey: plan.key,
          branchIndex: plan.branchIndex,
          selected: strategy === "single" || status === "success",
        });

        if (status === "success") {
          return {
            plan,
            result: filtered,
            satisfied: true,
            error: null,
          };
        }
      } catch (err) {
        lastError = err instanceof Error ? err : new Error(sanitizeErrorMessage(err));
        const durationMs = measureDuration(attemptTimer);
        recordRetrievalAttempt(executionContext, durationMs, "failed");

        await emitRetrievalEventSafe(onRetrievalEvent, {
          executionId,
          workflowId,
          userId,
          nodeId,
          nodeType,
          query: candidateQuery,
          topK: plan.topK,
          attempt,
          maxAttempts,
          durationMs,
          matchesCount: 0,
          status: "failed",
          errorMessage: sanitizeErrorMessage(lastError),
          scopeType: plan.scope.scopeType,
          corpusId: plan.corpusId,
          workflowIdScope: plan.scope.workflowIdScope,
          executionIdScope: plan.scope.executionIdScope,
          strategy,
          retrieverKey: plan.key,
          branchIndex: plan.branchIndex,
        });

        const shouldRetry = attempt < maxAttempts;
        if (!shouldRetry) {
          break;
        }
        if (plan.retryDelayMs > 0) {
          await sleep(plan.retryDelayMs);
        }
      }
    }
  }

  if (lastResult) {
    const satisfied = lastResult.matches.length >= plan.minMatches;
    const minMatchesError =
      !satisfied
        ? new Error(
            `Retrieval returned ${lastResult.matches.length} matches for retriever "${plan.key}", below required minMatches=${plan.minMatches}`
          )
        : null;

    if (!satisfied && plan.failOnError && !softFail) {
      throw minMatchesError;
    }

    return {
      plan,
      result: lastResult,
      satisfied,
      error: !satisfied ? minMatchesError : null,
    };
  }

  if (lastError && plan.failOnError && !softFail) {
    throw lastError;
  }

  return {
    plan,
    result: {
      query: plan.query,
      topK: plan.topK,
      matches: [],
    },
    satisfied: false,
    error: lastError,
  };
}

function mergeRetrieverMatches(
  results: RetrieverPlanRunResult[],
  topK: number
): RuntimeKnowledgeQueryResult["matches"] {
  const mergedByChunk = new Map<string, RuntimeKnowledgeQueryResult["matches"][number]>();
  for (const item of results) {
    for (const match of item.result.matches) {
      const existing = mergedByChunk.get(match.chunkId);
      if (!existing || existing.score < match.score) {
        mergedByChunk.set(match.chunkId, match);
      }
    }
  }
  return Array.from(mergedByChunk.values())
    .sort((a, b) => b.score - a.score)
    .slice(0, Math.max(1, Math.min(topK, 50)));
}

function selectBestScoreResult(
  results: RetrieverPlanRunResult[]
): RetrieverPlanRunResult | null {
  let best: RetrieverPlanRunResult | null = null;
  let bestTopScore = Number.NEGATIVE_INFINITY;
  for (const item of results) {
    if (item.result.matches.length === 0) continue;
    const topScore = item.result.matches[0]?.score ?? Number.NEGATIVE_INFINITY;
    if (!best) {
      best = item;
      bestTopScore = topScore;
      continue;
    }
    if (topScore > bestTopScore) {
      best = item;
      bestTopScore = topScore;
      continue;
    }
    if (topScore === bestTopScore) {
      if (item.result.matches.length > (best.result.matches.length ?? 0)) {
        best = item;
      }
    }
  }
  return best;
}

function resolveRuntimeRetrievalScope(
  config: RetrievalScopeConfig,
  workflowId: string,
  executionId: string
): {
  scopeType?: KnowledgeScopeType;
  workflowIdScope?: string;
  executionIdScope?: string;
} {
  if (config.scopeType === "workflow") {
    return {
      scopeType: "workflow",
      workflowIdScope: config.workflowId ?? workflowId,
    };
  }

  if (config.scopeType === "execution") {
    return {
      scopeType: "execution",
      executionIdScope: config.executionId ?? executionId,
    };
  }

  return {
    scopeType: config.scopeType,
    workflowIdScope: config.workflowId,
    executionIdScope: config.executionId,
  };
}

function getRetrievalBudgetExceededReason(
  retrieval: ExecutionContextRetrievalState
): string | null {
  if (retrieval.totalRequests >= retrieval.maxRequests) {
    return `maxRequests reached (${retrieval.maxRequests})`;
  }
  if (retrieval.totalFailures >= retrieval.maxFailures) {
    return `maxFailures reached (${retrieval.maxFailures})`;
  }
  if (retrieval.totalDurationMs >= retrieval.maxDurationMs) {
    return `maxDurationMs reached (${retrieval.maxDurationMs})`;
  }
  return null;
}

function recordRetrievalAttempt(
  executionContext: ExecutionContextState,
  durationMs: number,
  status: "success" | "empty" | "failed"
): void {
  const next = { ...executionContext.retrieval };
  next.totalRequests += 1;
  next.totalDurationMs += Math.max(0, durationMs);

  if (status === "success") {
    next.totalSuccesses += 1;
  } else if (status === "empty") {
    next.totalEmpties += 1;
  } else {
    next.totalFailures += 1;
  }

  applyExecutionContextPatch(executionContext, {
    retrieval: next,
  });
}

function filterRetrievalMatches(
  result: RuntimeKnowledgeQueryResult,
  minScore?: number
): RuntimeKnowledgeQueryResult {
  if (minScore === undefined) {
    return result;
  }
  return {
    ...result,
    matches: result.matches.filter((match) => match.score >= minScore),
  };
}

async function emitRetrievalEventSafe(
  onRetrievalEvent: ((event: RuntimeKnowledgeRetrievalEvent) => Promise<void>) | undefined,
  event: RuntimeKnowledgeRetrievalEvent
): Promise<void> {
  if (!onRetrievalEvent) return;
  try {
    await onRetrievalEvent(event);
  } catch {
    // Retrieval event persistence should not break execution.
  }
}

function interpolateTemplate(
  template: string,
  data: Record<string, unknown>
): string {
  return template.replace(/\{\{(\w+(?:\.\w+)*)\}\}/g, (_match, path: string) => {
    const keys = path.split(".");
    let value: unknown = data;
    for (const key of keys) {
      if (value !== null && typeof value === "object") {
        value = (value as Record<string, unknown>)[key];
      } else {
        return `{{${path}}}`;
      }
    }
    return String(value ?? `{{${path}}}`);
  });
}
