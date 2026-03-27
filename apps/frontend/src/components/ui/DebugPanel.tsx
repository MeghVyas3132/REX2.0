"use client";

import React, { useState } from "react";
import { CodeBlock } from "./CodeBlock";

type DebugPanelProps = {
  data?: Record<string, unknown>;
  title?: string;
  defaultOpen?: boolean;
};

export function DebugPanel({ data = {}, title = "Debug Info", defaultOpen = false }: DebugPanelProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const jsonString = JSON.stringify(data, null, 2);

  return (
    <div
      style={{
        marginTop: "1rem",
        padding: "1rem",
        border: "1px solid #fbbf24",
        borderRadius: "0.5rem",
        backgroundColor: "rgba(251, 191, 36, 0.05)",
      }}
      className="card"
    >
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          width: "100%",
          padding: "0.75rem",
          border: "none",
          backgroundColor: "transparent",
          cursor: "pointer",
          textAlign: "left",
          fontWeight: 600,
          fontSize: "0.875rem",
          color: "var(--text)",
        }}
      >
        {isOpen ? "▼" : "▶"} {title}
      </button>
      {isOpen && <CodeBlock code={jsonString} />}
    </div>
  );
}
