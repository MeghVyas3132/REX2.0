import React, { TextareaHTMLAttributes } from "react";

type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label?: string;
  error?: string;
};

export function Textarea({ label, error, className, ...props }: TextareaProps) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
      {label && <label style={{ fontSize: "0.875rem", fontWeight: 500 }}>{label}</label>}
      <textarea
        className={className}
        style={{
          width: "100%",
          padding: "0.75rem",
          border: error ? "1px solid var(--danger)" : "1px solid var(--border)",
          borderRadius: "0.5rem",
          fontFamily: "inherit",
          fontSize: "0.875rem",
          minHeight: "100px",
          resize: "vertical",
        }}
        {...props}
      />
      {error && <span style={{ fontSize: "0.75rem", color: "var(--danger)" }}>{error}</span>}
    </div>
  );
}
