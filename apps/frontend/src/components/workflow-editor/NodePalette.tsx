// ──────────────────────────────────────────────
// REX - Node Palette (drag source)
// ──────────────────────────────────────────────

"use client";

import React from "react";
import { NODE_TYPE_DEFS, getCategoryColor } from "./types";
import type { NodeTypeDefinition } from "./types";

interface NodePaletteProps {
  onDragStart: (e: React.DragEvent, def: NodeTypeDefinition) => void;
}

const CATEGORIES: { key: string; label: string }[] = [
  { key: "trigger", label: "Triggers" },
  { key: "action", label: "Actions" },
  { key: "logic", label: "Logic" },
  { key: "output", label: "Output" },
];

export function NodePalette({ onDragStart }: NodePaletteProps) {
  return (
    <div className="wf-palette">
      <div className="wf-palette-header">Nodes</div>
      {CATEGORIES.map((cat) => {
        const items = NODE_TYPE_DEFS.filter((d) => d.category === cat.key);
        if (items.length === 0) return null;
        return (
          <div key={cat.key} className="wf-palette-group">
            <div className="wf-palette-group-label">{cat.label}</div>
            {items.map((def) => (
              <div
                key={def.type}
                className="wf-palette-item"
                draggable
                onDragStart={(e) => onDragStart(e, def)}
              >
                <div
                  className="wf-palette-dot"
                  style={{ backgroundColor: getCategoryColor(def.category) }}
                />
                <div className="wf-palette-info">
                  <div className="wf-palette-label">{def.label}</div>
                  <div className="wf-palette-desc">{def.description}</div>
                </div>
              </div>
            ))}
          </div>
        );
      })}
    </div>
  );
}
