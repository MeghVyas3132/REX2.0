"use client";

import { ButtonHTMLAttributes } from "react";

type InteractiveHoverButtonProps = ButtonHTMLAttributes<HTMLButtonElement>;

export function InteractiveHoverButton({ children, className, ...props }: InteractiveHoverButtonProps) {
  return (
    <button className={`rx-hover-button ${className || ""}`.trim()} {...props}>
      <span className="rx-hover-button__dot" aria-hidden="true" />
      <span className="rx-hover-button__label">{children}</span>
    </button>
  );
}
