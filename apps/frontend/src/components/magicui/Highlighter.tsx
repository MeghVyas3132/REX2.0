"use client";

import { ReactNode } from "react";

type HighlighterProps = {
  children: ReactNode;
  color?: string;
  strokeWidth?: number;
  animationDuration?: number;
  className?: string;
};

export function Highlighter({
  children,
  color = "var(--blue)",
  strokeWidth = 1.2,
  animationDuration = 800,
  className,
}: HighlighterProps) {
  return (
    <span
      className={`rx-highlighter ${className || ""}`.trim()}
      style={{
        ["--rx-highlight-color" as string]: color,
        ["--rx-highlight-stroke" as string]: `${strokeWidth}px`,
        ["--rx-highlight-duration" as string]: `${animationDuration}ms`,
      }}
    >
      {children}
    </span>
  );
}
