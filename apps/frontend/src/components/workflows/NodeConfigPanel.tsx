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
      <div className="node-config-grid">
        <div className="form-row">
          <label className="form-label">
            Node ID
          </label>
          <Input value={nodeId} disabled />
        </div>

        {Object.keys(properties).length === 0 && (
          <div className="node-config-empty">
            No configuration options available for this node.
          </div>
        )}

        {Object.entries(properties).map(([key, prop]) => {
          const isRequired = requiredFields.includes(key);
          const value = config[key];

          return (
            <div key={key} className="form-row">
              <label className="form-label">
                {key}
                {isRequired && <span className="error-text"> *</span>}
              </label>
              {prop.description && (
                <p className="node-config-description">
                  {prop.description}
                </p>
              )}

              {prop.enum ? (
                <select
                  value={String(value || prop.default || "")}
                  onChange={(e) => handleChange(key, e.target.value)}
                  className="select"
                >
                  <option value="">Select...</option>
                  {prop.enum.map((option) => (
                    <option key={String(option)} value={String(option)}>
                      {String(option)}
                    </option>
                  ))}
                </select>
              ) : prop.type === "boolean" ? (
                <label className="node-config-checkbox">
                  <input
                    type="checkbox"
                    checked={Boolean(value ?? prop.default ?? false)}
                    onChange={(e) => handleChange(key, e.target.checked)}
                  />
                  <span>Enable</span>
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

        <div className="node-config-actions">
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
