import React, { SelectHTMLAttributes } from "react";

type SelectProps = SelectHTMLAttributes<HTMLSelectElement> & {
  label?: string;
  error?: string;
  options: Array<{ value: string; label: string }>;
};

export function Select({ label, error, options, className, ...props }: SelectProps) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
      {label && <label style={{ fontSize: "0.875rem", fontWeight: 500 }}>{label}</label>}
      <select
        className={className}
        style={{
          width: "100%",
          padding: "0.75rem",
          border: error ? "1px solid var(--danger)" : "1px solid var(--border)",
          borderRadius: "0.5rem",
          fontFamily: "inherit",
          fontSize: "0.875rem",
        }}
        {...props}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {error && <span style={{ fontSize: "0.75rem", color: "var(--danger)" }}>{error}</span>}
    </div>
  );
}
