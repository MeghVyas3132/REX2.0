"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Button } from "@/components/ui/Button";

type NodeConfigPanelProps = {
  nodeId: string;
  nodeType: string;
  config: Record<string, unknown>;
  manifest?: {
    configSchema?: {
      type: string;
      properties?: Record<string, {
        type: string;
        description?: string;
        default?: unknown;
        enum?: unknown[];
      }>;
      required?: string[];
    };
  };
  onSave: (config: Record<string, unknown>) => void;
  onClose: () => void;
};

export function NodeConfigPanel({
  nodeId,
  nodeType,
  config: initialConfig,
  manifest,
  onSave,
  onClose,
}: NodeConfigPanelProps) {
  const [config, setConfig] = useState<Record<string, unknown>>(initialConfig);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    setConfig(initialConfig);
    setHasChanges(false);
  }, [nodeId, initialConfig]);

  const handleChange = (key: string, value: unknown) => {
    setConfig((prev) => ({ ...prev, [key]: value }));
    setHasChanges(true);
  };

  const handleSave = () => {
    onSave(config);
    setHasChanges(false);
  };

  const schema = manifest?.configSchema;
  const properties = schema?.properties || {};
  const requiredFields = schema?.required || [];

  return (
    <Card title={`Configure: ${nodeType}`} className="mt-4">
      <div style={{ display: "grid", gap: "16px" }}>
        <div>
          <label style={{ display: "block", fontSize: "13px", fontWeight: 600, marginBottom: "4px" }}>
            Node ID
          </label>
          <Input value={nodeId} disabled />
        </div>

        {Object.keys(properties).length === 0 && (
          <div style={{ padding: "16px", textAlign: "center", color: "var(--text-muted)" }}>
            No configuration options available for this node.
          </div>
        )}

        {Object.entries(properties).map(([key, prop]) => {
          const isRequired = requiredFields.includes(key);
          const value = config[key];

          return (
            <div key={key}>
              <label
                style={{
                  display: "block",
                  fontSize: "13px",
                  fontWeight: 600,
                  marginBottom: "4px",
                }}
              >
                {key}
                {isRequired && <span style={{ color: "var(--error-text)" }}> *</span>}
              </label>
              {prop.description && (
                <p style={{ fontSize: "12px", color: "var(--text-muted)", marginBottom: "6px" }}>
                  {prop.description}
                </p>
              )}

              {prop.enum ? (
                <select
                  value={String(value || prop.default || "")}
                  onChange={(e) => handleChange(key, e.target.value)}
                  style={{
                    width: "100%",
                    padding: "8px 12px",
                    borderRadius: "6px",
                    border: "1px solid var(--border-default)",
                    fontSize: "14px",
                  }}
                >
                  <option value="">Select...</option>
                  {prop.enum.map((option) => (
                    <option key={String(option)} value={String(option)}>
                      {String(option)}
                    </option>
                  ))}
                </select>
              ) : prop.type === "boolean" ? (
                <label style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <input
                    type="checkbox"
                    checked={Boolean(value ?? prop.default ?? false)}
                    onChange={(e) => handleChange(key, e.target.checked)}
                  />
                  <span style={{ fontSize: "14px" }}>Enable</span>
                </label>
              ) : prop.type === "number" || prop.type === "integer" ? (
                <Input
                  type="number"
                  value={String(value ?? prop.default ?? "")}
                  onChange={(e) => handleChange(key, Number(e.target.value))}
                  placeholder={prop.default ? `Default: ${prop.default}` : ""}
                />
              ) : prop.type === "array" || prop.type === "object" ? (
                <Textarea
                  value={JSON.stringify(value ?? prop.default ?? (prop.type === "array" ? [] : {}), null, 2)}
                  onChange={(e) => {
                    try {
                      const parsed = JSON.parse(e.target.value);
                      handleChange(key, parsed);
                    } catch {
                      // Invalid JSON, don't update
                    }
                  }}
                  placeholder={`Enter JSON ${prop.type}`}
                  rows={4}
                />
              ) : (
                <Input
                  value={String(value ?? prop.default ?? "")}
                  onChange={(e) => handleChange(key, e.target.value)}
                  placeholder={prop.default ? `Default: ${prop.default}` : ""}
                />
              )}
            </div>
          );
        })}

        <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end", marginTop: "8px" }}>
          <Button variant="secondary" onClick={onClose}>
            Close
          </Button>
          <Button onClick={handleSave} disabled={!hasChanges}>
            {hasChanges ? "Save Changes" : "No Changes"}
          </Button>
        </div>
      </div>
    </Card>
  );
}
