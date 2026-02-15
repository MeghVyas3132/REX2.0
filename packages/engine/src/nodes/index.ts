// ──────────────────────────────────────────────
// REX - Node Registrations
// Registers all built-in nodes with the registry
// ──────────────────────────────────────────────

import { registerNode } from "../registry.js";
import { WebhookTriggerNode } from "./webhook-trigger.js";
import { ManualTriggerNode } from "./manual-trigger.js";
import { ScheduleTriggerNode } from "./schedule-trigger.js";
import { DataCleanerNode } from "./data-cleaner.js";
import { LLMNode } from "./llm.js";
import { JSONValidatorNode } from "./json-validator.js";
import { StorageNode } from "./storage.js";
import { LogNode } from "./log.js";
import { HTTPRequestNode } from "./http-request.js";
import { ConditionNode } from "./condition.js";
import { CodeNode } from "./code.js";
import { TransformerNode } from "./transformer.js";
import { OutputNode } from "./output.js";
import { FileUploadNode } from "./file-upload.js";
import { MemoryWriteNode } from "./memory-write.js";
import { MemoryReadNode } from "./memory-read.js";
import { ExecutionControlNode } from "./execution-control.js";
import { EvaluationNode } from "./evaluation.js";
import { KnowledgeIngestNode } from "./knowledge-ingest.js";
import { KnowledgeRetrieveNode } from "./knowledge-retrieve.js";

export function registerAllNodes(): void {
  registerNode(WebhookTriggerNode);
  registerNode(ManualTriggerNode);
  registerNode(ScheduleTriggerNode);
  registerNode(DataCleanerNode);
  registerNode(LLMNode);
  registerNode(JSONValidatorNode);
  registerNode(StorageNode);
  registerNode(LogNode);
  registerNode(HTTPRequestNode);
  registerNode(ConditionNode);
  registerNode(CodeNode);
  registerNode(TransformerNode);
  registerNode(OutputNode);
  registerNode(FileUploadNode);
  registerNode(MemoryWriteNode);
  registerNode(MemoryReadNode);
  registerNode(ExecutionControlNode);
  registerNode(EvaluationNode);
  registerNode(KnowledgeIngestNode);
  registerNode(KnowledgeRetrieveNode);
}

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
};
