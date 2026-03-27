import React from "react";

type EmptyStateProps = {
  title: string;
  description?: string;
  icon?: string;
  action?: React.ReactNode;
};

export function EmptyState({ title, description, icon = "📭", action }: EmptyStateProps) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "3rem 1rem",
        textAlign: "center",
        color: "var(--text-secondary)",
        gap: "1rem",
      }}
    >
      <span style={{ fontSize: "3rem" }}>{icon}</span>
      <div>
        <h3 style={{ margin: "0.5rem 0", color: "var(--text)" }}>{title}</h3>
        {description && <p style={{ margin: "0.5rem 0", fontSize: "0.875rem" }}>{description}</p>}
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}
