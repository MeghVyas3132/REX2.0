"use client";

import React from "react";
import { Card } from "@/components/ui/Card";

export type AuditLogExplorerProps = {
  className?: string;
  title?: string;
  description?: string;
  children?: React.ReactNode;
};

export function AuditLogExplorer({ className, title, description, children }: AuditLogExplorerProps) {
  return (
    <section className={className}>
      <Card title={title ?? "AuditLogExplorer"}>
        <p>{description ?? "This panel is wired and ready for domain-specific data bindings."}</p>
        {children}
      </Card>
    </section>
  );
}
