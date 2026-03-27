"use client";

import React from "react";
import { Card } from "@/components/ui/Card";

export type ContextSnapshotDiffViewProps = {
  className?: string;
  title?: string;
  description?: string;
  children?: React.ReactNode;
};

export function ContextSnapshotDiffView({ className, title, description, children }: ContextSnapshotDiffViewProps) {
  return (
    <section className={className}>
      <Card title={title ?? "ContextSnapshotDiffView"}>
        <p>{description ?? "This panel is wired and ready for domain-specific data bindings."}</p>
        {children}
      </Card>
    </section>
  );
}
