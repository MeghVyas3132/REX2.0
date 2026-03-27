"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { usePluginsQuery } from "@/features/plugins/queries";
import type { Plugin } from "@rex/types";

type TenantNodeAccessModalProps = {
  tenant: {
    id: string;
    name: string;
    allowedPluginSlugs?: string[];
  };
  onClose: () => void;
  onSave: (pluginSlugs: string[]) => Promise<void>;
};

export function TenantNodeAccessModal({ tenant, onClose, onSave }: TenantNodeAccessModalProps) {
  const { data: plugins, isLoading } = usePluginsQuery();
  const [selectedSlugs, setSelectedSlugs] = useState<Set<string>>(
    new Set(tenant.allowedPluginSlugs || [])
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    setSelectedSlugs(new Set(tenant.allowedPluginSlugs || []));
  }, [tenant]);

  const handleToggle = (slug: string) => {
    setSelectedSlugs((prev) => {
      const next = new Set(prev);
      if (next.has(slug)) {
        next.delete(slug);
      } else {
        next.add(slug);
      }
      return next;
    });
  };

  const handleSelectAll = () => {
    if (plugins) {
      setSelectedSlugs(new Set(plugins.map((p) => p.slug)));
    }
  };

  const handleDeselectAll = () => {
    setSelectedSlugs(new Set());
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      await onSave(Array.from(selectedSlugs));
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update node access");
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredPlugins = plugins?.filter((p) =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.slug.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.category.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const groupedByCategory = filteredPlugins.reduce((acc, plugin) => {
    const cat = plugin.category || "uncategorized";
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(plugin);
    return acc;
  }, {} as Record<string, Plugin[]>);

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
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: "white",
          borderRadius: "8px",
          padding: "24px",
          maxWidth: "700px",
          width: "90%",
          maxHeight: "90vh",
          overflowY: "auto",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <Card title={`Node Access: ${tenant.name}`}>
          <form onSubmit={handleSubmit} style={{ display: "grid", gap: "16px" }}>
            {error && (
              <div style={{ padding: "12px", background: "#fee", border: "1px solid #fcc", borderRadius: "4px", color: "#c00" }}>
                {error}
              </div>
            )}

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <strong>{selectedSlugs.size}</strong> nodes selected
              </div>
              <div style={{ display: "flex", gap: "8px" }}>
                <Button type="button" variant="secondary" onClick={handleSelectAll} disabled={isLoading}>
                  Select All
                </Button>
                <Button type="button" variant="secondary" onClick={handleDeselectAll}>
                  Deselect All
                </Button>
              </div>
            </div>

            <input
              type="text"
              placeholder="Search nodes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: "100%",
                padding: "8px 12px",
                borderRadius: "6px",
                border: "1px solid var(--border-default)",
                fontSize: "14px",
              }}
            />

            {isLoading ? (
              <div style={{ padding: "20px", textAlign: "center" }}>Loading nodes...</div>
            ) : (
              <div style={{ maxHeight: "400px", overflowY: "auto", border: "1px solid #ddd", borderRadius: "4px", padding: "12px" }}>
                {Object.entries(groupedByCategory).map(([category, categoryPlugins]) => (
                  <div key={category} style={{ marginBottom: "16px" }}>
                    <h4 style={{ fontSize: "13px", fontWeight: 600, marginBottom: "8px", textTransform: "uppercase", color: "#666" }}>
                      {category}
                    </h4>
                    <div style={{ display: "grid", gap: "6px" }}>
                      {categoryPlugins.map((plugin) => (
                        <label
                          key={plugin.slug}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                            padding: "8px",
                            borderRadius: "4px",
                            cursor: "pointer",
                            background: selectedSlugs.has(plugin.slug) ? "#e3f2fd" : "transparent",
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={selectedSlugs.has(plugin.slug)}
                            onChange={() => handleToggle(plugin.slug)}
                          />
                          <div style={{ flex: 1 }}>
                            <div style={{ fontWeight: 500, fontSize: "14px" }}>{plugin.name}</div>
                            <div style={{ fontSize: "12px", color: "#666" }}>{plugin.slug}</div>
                          </div>
                          {plugin.technicalLevel === "basic" && (
                            <span style={{
                              padding: "2px 6px",
                              fontSize: "10px",
                              borderRadius: "3px",
                              background: "#d4edda",
                              color: "#155724",
                            }}>
                              BASIC
                            </span>
                          )}
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end", marginTop: "8px" }}>
              <Button type="button" variant="secondary" onClick={onClose} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button type="submit" loading={isSubmitting}>
                Save Node Access
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
}
