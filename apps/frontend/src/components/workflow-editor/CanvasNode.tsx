// ──────────────────────────────────────────────
// REX - Canvas Node (visual node on canvas)
// ──────────────────────────────────────────────

"use client";

import React, { useCallback, useMemo } from "react";
import type { CanvasNode } from "./types";
import { getNodeTypeDef, getCategoryColor } from "./types";
import { InlineNodeDetails } from "./InlineNodeDetails";

interface CanvasNodeProps {
  node: CanvasNode;
  selected: boolean;
  expanded: boolean;
  dragging: boolean;
  executionStatus?: string;
  incomingLabels: string[];
  outgoingLabels: string[];
  onMouseDown: (e: React.MouseEvent, nodeId: string) => void;
  onClick: (e: React.MouseEvent, nodeId: string) => void;
  onOpenAdvanced: (nodeId: string) => void;
  onUpdate: (nodeId: string, updates: Partial<CanvasNode>) => void;
  onPortMouseDown: (e: React.MouseEvent, nodeId: string, portType: "in" | "out") => void;
  onPortMouseUp: (e: React.MouseEvent, nodeId: string, portType: "in" | "out") => void;
}

// Icon mapping per node type
function getNodeIcon(nodeType: string): string {
  const icons: Record<string, string> = {
    trigger: "▶",
    "manual-trigger": "▶",
    "webhook-trigger": "🔗",
    "schedule-trigger": "⏱",
    llm: "🧠",
    "http-request": "🌐",
    code: "{}",
    transformer: "⚙",
    storage: "💾",
    "memory-write": "✍",
    "memory-read": "👁",
    "execution-control": "🎮",
    evaluation: "✔",
    "json-validator": "✓",
    condition: "⬌",
    "data-cleaner": "🧹",
    "knowledge-ingest": "📥",
    "knowledge-retrieve": "📚",
    "input-guard": "🛡",
    "output-guard": "🔒",
    "json-simplify": "📋",
    log: "📝",
    output: "📤",
    "file-upload": "📂",
  };
  return icons[nodeType] || "◆";
}

// Get subtitle/context for special nodes like triggers
function getNodeSubtitle(nodeType: string, nodeConfig: Record<string, unknown>): string | null {
  if (nodeType === "trigger") {
    const triggerType = (nodeConfig["triggerType"] as string) ?? "manual";
    const typeDisplay: Record<string, string> = {
      manual: "Manual Run",
      event: "Event Trigger",
      schedule: "Scheduled Run",
    };
    return typeDisplay[triggerType] || "Unknown";
  }
  return null;
}

export function CanvasNodeComponent({
  node,
  selected,
  expanded,
  dragging,
  executionStatus,
  incomingLabels,
  outgoingLabels,
  onMouseDown,
  onClick,
  onOpenAdvanced,
  onUpdate,
  onPortMouseDown,
  onPortMouseUp,
}: CanvasNodeProps) {
  const def = getNodeTypeDef(node.type);
  const categoryColor = getCategoryColor(def?.category ?? "action");
  const subtitle = useMemo(
    () => getNodeSubtitle(node.type, node.config),
    [node.type, node.config]
  );

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      onMouseDown(e, node.id);
    },
    [node.id, onMouseDown]
  );

  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      onClick(e, node.id);
    },
    [node.id, onClick]
  );

  const handleInPortDown = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      onPortMouseDown(e, node.id, "in");
    },
    [node.id, onPortMouseDown]
  );

  const handleOutPortDown = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      onPortMouseDown(e, node.id, "out");
    },
    [node.id, onPortMouseDown]
  );

  const handleInPortUp = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      onPortMouseUp(e, node.id, "in");
    },
    [node.id, onPortMouseUp]
  );

  const handleOutPortUp = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      onPortMouseUp(e, node.id, "out");
    },
    [node.id, onPortMouseUp]
  );

  const classNames = [
    "wf-node",
    def?.category ? `cat-${def.category}` : "",
    selected ? "selected" : "",
    dragging ? "dragging" : "",
    executionStatus ? `exec-${executionStatus}` : "",
  ]
    .filter(Boolean)
    .join(" ");

  const isTrigger = def?.category === "trigger";

  return (
    <div
      className="wf-node-stack"
      style={{
        left: node.position.x,
        top: node.position.y,
        ["--wf-node-color" as string]: categoryColor,
      }}
    >
      <div
        className={classNames}
        data-node-id={node.id}
        onMouseDown={handleMouseDown}
        onClick={handleClick}
      >
        {/* Input port (not on triggers) */}
        {!isTrigger && (
          <div
            className="wf-port-in"
            onMouseDown={handleInPortDown}
            onMouseUp={handleInPortUp}
          />
        )}

        {/* Output port */}
        <div
          className="wf-port-out"
          onMouseDown={handleOutPortDown}
          onMouseUp={handleOutPortUp}
        />

        {/* Modern Node Content */}
        <div className="wf-node-content">
          {/* Icon + Header Section */}
          <div className="wf-node-header">
            <span className="wf-node-icon">{getNodeIcon(node.type)}</span>
            <div className="wf-node-title-section">
              <span className="wf-node-title">{def?.label ?? node.type}</span>
              {subtitle && <span className="wf-node-subtitle">{subtitle}</span>}
            </div>
            {executionStatus && (
              <span className={`wf-node-exec-badge ${executionStatus}`}>
                {executionStatus === "completed"
                  ? "✓"
                  : executionStatus === "running"
                  ? "⟳"
                  : executionStatus === "failed"
                  ? "✕"
                  : executionStatus === "skipped"
                  ? "—"
                  : ""}
              </span>
            )}
          </div>

          {/* Node Label (hide for triggers since title shows info) */}
          {node.type !== "trigger" && (
            <div className="wf-node-label">{node.label}</div>
          )}
        </div>
      </div>

      {/* Primary interaction: inline node details */}
      <InlineNodeDetails
        node={node}
        expanded={expanded}
        incomingLabels={incomingLabels}
        outgoingLabels={outgoingLabels}
        onUpdate={onUpdate}
        onOpenAdvanced={onOpenAdvanced}
      />
    </div>
  );
}
