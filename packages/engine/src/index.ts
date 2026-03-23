// ──────────────────────────────────────────────
// REX - Engine Package
// ──────────────────────────────────────────────

export { registerNode, resolveNode, getRegisteredNodeTypes, isNodeRegistered, clearRegistry } from "./registry.js";
export { validateDAG } from "./dag-validator.js";
export type { DAGValidationResult } from "./dag-validator.js";
export { executeWorkflow } from "./execution-engine.js";
export type { EngineExecutionParams } from "./execution-engine.js";
export { registerAllNodes } from "./nodes/index.js";
export {
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
} from "./nodes/index.js";

export {
  PluginRegistry,
  globalRegistry,
  type RegisteredPlugin,
  type NodeExecutorFn,
  type ExecutionContext,
  type AuditEvent,
} from "./registry/index.js";
export { loadBuiltinPlugins } from "./registry/loader.js";
export {
  validateNodeConfigAgainstManifest,
  maskSensitiveInput,
  type PluginValidationResult,
} from "./registry/validator.js";
export { createTenantByokResolver, type ByokKeyStore } from "./registry/resolver.js";
export { computeRexScore, type WorkflowGraph, type TenantConfig } from "./rex/scorer.js";
