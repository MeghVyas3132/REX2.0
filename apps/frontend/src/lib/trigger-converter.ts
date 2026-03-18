/**
 * Trigger Node Type Converter
 * 
 * Converts between the unified "trigger" node type (frontend)
 * and the backend trigger types (manual-trigger, webhook-trigger, schedule-trigger).
 */

import type { CanvasNode } from "@/components/workflow-editor/types";
import type { WorkflowNodeClient } from "./api";

/**
 * Convert unified "trigger" nodes to backend format
 * Used before sending to API
 */
export function convertTriggersToBackend(
  nodes: CanvasNode[]
): WorkflowNodeClient[] {
  return nodes.map((node) => {
    if (node.type !== "trigger") {
      return {
        id: node.id,
        type: node.type,
        label: node.label,
        position: node.position,
        config: node.config,
      };
    }

    // Convert unified "trigger" to specific backend type
    const triggerType = (node.config["triggerType"] as string) ?? "manual";

    let backendType: string;
    let backendConfig: Record<string, unknown>;

    switch (triggerType) {
      case "event":
        backendType = "webhook-trigger";
        backendConfig = {
          method: (node.config["method"] as string) ?? "POST",
        };
        break;
      case "schedule":
        backendConfig = {
          cron: (node.config["cron"] as string) ?? "0 * * * *",
        };
        if (node.config["intervalMs"]) {
          (backendConfig as Record<string, unknown>)["intervalMs"] = node.config["intervalMs"];
        }
        backendType = "schedule-trigger";
        break;
      case "manual":
      default:
        backendType = "manual-trigger";
        backendConfig = {};
        break;
    }

    return {
      id: node.id,
      type: backendType,
      label: node.label,
      position: node.position,
      config: backendConfig,
    };
  });
}

/**
 * Convert backend trigger types to unified "trigger" node
 * Used after loading from API
 */
export function convertTriggersFromBackend(
  nodes: WorkflowNodeClient[]
): CanvasNode[] {
  return nodes.map((node) => {
    if (
      node.type !== "manual-trigger" &&
      node.type !== "webhook-trigger" &&
      node.type !== "schedule-trigger"
    ) {
      return {
        id: node.id,
        type: node.type,
        label: node.label,
        position: node.position,
        config: node.config,
      };
    }

    // Convert specific backend types to unified "trigger"
    let triggerType: string;
    let config: Record<string, unknown> = { ...node.config };

    switch (node.type) {
      case "webhook-trigger":
        triggerType = "event";
        break;
      case "schedule-trigger":
        triggerType = "schedule";
        break;
      case "manual-trigger":
      default:
        triggerType = "manual";
        break;
    }

    config["triggerType"] = triggerType;

    return {
      id: node.id,
      type: "trigger",
      label: node.label,
      position: node.position,
      config,
    };
  });
}
