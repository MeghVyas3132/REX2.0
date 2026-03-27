import React from "react";

type InlineErrorProps = {
  message?: string;
};

export function InlineError({ message }: InlineErrorProps) {
  if (!message) return null;
  return (
    <div
      style={{
        padding: "0.75rem 1rem",
        backgroundColor: "#fef2f2",
        border: "1px solid #fecaca",
        borderRadius: "0.5rem",
        color: "#991b1b",
        fontSize: "0.875rem",
      }}
    >
      ⚠️ {message}
    </div>
  );
}
