"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Card } from "@/components/ui/Card";

type PluginFormModalProps = {
  plugin?: {
    id: string;
    slug: string;
    name: string;
    description: string;
    category: string;
    version: string;
    technicalLevel: string;
    manifest: any;
  };
  onClose: () => void;
  onSave: (data: any) => Promise<void>;
};

export function PluginFormModal({ plugin, onClose, onSave }: PluginFormModalProps) {
  const [formData, setFormData] = useState({
    slug: plugin?.slug || "",
    name: plugin?.name || "",
    description: plugin?.description || "",
    category: plugin?.category || "logic_control",
    version: plugin?.version || "1.0.0",
    technicalLevel: plugin?.technicalLevel || "advanced",
    manifest: JSON.stringify(plugin?.manifest || {
      inputs: [],
      outputs: [],
      configSchema: {
        type: "object",
        properties: {}
      }
    }, null, 2),
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const manifest = JSON.parse(formData.manifest);
      await onSave({
        ...formData,
        manifest,
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save plugin");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: "rgba(0,0,0,0.5)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
        overflowY: "auto",
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: "white",
          borderRadius: "8px",
          padding: "24px",
          maxWidth: "800px",
          width: "90%",
          maxHeight: "90vh",
          overflowY: "auto",
          margin: "20px",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <Card title={plugin ? `Edit Plugin: ${plugin.name}` : "Create New Plugin"}>
          <form onSubmit={handleSubmit} style={{ display: "grid", gap: "16px" }}>
            {error && (
              <div style={{ padding: "12px", background: "#fee", border: "1px solid #fcc", borderRadius: "4px", color: "#c00" }}>
                {error}
              </div>
            )}

            <div>
              <label style={{ display: "block", fontWeight: 600, marginBottom: "6px" }}>Slug *</label>
              <Input
                value={formData.slug}
                onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                placeholder="my-custom-node"
                required
                disabled={!!plugin}
              />
              <p style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "4px" }}>
                Unique identifier (lowercase, hyphens only)
              </p>
            </div>

            <div>
              <label style={{ display: "block", fontWeight: 600, marginBottom: "6px" }}>Name *</label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="My Custom Node"
                required
              />
            </div>

            <div>
              <label style={{ display: "block", fontWeight: 600, marginBottom: "6px" }}>Description</label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="What does this node do?"
                rows={3}
              />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "12px" }}>
              <div>
                <label style={{ display: "block", fontWeight: 600, marginBottom: "6px" }}>Category *</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  style={{
                    width: "100%",
                    padding: "8px 12px",
                    borderRadius: "6px",
                    border: "1px solid var(--border-default)",
                    fontSize: "14px",
                  }}
                >
                  <option value="ai_llm">AI/LLM</option>
                  <option value="data_storage">Data Storage</option>
                  <option value="communication">Communication</option>
                  <option value="business_crm">Business/CRM</option>
                  <option value="logic_control">Logic/Control</option>
                  <option value="trigger">Trigger</option>
                  <option value="compliance_rex">Compliance/REX</option>
                  <option value="developer">Developer</option>
                </select>
              </div>

              <div>
                <label style={{ display: "block", fontWeight: 600, marginBottom: "6px" }}>Version *</label>
                <Input
                  value={formData.version}
                  onChange={(e) => setFormData({ ...formData, version: e.target.value })}
                  placeholder="1.0.0"
                  required
                />
              </div>

              <div>
                <label style={{ display: "block", fontWeight: 600, marginBottom: "6px" }}>Technical Level *</label>
                <select
                  value={formData.technicalLevel}
                  onChange={(e) => setFormData({ ...formData, technicalLevel: e.target.value })}
                  style={{
                    width: "100%",
                    padding: "8px 12px",
                    borderRadius: "6px",
                    border: "1px solid var(--border-default)",
                    fontSize: "14px",
                  }}
                >
                  <option value="basic">Basic (Business users)</option>
                  <option value="advanced">Advanced (Studio only)</option>
                </select>
              </div>
            </div>

            <div>
              <label style={{ display: "block", fontWeight: 600, marginBottom: "6px" }}>Manifest (JSON) *</label>
              <Textarea
                value={formData.manifest}
                onChange={(e) => setFormData({ ...formData, manifest: e.target.value })}
                rows={12}
                style={{ fontFamily: "monospace", fontSize: "12px" }}
              />
              <p style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "4px" }}>
                Define inputs, outputs, and config schema
              </p>
            </div>

            <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end", marginTop: "8px" }}>
              <Button type="button" variant="secondary" onClick={onClose} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button type="submit" loading={isSubmitting}>
                {plugin ? "Update Plugin" : "Create Plugin"}
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
}
