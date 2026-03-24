"use client";

import { ButtonHTMLAttributes, MouseEvent, useRef } from "react";

type RippleButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  rippleColor?: string;
  duration?: string;
};

export function RippleButton({
  children,
  rippleColor = "var(--blue)",
  duration = "500ms",
  className,
  onClick,
  ...props
}: RippleButtonProps) {
  const ref = useRef<HTMLButtonElement>(null);

  const createRipple = (event: MouseEvent<HTMLButtonElement>) => {
    const button = ref.current;
    if (!button) {
      return;
    }

    const rect = button.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    const x = event.clientX - rect.left - size / 2;
    const y = event.clientY - rect.top - size / 2;

    const ripple = document.createElement("span");
    ripple.className = "rx-ripple";
    ripple.style.width = `${size}px`;
    ripple.style.height = `${size}px`;
    ripple.style.left = `${x}px`;
    ripple.style.top = `${y}px`;
    ripple.style.background = rippleColor;
    ripple.style.animationDuration = duration;

    button.appendChild(ripple);
    window.setTimeout(() => ripple.remove(), parseInt(duration, 10) || 500);
  };

  return (
    <button
      ref={ref}
      className={`rx-ripple-button ${className || ""}`.trim()}
      onClick={(event) => {
        createRipple(event);
        onClick?.(event);
      }}
      {...props}
    >
      {children}
    </button>
  );
}
