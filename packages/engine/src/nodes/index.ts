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
};
