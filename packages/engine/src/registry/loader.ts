import type { BaseNodeDefinition, PluginCategory, PluginManifest } from "@rex/types";
import {
  WebhookTriggerNode,
  ManualTriggerNode,
  ScheduleTriggerNode,
  DataCleanerNode,
  LLMNode,
  JSONValidatorNode,
  StorageNode,
  LogNode,
  HTTPRequestNode,
  ConditionNode,
  CodeNode,
  TransformerNode,
  OutputNode,
  FileUploadNode,
  MemoryWriteNode,
  MemoryReadNode,
  ExecutionControlNode,
  EvaluationNode,
  KnowledgeIngestNode,
  KnowledgeRetrieveNode,
  InputGuardNode,
  OutputGuardNode,
  JSONSimplifyNode,
} from "../nodes/index.js";
import { globalRegistry, type ExecutionContext } from "./index.js";

const legacyBuiltins: BaseNodeDefinition[] = [
  WebhookTriggerNode,
  ManualTriggerNode,
  ScheduleTriggerNode,
  DataCleanerNode,
  LLMNode,
  JSONValidatorNode,
  StorageNode,
  LogNode,
  HTTPRequestNode,
  ConditionNode,
  CodeNode,
  TransformerNode,
  OutputNode,
  FileUploadNode,
  MemoryWriteNode,
  MemoryReadNode,
  ExecutionControlNode,
  EvaluationNode,
  KnowledgeIngestNode,
  KnowledgeRetrieveNode,
  InputGuardNode,
  OutputGuardNode,
  JSONSimplifyNode,
];

function inferCategory(type: string): PluginCategory {
  if (type.includes("trigger")) return "trigger";
  if (type.includes("llm") || type.includes("knowledge") || type.includes("evaluation")) return "ai_llm";
  if (type.includes("guard")) return "compliance_rex";
  if (type.includes("http") || type.includes("file")) return "communication";
  return "logic_control";
}

function toManifest(node: BaseNodeDefinition): PluginManifest {
  return {
    slug: node.type,
    name: node.type,
    description: `Built-in ${node.type} plugin`,
    category: inferCategory(node.type),
    version: "1.0.0",
    inputSchema: {
      type: "object",
      properties: {},
      required: [],
    },
    outputSchema: {
      type: "object",
      properties: {},
      required: [],
    },
    rexHints: {
      responsibleScore: 50,
      ethicalScore: 50,
      explainableScore: 50,
      dataCategories: [],
      gdprLawfulBasisRequired: false,
      piiRisk: "low",
      crossBorderRisk: false,
      auditRequired: false,
    },
    businessLabel: node.type,
    businessDescription: `Run ${node.type}`,
    isAllowedInBusinessMode: true,

    // Legacy compatibility fields
    nodeType: node.type,
    inputs: [],
    outputs: [],
    configSchema: {},
  };
}

function toLegacyContext(context: ExecutionContext) {
  const logger =
    context.logger ??
    {
      info: () => undefined,
      warn: () => undefined,
      error: () => undefined,
      debug: () => undefined,
    };

  return {
    executionId: context.executionId,
    workflowId: context.workflowId,
    userId: context.userId ?? "system",
    correlationId: context.correlationId ?? context.executionId,
    nodeId: context.nodeId,
    logger,
    getApiKey: context.getApiKey ?? (async () => ""),
    getExecutionContext: () => ({
      version: 1,
      memory: {},
      knowledge: {},
      control: {
        loopCount: 0,
        retryCount: 0,
        maxLoops: 100,
        maxRetries: 3,
        terminate: false,
      },
      retrieval: {
        totalRequests: 0,
        totalSuccesses: 0,
        totalEmpties: 0,
        totalFailures: 0,
        totalDurationMs: 0,
        maxRequests: 100,
        maxFailures: 10,
        maxDurationMs: 60000,
      },
      runtime: {
        startedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        lastCompletedNodeId: null,
        activeNodeId: context.nodeId,
      },
    }),
    updateExecutionContext: () => undefined,
    getMemory: () => undefined,
    setMemory: () => undefined,
  };
}

export function loadBuiltinPlugins(): void {
  for (const node of legacyBuiltins) {
    const manifest = toManifest(node);
    globalRegistry.register(manifest, async (input, context) => {
      try {
        const result = await node.execute(
          { data: input, metadata: {} },
          toLegacyContext(context)
        );
        return result.data;
      } catch (error) {
        const message = error instanceof Error ? error.message : "Plugin execution failed";
        await context.auditLog({
          type: "plugin.execution.failed",
          message,
          metadata: {
            nodeId: context.nodeId,
            executionId: context.executionId,
            pluginSlug: manifest.slug,
          },
        });
        throw error;
      }
    });
  }
}