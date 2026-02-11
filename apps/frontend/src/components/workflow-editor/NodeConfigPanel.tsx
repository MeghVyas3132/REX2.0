// ──────────────────────────────────────────────
// REX - Node Config Panel (right sidebar)
// ──────────────────────────────────────────────

"use client";

import React from "react";
import type { CanvasNode } from "./types";
import { getNodeTypeDef, getCategoryColor } from "./types";

interface NodeConfigPanelProps {
  node: CanvasNode;
  onUpdate: (nodeId: string, updates: Partial<CanvasNode>) => void;
  onDelete: (nodeId: string) => void;
  onClose: () => void;
}

export function NodeConfigPanel({
  node,
  onUpdate,
  onDelete,
  onClose,
}: NodeConfigPanelProps) {
  const def = getNodeTypeDef(node.type);
  const categoryColor = getCategoryColor(def?.category ?? "action");

  function handleLabelChange(value: string) {
    onUpdate(node.id, { label: value });
  }

  function handleConfigChange(key: string, value: string) {
    const updates: Record<string, string> = { [key]: value };

    // Auto-switch model when provider changes on LLM nodes
    if (key === "provider" && node.type === "llm") {
      const currentModel = (node.config["model"] as string) ?? "";
      const geminiModels = ["gemini-2.0-flash", "gemini-pro", "gemini-pro-vision", "gemini-ultra", ""];
      const groqModels = ["llama-3.3-70b-versatile", "llama-3.1-8b-instant", "mixtral-8x7b-32768", ""];

      if (value === "groq" && (geminiModels.includes(currentModel) || currentModel.startsWith("gemini"))) {
        updates["model"] = "llama-3.3-70b-versatile";
      } else if (value === "gemini" && (groqModels.includes(currentModel) || currentModel.startsWith("llama") || currentModel.startsWith("mixtral"))) {
        updates["model"] = "gemini-2.0-flash";
      }
    }

    onUpdate(node.id, {
      config: { ...node.config, ...updates },
    });
  }

  return (
    <div className="wf-panel">
      <div className="wf-panel-header">
        <span className="wf-panel-title">
          <span
            style={{
              display: "inline-block",
              width: 8,
              height: 8,
              borderRadius: "50%",
              backgroundColor: categoryColor,
              marginRight: 8,
            }}
          />
          {def?.label ?? node.type}
        </span>
        <button className="wf-panel-close" onClick={onClose}>
          x
        </button>
      </div>

      <div className="wf-panel-body">
        {/* Node Label */}
        <div className="wf-panel-field">
          <label className="wf-panel-label">Label</label>
          <input
            className="wf-panel-input"
            value={node.label}
            onChange={(e) => handleLabelChange(e.target.value)}
            placeholder="Node label"
          />
        </div>

        {/* Type (read-only) */}
        <div className="wf-panel-field">
          <label className="wf-panel-label">Type</label>
          <input
            className="wf-panel-input"
            value={def?.label ?? node.type}
            readOnly
            style={{ color: "#666" }}
          />
        </div>

        {/* Dynamic config fields */}
        {def?.configFields.map((field) => (
          <div key={field.key} className="wf-panel-field">
            <label className="wf-panel-label">{field.label}</label>
            {field.type === "textarea" ? (
              <textarea
                className="wf-panel-textarea"
                value={(node.config[field.key] as string) ?? ""}
                onChange={(e) => handleConfigChange(field.key, e.target.value)}
                placeholder={field.placeholder}
                rows={5}
              />
            ) : field.type === "select" ? (
              <select
                className="wf-panel-select"
                value={(node.config[field.key] as string) ?? ""}
                onChange={(e) => handleConfigChange(field.key, e.target.value)}
              >
                {field.options?.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            ) : (
              <input
                className="wf-panel-input"
                type={field.type === "number" ? "number" : "text"}
                value={(node.config[field.key] as string) ?? ""}
                onChange={(e) => handleConfigChange(field.key, e.target.value)}
                placeholder={field.placeholder}
              />
            )}
          </div>
        ))}

        {/* API key notice for LLM nodes */}
        {node.type === "llm" && (
          <div className="wf-panel-notice">
            <p className="wf-panel-notice-text">
              This node requires an API key to run. Make sure you have added your
              provider key in settings.
            </p>
            <a href="/dashboard/settings" className="wf-panel-notice-link">
              Manage API Keys
            </a>
          </div>
        )}
      </div>

      <div className="wf-panel-footer">
        <button
          className="wf-panel-delete"
          onClick={() => onDelete(node.id)}
        >
          Delete Node
        </button>
      </div>
    </div>
  );
}
