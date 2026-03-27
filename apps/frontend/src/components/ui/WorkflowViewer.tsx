"use client";

import React from "react";
import { Card } from "./Card";
import { Timeline } from "./Timeline";

type WorkflowNode = {
  id: string;
  name: string;
  status: "success" | "error" | "pending" | "skipped";
  duration?: number;
};

type WorkflowViewerProps = {
  nodes: WorkflowNode[];
  compact?: boolean;
};

export function WorkflowViewer({ nodes, compact = false }: WorkflowViewerProps) {
  const timelineItems = nodes.map((node) => ({
    id: node.id,
    title: node.name,
    status: node.status,
    description: node.duration ? `${node.duration}ms` : undefined,
  }));

  if (compact) {
    return (
      <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
        {nodes.map((node) => {
          const statusColors = {
            success: "#10b981",
            error: "#ef4444",
            pending: "#f59e0b",
            skipped: "#6b7280",
          };
          return (
            <div
              key={node.id}
              title={node.name}
              style={{
                width: "0.75rem",
                height: "0.75rem",
                borderRadius: "50%",
                backgroundColor: statusColors[node.status],
              }}
            />
          );
        })}
      </div>
    );
  }

  return (
    <Card>
      <Timeline items={timelineItems} />
    </Card>
  );
}
