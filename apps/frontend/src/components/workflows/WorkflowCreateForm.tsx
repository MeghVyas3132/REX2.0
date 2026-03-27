"use client";

import React from "react";
import { Card } from "@/components/ui/Card";

export type WorkflowCreateFormProps = {
  className?: string;
  title?: string;
  description?: string;
  children?: React.ReactNode;
};

export function WorkflowCreateForm({ className, title, description, children }: WorkflowCreateFormProps) {
  return (
    <section className={className}>
      <Card title={title ?? "WorkflowCreateForm"}>
        <p>{description ?? "This panel is wired and ready for domain-specific data bindings."}</p>
        {children}
      </Card>
    </section>
  );
}
