import React, { InputHTMLAttributes } from "react";

type SearchFieldProps = InputHTMLAttributes<HTMLInputElement> & {
  onSearch?: (query: string) => void;
};

export function SearchField({ onSearch, className, ...props }: SearchFieldProps) {
  return (
    <div style={{ position: "relative" }}>
      <input
        type="text"
        placeholder="Search..."
        onChange={(e) => onSearch?.(e.target.value)}
        className={className}
        style={{
          width: "100%",
          padding: "0.75rem 1rem 0.75rem 2.5rem",
          border: "1px solid var(--border)",
          borderRadius: "0.5rem",
          fontSize: "0.875rem",
        }}
        {...props}
      />
      <span style={{ position: "absolute", left: "0.75rem", top: "50%", transform: "translateY(-50%)" }}>
        🔍
      </span>
    </div>
  );
}
