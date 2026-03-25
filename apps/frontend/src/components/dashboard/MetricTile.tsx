import type { ReactNode } from "react";

interface MetricTileProps {
  label: string;
  value: ReactNode;
  hint: string;
  tone?: "blue" | "green" | "amber";
}

export function MetricTile({ label, value, hint, tone = "blue" }: MetricTileProps) {
  const toneClass =
    tone === "green"
      ? "#6ee7b7"
      : tone === "amber"
        ? "#fcd34d"
        : "#93c5fd";

  return (
    <article
      style={{
        borderRadius: "10px",
        border: "1px solid var(--border-muted)",
        background: "var(--surface-1)",
        boxShadow: "var(--shadow-1)",
        padding: "20px",
      }}
    >
      <h3 style={{ margin: "0 0 8px", fontSize: "14px", fontWeight: 600, color: "var(--text-primary)" }}>
        {label}
      </h3>
      <p style={{ margin: "0 0 8px", fontSize: "32px", fontWeight: 700, color: toneClass }}>{value}</p>
      <p style={{ margin: 0, fontSize: "12px", color: "var(--text-secondary)" }}>{hint}</p>
    </article>
  );
}
