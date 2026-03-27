import React, { InputHTMLAttributes } from "react";

type SwitchProps = InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
};

export function Switch({ label, checked, className, ...props }: SwitchProps) {
  return (
    <label style={{ display: "flex", alignItems: "center", gap: "0.75rem", cursor: "pointer" }}>
      <div
        style={{
          width: "3rem",
          height: "1.5rem",
          backgroundColor: checked ? "var(--primary)" : "var(--border)",
          borderRadius: "999px",
          position: "relative",
          transition: "background-color 0.2s",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: "0.25rem",
            left: checked ? "1.5rem" : "0.25rem",
            width: "1rem",
            height: "1rem",
            backgroundColor: "#fff",
            borderRadius: "999px",
            transition: "left 0.2s",
          }}
        />
      </div>
      <input type="checkbox" style={{ display: "none" }} checked={checked} {...props} />
      {label && <span style={{ fontSize: "0.875rem" }}>{label}</span>}
    </label>
  );
}
