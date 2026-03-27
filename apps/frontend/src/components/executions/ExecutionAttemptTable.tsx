"use client";

import React from "react";
import { Card } from "@/components/ui/Card";

export type ExecutionAttemptTableProps = {
  className?: string;
  title?: string;
  description?: string;
  children?: React.ReactNode;
};

export function ExecutionAttemptTable({ className, title, description, children }: ExecutionAttemptTableProps) {
  return (
    <section className={className}>
      <Card title={title ?? "ExecutionAttemptTable"}>
        <p>{description ?? "This panel is wired and ready for domain-specific data bindings."}</p>
        {children}
      </Card>
    </section>
  );
}
