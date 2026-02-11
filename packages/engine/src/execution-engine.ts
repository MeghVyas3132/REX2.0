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
} from "@rex/types";
import {
  createExecutionLogger,
  createCorrelationId,
  startTimer,
  measureDuration,
  sanitizeErrorMessage,
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
  onStepStart?: (nodeId: string, nodeType: string) => Promise<void>;
  onStepComplete?: (step: ExecutionStepResult) => Promise<void>;
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
    onStepStart,
    onStepComplete,
  } = params;

  const correlationId = createCorrelationId();
  const logger = createExecutionLogger(executionId, workflowId, correlationId);
  const engineTimer = startTimer();

  logger.info({ nodeCount: nodes.length, edgeCount: edges.length }, "Workflow execution started");

  const steps: ExecutionStepResult[] = [];
  let finalStatus: ExecutionStatus = "completed";
  let errorMessage: string | null = null;

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

    // 4. Execute nodes in topological order
    for (const nodeId of dagResult.executionOrder) {
      const node = nodeMap.get(nodeId);
      if (!node) {
        throw new Error(`Node "${nodeId}" not found in workflow`);
      }

      const stepTimer = startTimer();
      let stepStatus: StepStatus = "running";
      let stepOutput: Record<string, unknown> | null = null;
      let stepError: string | null = null;

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
        const parentOutputs = getParentOutputs(nodeId, edges, outputMap);
        const nodeInput: NodeInput = {
          data: {
            ...triggerPayload,
            ...parentOutputs,
          },
          metadata: {
            nodeConfig: node.config,
            executionId,
            workflowId,
          },
        };

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
        };

        // Execute node
        const output = await nodeImpl.execute(nodeInput, context);
        outputMap.set(nodeId, output);

        stepStatus = "completed";
        stepOutput = output.data;

        logger.info({ nodeId, nodeType: node.type, durationMs: measureDuration(stepTimer) }, "Node executed successfully");
      } catch (err) {
        stepStatus = "failed";
        stepError = sanitizeErrorMessage(err);
        finalStatus = "failed";
        errorMessage = `Node "${nodeId}" (${node.type}) failed: ${stepError}`;

        logger.error({ nodeId, nodeType: node.type, error: stepError, durationMs: measureDuration(stepTimer) }, "Node execution failed");
      }

      const stepResult: ExecutionStepResult = {
        nodeId,
        nodeType: node.type,
        status: stepStatus,
        input: { ...triggerPayload },
        output: stepOutput,
        durationMs: measureDuration(stepTimer),
        error: stepError,
      };

      steps.push(stepResult);
      await onStepComplete?.(stepResult);

      // Stop execution on failure (sequential mode)
      if (stepStatus === "failed") {
        // Mark remaining nodes as skipped
        const remainingIndex = dagResult.executionOrder.indexOf(nodeId) + 1;
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
            error: "Skipped due to previous node failure",
          };
          steps.push(skippedStep);
          await onStepComplete?.(skippedStep);
        }
        break;
      }
    }
  } catch (err) {
    finalStatus = "failed";
    errorMessage = sanitizeErrorMessage(err);
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

  return {
    executionId,
    status: finalStatus,
    steps,
    totalDurationMs,
    errorMessage,
  };
}

function getParentOutputs(
  nodeId: string,
  edges: WorkflowEdge[],
  outputMap: Map<string, NodeOutput>
): Record<string, unknown> {
  const parentEdges = edges.filter((e) => e.target === nodeId);
  const merged: Record<string, unknown> = {};

  for (const edge of parentEdges) {
    const parentOutput = outputMap.get(edge.source);
    if (parentOutput) {
      Object.assign(merged, parentOutput.data);
    }
  }

  return merged;
}
