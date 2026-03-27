import React, { ReactNode } from "react";

type SectionProps = {
  title?: string;
  subtitle?: string;
  children: ReactNode;
};

export function Section({ title, subtitle, children }: SectionProps) {
  return (
    <section style={{ marginBottom: "2rem" }}>
      {title && <h2 style={{ margin: "0 0 0.5rem 0" }}>{title}</h2>}
      {subtitle && <p style={{ margin: "0 0 1rem 0", color: "var(--text-secondary)", fontSize: "0.875rem" }}>{subtitle}</p>}
      {children}
    </section>
  );
}
