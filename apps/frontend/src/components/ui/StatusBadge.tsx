import React from "react";

type StatusBadgeProps = {
  status: "success" | "error" | "warning" | "info" | "pending";
  label: string;
};

const statusStyles = {
  success: { bg: "#ecfdf5", text: "#065f46", border: "#a7f3d0" },
  error: { bg: "#fef2f2", text: "#991b1b", border: "#fecaca" },
  warning: { bg: "#fefce8", text: "#854d0e", border: "#fde047" },
  info: { bg: "#ecfdf5", text: "#0e7490", border: "#a7f3d0" },
  pending: { bg: "#f3f4f6", text: "#374151", border: "#d1d5db" },
};

export function StatusBadge({ status, label }: StatusBadgeProps) {
  const style = statusStyles[status];
  return (
    <span
      style={{
        display: "inline-block",
        padding: "0.25rem 0.75rem",
        borderRadius: "999px",
        fontSize: "0.75rem",
        fontWeight: 600,
        backgroundColor: style.bg,
        color: style.text,
        border: `1px solid ${style.border}`,
      }}
    >
      {label}
    </span>
  );
}
