"use client";

import React, { useMemo, useCallback } from "react";
import type { CanvasNode, ConfigField } from "./types";
import { getCategoryColor, getNodeTypeDef, INLINE_CONFIG_KEYS } from "./types";

interface InlineNodeDetailsProps {
  node: CanvasNode;
  expanded: boolean;
  incomingLabels: string[];
  outgoingLabels: string[];
  onUpdate: (nodeId: string, updates: Partial<CanvasNode>) => void;
  onOpenAdvanced: (nodeId: string) => void;
}

export function InlineNodeDetails({
  node,
  expanded,
  incomingLabels,
  outgoingLabels,
  onUpdate,
  onOpenAdvanced,
}: InlineNodeDetailsProps) {
  const def = getNodeTypeDef(node.type);
  const color = getCategoryColor(def?.category ?? "action");

  // Resolve which config fields to surface in the quick-edit panel
  const inlineFields = useMemo((): ConfigField[] => {
    if (!def) return [];
    const keys = INLINE_CONFIG_KEYS[node.type];
    if (keys && keys.length > 0) {
      return keys
        .map((key) => def.configFields.find((f) => f.key === key))
        .filter((f): f is ConfigField => f !== undefined);
    }
    // Fallback: first 3 non-textarea fields for nodes without an explicit list
    return def.configFields.filter((f) => f.type !== "textarea").slice(0, 3);
  }, [def, node.type]);

  const handleLabelChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      onUpdate(node.id, { label: e.target.value });
    },
    [node.id, onUpdate]
  );

  const handleConfigChange = useCallback(
    (key: string, value: string) => {
      const updates: Record<string, string> = { [key]: value };
      // Mirror the provider→model auto-switch from NodeConfigPanel
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
      onUpdate(node.id, { config: { ...node.config, ...updates } });
    },
    [node.id, node.type, node.config, onUpdate]
  );

  const stopProp = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
  }, []);

  return (
    <div
      className={`wf-inline-details ${expanded ? "expanded" : "collapsed"}`}
      style={{ ["--wf-node-color" as string]: color }}
      onMouseDown={stopProp}
      onClick={stopProp}
    >
      {/* Header: editable label + Advanced button */}
      <div className="wf-inline-header">
        <input
          className="wf-inline-label-input"
          value={node.label}
          onChange={handleLabelChange}
          placeholder="Node label"
          aria-label="Node label"
          onMouseDown={stopProp}
          onClick={stopProp}
        />
        <button
          type="button"
          className="wf-inline-advanced-btn"
          onClick={() => onOpenAdvanced(node.id)}
        >
          Advanced
        </button>
      </div>

      {/* Type badge + description */}
      <div className="wf-inline-meta">
        <span className="wf-inline-type-badge">{def?.label ?? node.type}</span>
        <p className="wf-inline-description">{def?.description ?? "No description available."}</p>
      </div>

      {/* Editable quick-edit config fields */}
      {inlineFields.length > 0 && (
        <div className="wf-inline-fields">
          {inlineFields.map((field) => {
            const value = (node.config[field.key] as string) ?? "";
            const id = `inline-${node.id}-${field.key}`;
            return (
              <div key={field.key} className="wf-inline-field-row">
                <label className="wf-inline-field-label" htmlFor={id}>
                  {field.label}
                </label>
                {field.type === "select" ? (
                  <select
                    id={id}
                    className="wf-inline-field-select"
                    value={value}
                    onChange={(e) => handleConfigChange(field.key, e.target.value)}
                    aria-label={field.label}
                    onMouseDown={stopProp}
                  >
                    {field.options?.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                ) : field.type === "textarea" ? (
                  <textarea
                    id={id}
                    className="wf-inline-field-textarea"
                    value={value}
                    onChange={(e) => handleConfigChange(field.key, e.target.value)}
                    placeholder={field.placeholder}
                    rows={3}
                    aria-label={field.label}
                    onMouseDown={stopProp}
                    onClick={stopProp}
                  />
                ) : (
                  <input
                    id={id}
                    className="wf-inline-field-input"
                    type={field.type === "number" ? "number" : "text"}
                    value={value}
                    onChange={(e) => handleConfigChange(field.key, e.target.value)}
                    placeholder={field.placeholder}
                    aria-label={field.label}
                    onMouseDown={stopProp}
                    onClick={stopProp}
                  />
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* I/O connections */}
      <div className="wf-inline-io-grid">
        <div className="wf-inline-io-block">
          <span className="wf-inline-io-label">Inputs</span>
          <span className="wf-inline-io-value">
            {incomingLabels.length === 0 ? "None" : incomingLabels.slice(0, 2).join(", ")}
            {incomingLabels.length > 2 ? ` +${incomingLabels.length - 2}` : ""}
          </span>
        </div>
        <div className="wf-inline-io-block">
          <span className="wf-inline-io-label">Outputs</span>
          <span className="wf-inline-io-value">
            {outgoingLabels.length === 0 ? "None" : outgoingLabels.slice(0, 2).join(", ")}
            {outgoingLabels.length > 2 ? ` +${outgoingLabels.length - 2}` : ""}
          </span>
        </div>
      </div>
    </div>
  );
}
