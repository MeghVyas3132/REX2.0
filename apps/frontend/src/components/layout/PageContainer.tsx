"use client";

import type { ReactNode } from "react";
import "./page-container.css";

interface PageContainerProps {
  children: ReactNode;
  maxWidth?: "sm" | "md" | "lg" | "xl" | "full";
}

export function PageContainer({
  children,
  maxWidth = "xl",
}: PageContainerProps) {
  return (
    <div className={`page-container page-container--${maxWidth}`}>
      {children}
    </div>
  );
}

interface PageHeaderProps {
  title: string;
  description?: string;
  action?: ReactNode;
}

export function PageHeader({ title, description, action }: PageHeaderProps) {
  return (
    <div className="page-header">
      <div className="page-header-content">
        <h1 className="page-title">{title}</h1>
        {description && <p className="page-description">{description}</p>}
      </div>
      {action && <div className="page-header-action">{action}</div>}
    </div>
  );
}

interface PageSectionProps {
  children: ReactNode;
  title?: string;
  subtitle?: string;
}

export function PageSection({ children, title, subtitle }: PageSectionProps) {
  return (
    <section className="page-section">
      {(title || subtitle) && (
        <div className="page-section-header">
          {title && <h2 className="page-section-title">{title}</h2>}
          {subtitle && <p className="page-section-subtitle">{subtitle}</p>}
        </div>
      )}
      {children}
    </section>
  );
}
