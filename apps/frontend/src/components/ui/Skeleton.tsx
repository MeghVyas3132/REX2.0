import React from "react";

type SkeletonProps = {
  width?: string;
  height?: string;
  count?: number;
};

export function Skeleton({ width = "100%", height = "1rem", count = 1 }: SkeletonProps) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          style={{
            width,
            height,
            backgroundColor: "var(--border)",
            borderRadius: "0.5rem",
            animation: "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
          }}
        />
      ))}
    </div>
  );
}

// Note: Add to globals.css to enable the pulse animation:
// @keyframes pulse {
//   0%, 100% { opacity: 1; }
//   50% { opacity: 0.5; }
// }
