import type { InputHTMLAttributes } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

export function Input({ label, style, ...props }: InputProps) {
  return (
    <label style={label ? labelStyle : undefined}>
      {label ? <span style={labelTextStyle}>{label}</span> : null}
      <input
        {...props}
        style={{
          ...inputStyle,
          ...style,
        }}
      />
    </label>
  );
}

const labelStyle: React.CSSProperties = {
  display: "grid",
  gap: 8,
};

const labelTextStyle: React.CSSProperties = {
  fontSize: 12,
  color: "var(--text-tertiary)",
  fontWeight: 500,
};

const inputStyle: React.CSSProperties = {
  height: 40,
  borderRadius: 10,
  border: "1px solid var(--border-strong)",
  backgroundColor: "var(--surface-1)",
  color: "var(--text-primary)",
  padding: "0 12px",
  outline: "none",
  fontSize: 14,
};
