"use client";

import React, { useState } from "react";

type AlertBannerProps = {
  message: string;
  type?: "info" | "success" | "warning" | "error";
  dismissible?: boolean;
  icon?: string;
};

const typeConfig = {
  info: { bg: "rgba(59, 130, 246, 0.1)", border: "#3b82f6", text: "#1e40af", icon: "ℹ️" },
  success: { bg: "rgba(16, 185, 129, 0.1)", border: "#10b981", text: "#065f46", icon: "✓" },
  warning: { bg: "rgba(245, 158, 11, 0.1)", border: "#f59e0b", text: "#92400e", icon: "⚠" },
  error: { bg: "rgba(239, 68, 68, 0.1)", border: "#ef4444", text: "#7f1d1d", icon: "✕" },
};

export function AlertBanner({ message, type = "info", dismissible = true, icon }: AlertBannerProps) {
  const [isDismissed, setIsDismissed] = useState(false);
  const config = typeConfig[type];
  const displayIcon = icon || config.icon;

  if (isDismissed) return null;

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "0.75rem",
        padding: "0.75rem 1rem",
        borderRadius: "0.5rem",
        backgroundColor: config.bg,
        border: `1px solid ${config.border}`,
        color: config.text,
        fontSize: "0.875rem",
      }}
    >
      <span style={{ fontSize: "1rem" }}>{displayIcon}</span>
      <p style={{ margin: 0, flex: 1 }}>{message}</p>
      {dismissible && (
        <button
          onClick={() => setIsDismissed(true)}
          style={{
            border: "none",
            background: "none",
            cursor: "pointer",
            color: "inherit",
            padding: "0.25rem",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          ✕
        </button>
      )}
    </div>
  );
}
