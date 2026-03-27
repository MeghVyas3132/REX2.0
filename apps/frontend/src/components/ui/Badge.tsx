"use client";

import React from "react";

export type BadgeVariant = "default" | "success" | "warning" | "danger";

export type BadgeProps = React.HTMLAttributes<HTMLSpanElement> & {
  variant?: BadgeVariant;
  children: React.ReactNode;
};

const variantStyles: Record<BadgeVariant, { bg: string; color: string }> = {
  default: { bg: "var(--background-secondary)", color: "var(--text-secondary)" },
  success: { bg: "#d1fae5", color: "#065f46" },
  warning: { bg: "#fef3c7", color: "#92400e" },
  danger: { bg: "#fee2e2", color: "#991b1b" },
};

export function Badge({ variant = "default", children, ...props }: BadgeProps) {
  const style = variantStyles[variant];

  return (
    <span
      {...props}
      style={{
        display: "inline-block",
        padding: "0.25rem 0.75rem",
        borderRadius: "0.25rem",
        fontSize: "0.75rem",
        fontWeight: 600,
        backgroundColor: style.bg,
        color: style.color,
        ...props.style,
      }}
    >
      {children}
    </span>
  );
}
