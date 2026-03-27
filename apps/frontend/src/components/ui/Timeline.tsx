import React from "react";

type TimelineItem = {
  id: string;
  title: string;
  description?: string;
  status?: "success" | "error" | "pending" | "skipped";
  timestamp?: string;
};

const statusColors = {
  success: { dot: "#10b981", label: "✓" },
  error: { dot: "#ef4444", label: "✕" },
  pending: { dot: "#f59e0b", label: "⏳" },
  skipped: { dot: "#6b7280", label: "-" },
};

type TimelineProps = {
  items: TimelineItem[];
};

export function Timeline({ items }: TimelineProps) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      {items.map((item, index) => {
        const color = statusColors[item.status || "pending"];
        return (
          <div key={item.id} style={{ display: "flex", gap: "1rem" }}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
              <div
                style={{
                  width: "2rem",
                  height: "2rem",
                  borderRadius: "999px",
                  backgroundColor: color.dot,
                  color: "#fff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "1rem",
                  fontWeight: 600,
                }}
              >
                {color.label}
              </div>
              {index < items.length - 1 && (
                <div style={{ width: "2px", height: "3rem", backgroundColor: "var(--border)", margin: "0.5rem 0" }} />
              )}
            </div>
            <div style={{ flex: 1, paddingTop: "0.25rem" }}>
              <h4 style={{ margin: "0 0 0.25rem 0", fontSize: "0.875rem", fontWeight: 600 }}>{item.title}</h4>
              {item.description && <p style={{ margin: "0.25rem 0 0 0", fontSize: "0.75rem", color: "var(--text-secondary)" }}>{item.description}</p>}
              {item.timestamp && <time style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>{item.timestamp}</time>}
            </div>
          </div>
        );
      })}
    </div>
  );
}
