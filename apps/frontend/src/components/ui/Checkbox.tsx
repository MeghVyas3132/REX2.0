import React, { InputHTMLAttributes } from "react";

type CheckboxProps = InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
};

export function Checkbox({ label, className, ...props }: CheckboxProps) {
  return (
    <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", cursor: "pointer" }}>
      <input
        type="checkbox"
        className={className}
        style={{ width: "1rem", height: "1rem", cursor: "pointer" }}
        {...props}
      />
      {label && <span style={{ fontSize: "0.875rem" }}>{label}</span>}
    </label>
  );
}
