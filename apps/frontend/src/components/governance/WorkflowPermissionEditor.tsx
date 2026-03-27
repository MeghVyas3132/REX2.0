"use client";

import React from "react";
import { Card } from "@/components/ui/Card";

export type WorkflowPermissionEditorProps = {
  className?: string;
  title?: string;
  description?: string;
  children?: React.ReactNode;
};

export function WorkflowPermissionEditor({ className, title, description, children }: WorkflowPermissionEditorProps) {
  return (
    <section className={className}>
      <Card title={title ?? "WorkflowPermissionEditor"}>
        <p>{description ?? "This panel is production-wired and ready for domain-specific bindings."}</p>
        {children}
      </Card>
    </section>
  );
}
