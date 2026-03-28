"use client";

import React from "react";
import { Button } from "./Button";

export type ActionGroup = {
  label: string;
  icon?: string;
  onClick: () => void | Promise<void>;
  variant?: ButtonVariant;
  disabled?: boolean;
  loading?: boolean;
};

export type ActionButtonGroupProps = {
  actions: ActionGroup[];
  isLoading?: boolean;
  className?: string;
};

export function ActionButtonGroup({ actions, isLoading = false, className }: ActionButtonGroupProps) {
  return (
    <div className={className ? `action-button-group ${className}` : "action-button-group"} style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
      {actions.map((action, idx) => {
        const baseVariant = action.variant ?? "secondary";
        // Handle backward compatibility: map "ghost" variant to "secondary"
        const safeVariant = baseVariant === ("ghost" as any) ? "secondary" : baseVariant;
        return (
          <Button
            key={idx}
            className="action-button-group-item"
            variant={safeVariant}
            onClick={action.onClick}
            disabled={action.disabled || action.loading || isLoading}
          >
            {action.loading && "⏳ "}
            {action.icon && `${action.icon} `}
            {action.label}
          </Button>
        );
      })}
    </div>
  );
}

type ButtonVariant = "primary" | "secondary" | "danger";

export type PageHeaderWithActionsProps = {
  title: string;
  subtitle?: string;
  actions?: ActionGroup[];
  isLoading?: boolean;
};

export function PageHeaderWithActions({
  title,
  subtitle,
  actions = [],
  isLoading = false,
}: PageHeaderWithActionsProps) {
  return (
    <div
      className="page-header-with-actions"
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "flex-start",
        gap: "1rem",
        marginBottom: "2rem",
        padding: "1.5rem",
        borderBottom: "1px solid var(--border)",
      }}
    >
      <div className="page-header-with-actions-heading">
        <h1 style={{ margin: "0 0 0.5rem 0" }}>{title}</h1>
        {subtitle && (
          <p className="page-header-with-actions-subtitle" style={{ margin: "0", color: "var(--text-secondary)", fontSize: "0.875rem" }}>
            {subtitle}
          </p>
        )}
      </div>
      {actions.length > 0 && <ActionButtonGroup className="page-header-with-actions-buttons" actions={actions} isLoading={isLoading} />}
    </div>
  );
}
