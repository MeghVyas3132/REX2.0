import React from "react";

type CodeBlockProps = {
  code: string;
};

export function CodeBlock({ code }: CodeBlockProps) {
  return (
    <pre
      style={{
        backgroundColor: "var(--bg)",
        border: "1px solid var(--border)",
        borderRadius: "0.5rem",
        padding: "1rem",
        overflow: "auto",
        fontSize: "0.875rem",
        fontFamily: "monospace",
        margin: 0,
      }}
    >
      <code>{code}</code>
    </pre>
  );
}
