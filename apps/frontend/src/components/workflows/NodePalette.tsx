"use client";

import { useState, useMemo } from "react";
import { Input } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";
import { usePluginsQuery } from "@/features/plugins/queries";
import { setDraggedPlugin } from "./WorkflowCanvas";
import type { Plugin } from "@rex/types";

type NodePaletteProps = {
  interfaceAccess?: "business" | "studio" | "both";
};

export function NodePalette({ interfaceAccess = "studio" }: NodePaletteProps) {
  const pluginsQuery = usePluginsQuery();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const filteredPlugins = useMemo(() => {
    if (!pluginsQuery.data) return [];

    let plugins = pluginsQuery.data;

    // Filter by technical level based on interface access
    if (interfaceAccess === "business") {
      plugins = plugins.filter((p) => p.technicalLevel === "basic");
    }

    // Filter by search term
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      plugins = plugins.filter(
        (p) =>
          p.name.toLowerCase().includes(term) ||
          p.description?.toLowerCase().includes(term) ||
          p.category.toLowerCase().includes(term)
      );
    }

    // Filter by category
    if (selectedCategory) {
      plugins = plugins.filter((p) => p.category === selectedCategory);
    }

    // Sort by category, then name
    return plugins.sort((a, b) => {
      if (a.category !== b.category) {
        return a.category.localeCompare(b.category);
      }
      return a.name.localeCompare(b.name);
    });
  }, [pluginsQuery.data, searchTerm, selectedCategory, interfaceAccess]);

  const categories = useMemo(() => {
    if (!pluginsQuery.data) return [];
    const cats = new Set(pluginsQuery.data.map((p) => p.category));
    return Array.from(cats).sort();
  }, [pluginsQuery.data]);

  const groupedPlugins = useMemo(() => {
    const groups: Record<string, Plugin[]> = {};
    for (const plugin of filteredPlugins) {
      const category = plugin.category || "uncategorized";
      if (!groups[category]) {
        groups[category] = [];
      }
      groups[category].push(plugin);
    }
    return groups;
  }, [filteredPlugins]);

  const handleDragStart = (plugin: Plugin) => {
    setDraggedPlugin(plugin);
  };

  const handleDragEnd = () => {
    setDraggedPlugin(null);
  };

  if (pluginsQuery.isLoading) {
    return (
      <Card title="Node Palette" className="h-full overflow-y-auto">
        <div>Loading nodes...</div>
      </Card>
    );
  }

  if (pluginsQuery.isError) {
    return (
      <Card title="Node Palette" className="h-full overflow-y-auto">
        <div style={{ color: "var(--error-text)" }}>Failed to load nodes</div>
      </Card>
    );
  }

  return (
    <Card title="Node Palette" className="h-full flex flex-col">
      <div style={{ padding: "12px", borderBottom: "1px solid var(--border-default)" }}>
        <Input
          placeholder="Search nodes..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <div style={{ marginTop: "8px", display: "flex", gap: "8px", flexWrap: "wrap" }}>
          <button
            onClick={() => setSelectedCategory(null)}
            style={{
              padding: "4px 8px",
              fontSize: "12px",
              borderRadius: "4px",
              border: "1px solid var(--border-default)",
              background: selectedCategory === null ? "var(--primary-bg)" : "transparent",
              color: selectedCategory === null ? "var(--primary-text)" : "var(--text-default)",
              cursor: "pointer",
            }}
          >
            All
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              style={{
                padding: "4px 8px",
                fontSize: "12px",
                borderRadius: "4px",
                border: "1px solid var(--border-default)",
                background: selectedCategory === cat ? "var(--primary-bg)" : "transparent",
                color: selectedCategory === cat ? "var(--primary-text)" : "var(--text-default)",
                cursor: "pointer",
              }}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: "12px" }}>
        {Object.keys(groupedPlugins).length === 0 && (
          <div style={{ textAlign: "center", color: "var(--text-muted)" }}>
            No nodes found
          </div>
        )}

        {Object.entries(groupedPlugins).map(([category, plugins]) => (
          <div key={category} style={{ marginBottom: "16px" }}>
            <h3
              style={{
                fontSize: "14px",
                fontWeight: 600,
                marginBottom: "8px",
                color: "var(--text-muted)",
                textTransform: "uppercase",
              }}
            >
              {category}
            </h3>
            <div style={{ display: "grid", gap: "8px" }}>
              {plugins.map((plugin) => (
                <div
                  key={plugin.slug}
                  draggable
                  onDragStart={() => handleDragStart(plugin)}
                  onDragEnd={handleDragEnd}
                  style={{
                    padding: "12px",
                    borderRadius: "8px",
                    border: "1px solid var(--border-default)",
                    background: "var(--surface-raised)",
                    cursor: "grab",
                    transition: "all 0.2s",
                  }}
                  onMouseDown={(e) => {
                    e.currentTarget.style.cursor = "grabbing";
                  }}
                  onMouseUp={(e) => {
                    e.currentTarget.style.cursor = "grab";
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      marginBottom: "4px",
                    }}
                  >
                    {plugin.icon && (
                      <span style={{ fontSize: "18px" }}>{plugin.icon}</span>
                    )}
                    <span
                      style={{
                        fontWeight: 600,
                        fontSize: "14px",
                        color: "var(--text-default)",
                      }}
                    >
                      {plugin.name}
                    </span>
                  </div>
                  {plugin.description && (
                    <div
                      style={{
                        fontSize: "12px",
                        color: "var(--text-muted)",
                        marginTop: "4px",
                      }}
                    >
                      {plugin.description}
                    </div>
                  )}
                  {plugin.technicalLevel === "basic" && (
                    <div
                      style={{
                        marginTop: "8px",
                        display: "inline-block",
                        padding: "2px 8px",
                        fontSize: "10px",
                        fontWeight: 600,
                        borderRadius: "4px",
                        background: "var(--success-bg)",
                        color: "var(--success-text)",
                      }}
                    >
                      BUSINESS
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
