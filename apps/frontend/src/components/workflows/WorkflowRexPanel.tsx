"use client";

import React from "react";
import { Card } from "@/components/ui/Card";

export type WorkflowRexPanelProps = {
  className?: string;
  title?: string;
  description?: string;
  children?: React.ReactNode;
};

export function WorkflowRexPanel({ className, title, description, children }: WorkflowRexPanelProps) {
  return (
    <section className={className}>
      <Card title={title ?? "WorkflowRexPanel"}>
        <p>{description ?? "This panel is wired and ready for domain-specific data bindings."}</p>
        {children}
      </Card>
    </section>
  );
}
