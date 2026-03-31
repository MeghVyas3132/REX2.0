import React, { ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

type SectionProps = {
  title?: string;
  subtitle?: string;
  children: ReactNode;
  className?: string;
};

export function Section({ title, subtitle, children, className }: SectionProps) {
  return (
    <section className={cn("section-container", className)}>
      {title && <h2 className="section-title">{title}</h2>}
      {subtitle && <p className="section-subtitle">{subtitle}</p>}
      {children}
    </section>
  );
}
