// ──────────────────────────────────────────────
// REX - Node Registrations
// Registers all built-in nodes with the registry
// ──────────────────────────────────────────────

import { registerNode } from "../registry.js";
import { WebhookTriggerNode } from "./webhook-trigger.js";
import { ManualTriggerNode } from "./manual-trigger.js";
import { DataCleanerNode } from "./data-cleaner.js";
import { LLMNode } from "./llm.js";
import { JSONValidatorNode } from "./json-validator.js";
import { StorageNode } from "./storage.js";
import { LogNode } from "./log.js";

export function registerAllNodes(): void {
  registerNode(WebhookTriggerNode);
  registerNode(ManualTriggerNode);
  registerNode(DataCleanerNode);
  registerNode(LLMNode);
  registerNode(JSONValidatorNode);
  registerNode(StorageNode);
  registerNode(LogNode);
}

export {
  WebhookTriggerNode,
  ManualTriggerNode,
  DataCleanerNode,
  LLMNode,
  JSONValidatorNode,
  StorageNode,
  LogNode,
};
