import type { CSSProperties } from "react";

type BadgeTone = "neutral" | "success" | "warning" | "error" | "accent";

interface BadgeProps {
  tone?: BadgeTone;
  children: string;
}

const toneStyles: Record<BadgeTone, CSSProperties> = {
  neutral: {
    color: "var(--text-secondary)",
    borderColor: "var(--border-strong)",
    backgroundColor: "rgba(164, 176, 201, 0.08)",
  },
  success: {
    color: "var(--status-success)",
    borderColor: "rgba(52, 211, 153, 0.45)",
    backgroundColor: "rgba(52, 211, 153, 0.12)",
  },
  warning: {
    color: "var(--status-warning)",
    borderColor: "rgba(251, 191, 36, 0.45)",
    backgroundColor: "rgba(251, 191, 36, 0.12)",
  },
  error: {
    color: "var(--status-error)",
    borderColor: "rgba(228, 72, 92, 0.45)",
    backgroundColor: "rgba(228, 72, 92, 0.12)",
  },
  accent: {
    color: "var(--accent-500)",
    borderColor: "rgba(79, 120, 255, 0.45)",
    backgroundColor: "rgba(79, 120, 255, 0.12)",
  },
};

export function Badge({ tone = "neutral", children }: BadgeProps) {
  return <span style={{ ...baseStyle, ...toneStyles[tone] }}>{children}</span>;
}

const baseStyle: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  border: "1px solid",
  borderRadius: 999,
  padding: "3px 8px",
  fontSize: 11,
  fontWeight: 600,
  letterSpacing: "0.04em",
  textTransform: "uppercase",
};
