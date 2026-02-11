// ──────────────────────────────────────────────
// REX - Canvas Node (visual node on canvas)
// ──────────────────────────────────────────────

"use client";

import React, { useCallback } from "react";
import type { CanvasNode } from "./types";
import { getNodeTypeDef, getCategoryColor } from "./types";

interface CanvasNodeProps {
  node: CanvasNode;
  selected: boolean;
  dragging: boolean;
  executionStatus?: string;
  onMouseDown: (e: React.MouseEvent, nodeId: string) => void;
  onClick: (e: React.MouseEvent, nodeId: string) => void;
  onPortMouseDown: (e: React.MouseEvent, nodeId: string, portType: "in" | "out") => void;
  onPortMouseUp: (e: React.MouseEvent, nodeId: string, portType: "in" | "out") => void;
}

export function CanvasNodeComponent({
  node,
  selected,
  dragging,
  executionStatus,
  onMouseDown,
  onClick,
  onPortMouseDown,
  onPortMouseUp,
}: CanvasNodeProps) {
  const def = getNodeTypeDef(node.type);
  const categoryColor = getCategoryColor(def?.category ?? "action");

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
    selected ? "selected" : "",
    dragging ? "dragging" : "",
    executionStatus ? `exec-${executionStatus}` : "",
  ]
    .filter(Boolean)
    .join(" ");

  const isTrigger = def?.category === "trigger";

  return (
    <div
      className={classNames}
      style={{
        left: node.position.x,
        top: node.position.y,
      }}
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

      {/* Header */}
      <div className="wf-node-header">
        <div
          className="wf-node-cat-dot"
          style={{ backgroundColor: categoryColor }}
        />
        <span className="wf-node-type">
          {def?.label ?? node.type}
        </span>
        {executionStatus && (
          <span className={`wf-node-exec-badge ${executionStatus}`}>
            {executionStatus === "completed" ? "OK" :
             executionStatus === "running" ? "..." :
             executionStatus === "failed" ? "ERR" :
             executionStatus === "skipped" ? "SKIP" : ""}
          </span>
        )}
      </div>

      {/* Label */}
      <div className="wf-node-label">{node.label}</div>
    </div>
  );
}
