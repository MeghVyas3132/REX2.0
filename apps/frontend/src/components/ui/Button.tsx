"use client";

import type { ButtonHTMLAttributes, ReactNode } from "react";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
type ButtonSize = "sm" | "md" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  leadingIcon?: ReactNode;
}

const variantStyles: Record<ButtonVariant, React.CSSProperties> = {
  primary: {
    backgroundColor: "var(--accent-500)",
    color: "var(--text-on-accent)",
    border: "1px solid var(--accent-500)",
  },
  secondary: {
    backgroundColor: "var(--surface-2)",
    color: "var(--text-primary)",
    border: "1px solid var(--border-strong)",
  },
  ghost: {
    backgroundColor: "transparent",
    color: "var(--text-secondary)",
    border: "1px solid var(--border-muted)",
  },
  danger: {
    backgroundColor: "rgba(228, 72, 92, 0.12)",
    color: "var(--status-error)",
    border: "1px solid rgba(228, 72, 92, 0.3)",
  },
};

const sizeStyles: Record<ButtonSize, React.CSSProperties> = {
  sm: { height: 32, padding: "0 10px", fontSize: 12 },
  md: { height: 38, padding: "0 14px", fontSize: 13 },
  lg: { height: 44, padding: "0 16px", fontSize: 14 },
};

export function Button({
  variant = "secondary",
  size = "md",
  leadingIcon,
  style,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      {...props}
      style={{
        ...baseStyle,
        ...variantStyles[variant],
        ...sizeStyles[size],
        ...style,
      }}
    >
      {leadingIcon ? <span style={iconStyle}>{leadingIcon}</span> : null}
      <span>{children}</span>
    </button>
  );
}

const baseStyle: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 8,
  borderRadius: 10,
  fontWeight: 600,
  letterSpacing: "0.01em",
  cursor: "pointer",
  transition: "all var(--motion-fast)",
};

const iconStyle: React.CSSProperties = {
  width: 14,
  height: 14,
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
};
