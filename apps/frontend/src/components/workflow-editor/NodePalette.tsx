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

const CATEGORIES: { key: string; label: string; icon: string }[] = [
  { key: "trigger", label: "Triggers", icon: "T" },
  { key: "action", label: "Actions", icon: "A" },
  { key: "logic", label: "Logic", icon: "L" },
  { key: "output", label: "Output", icon: "O" },
];

export function NodePalette({ onDragStart }: NodePaletteProps) {
  return (
    <div className="wf-palette">
      <div className="wf-palette-header">
        <div className="wf-palette-title">Node Library</div>
        <div className="wf-palette-subtitle">Drag onto canvas to compose flow</div>
      </div>
      {CATEGORIES.map((cat) => {
        const items = NODE_TYPE_DEFS.filter((d) => d.category === cat.key);
        if (items.length === 0) return null;
        return (
          <div key={cat.key} className="wf-palette-group">
            <div className="wf-palette-group-label">
              <span className="wf-palette-group-icon">{cat.icon}</span>
              <span>{cat.label}</span>
              <span className="wf-palette-group-count">{items.length}</span>
            </div>
            {items.map((def) => (
              <div
                key={def.type}
                className="wf-palette-item"
                style={{ ["--wf-node-color" as string]: getCategoryColor(def.category) }}
                draggable
                onDragStart={(e) => onDragStart(e, def)}
              >
                <div className="wf-palette-dot" />
                <div className="wf-palette-info">
                  <div className="wf-palette-label">{def.label}</div>
                  <div className="wf-palette-desc">{def.description}</div>
                </div>
              </div>
            ))}
          </div>
        );
      })}

      <div className="wf-palette-footer">
        <a href="/dashboard/settings" className="wf-palette-settings-link">
          API Keys &amp; Settings
        </a>
      </div>
    </div>
  );
}
