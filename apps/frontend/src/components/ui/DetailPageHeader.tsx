"use client";

import React from "react";
import { Button } from "./Button";
import { Badge } from "./Badge";

export type DetailPageAction = {
  label: string;
  icon?: string;
  onClick: () => void | Promise<void>;
  variant?: "primary" | "secondary" | "danger";
  disabled?: boolean;
  loading?: boolean;
};

export type DetailPageHeaderProps = {
  title: string;
  subtitle?: string;
  status?: { label: string; variant: "default" | "success" | "warning" | "danger" };
  actions: DetailPageAction[];
  backButton?: boolean;
  onBack?: () => void;
};

export function DetailPageHeader({
  title,
  subtitle,
  status,
  actions,
  backButton = true,
  onBack,
}: DetailPageHeaderProps) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "1rem",
        paddingBottom: "1.5rem",
        borderBottom: "1px solid var(--border)",
        marginBottom: "2rem",
      }}
    >
      {backButton && (
        <Button variant="secondary" onClick={onBack} style={{ width: "fit-content" }}>
          ← Back
        </Button>
      )}

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <h1 style={{ margin: 0, marginBottom: "0.5rem" }}>{title}</h1>
          {subtitle && (
            <p style={{ margin: 0, fontSize: "0.875rem", color: "var(--text-secondary)" }}>
              {subtitle}
            </p>
          )}
        </div>
        {status && (
          <Badge variant={status.variant} style={{ whiteSpace: "nowrap" }}>
            {status.label}
          </Badge>
        )}
      </div>

      {actions.length > 0 && (
        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
          {actions.map((action, idx) => (
            <Button
              key={idx}
              variant={action.variant || "secondary"}
              onClick={action.onClick}
              disabled={action.disabled || action.loading}
            >
              {action.loading && "⏳ "}
              {action.icon && `${action.icon} `}
              {action.label}
            </Button>
          ))}
        </div>
      )}
    </div>
  );
}
