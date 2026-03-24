"use client";

import { useTheme } from "@/lib/theme-provider";

type AnimatedThemeTogglerProps = {
  className?: string;
  duration?: number;
};

export function AnimatedThemeToggler({ className, duration = 400 }: AnimatedThemeTogglerProps) {
  const { resolvedTheme, setTheme } = useTheme();

  const toggle = () => {
    setTheme(resolvedTheme === "dark" ? "light" : "dark");
  };

  return (
    <button
      type="button"
      className={`rx-theme-toggler ${className || ""}`.trim()}
      style={{ ["--rx-theme-duration" as string]: `${duration}ms` }}
      onClick={toggle}
      aria-label="Toggle theme"
      title="Toggle theme"
    >
      <span className={`rx-theme-toggler__sun ${resolvedTheme === "light" ? "is-active" : ""}`} aria-hidden="true">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <circle cx="12" cy="12" r="4" />
          <path d="M12 1.5v2.6M12 19.9v2.6M4.2 4.2l1.8 1.8M18 18l1.8 1.8M1.5 12h2.6M19.9 12h2.6M4.2 19.8l1.8-1.8M18 6l1.8-1.8" />
        </svg>
      </span>
      <span className={`rx-theme-toggler__moon ${resolvedTheme === "dark" ? "is-active" : ""}`} aria-hidden="true">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <path d="M21 13.1A8.8 8.8 0 1 1 10.9 3a7.1 7.1 0 0 0 10.1 10.1Z" />
        </svg>
      </span>
    </button>
  );
}
