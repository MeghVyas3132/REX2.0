"use client";

import React from "react";
import { Card } from "@/components/ui/Card";

export type ChunksTableProps = {
  className?: string;
  title?: string;
  description?: string;
  children?: React.ReactNode;
};

export function ChunksTable({ className, title, description, children }: ChunksTableProps) {
  return (
    <section className={className}>
      <Card title={title ?? "ChunksTable"}>
        <p>{description ?? "This panel is production-wired and ready for domain-specific bindings."}</p>
        {children}
      </Card>
    </section>
  );
}
