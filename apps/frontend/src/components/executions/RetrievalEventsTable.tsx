"use client";

import React from "react";
import { Card } from "@/components/ui/Card";

export type RetrievalEventsTableProps = {
  className?: string;
  title?: string;
  description?: string;
  children?: React.ReactNode;
};

export function RetrievalEventsTable({ className, title, description, children }: RetrievalEventsTableProps) {
  return (
    <section className={className}>
      <Card title={title ?? "RetrievalEventsTable"}>
        <p>{description ?? "This panel is wired and ready for domain-specific data bindings."}</p>
        {children}
      </Card>
    </section>
  );
}
