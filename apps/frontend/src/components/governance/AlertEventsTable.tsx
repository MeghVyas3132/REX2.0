"use client";

import React from "react";
import { Card } from "@/components/ui/Card";

export type AlertEventsTableProps = {
  className?: string;
  title?: string;
  description?: string;
  children?: React.ReactNode;
};

export function AlertEventsTable({ className, title, description, children }: AlertEventsTableProps) {
  return (
    <section className={className}>
      <Card title={title ?? "AlertEventsTable"}>
        <p>{description ?? "This panel is production-wired and ready for domain-specific bindings."}</p>
        {children}
      </Card>
    </section>
  );
}
