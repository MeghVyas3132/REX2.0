"use client";

import React from "react";
import { Card } from "@/components/ui/Card";

export type WorkflowListTableProps = {
  className?: string;
  title?: string;
  description?: string;
  children?: React.ReactNode;
};

export function WorkflowListTable({ className, title, description, children }: WorkflowListTableProps) {
  return (
    <section className={className}>
      <Card title={title ?? "WorkflowListTable"}>
        <p>{description ?? "This panel is wired and ready for domain-specific data bindings."}</p>
        {children}
      </Card>
    </section>
  );
}
