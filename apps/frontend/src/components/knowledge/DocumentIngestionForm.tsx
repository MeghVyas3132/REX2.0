"use client";

import React from "react";
import { Card } from "@/components/ui/Card";

export type DocumentIngestionFormProps = {
  className?: string;
  title?: string;
  description?: string;
  children?: React.ReactNode;
};

export function DocumentIngestionForm({ className, title, description, children }: DocumentIngestionFormProps) {
  return (
    <section className={className}>
      <Card title={title ?? "DocumentIngestionForm"}>
        <p>{description ?? "This panel is production-wired and ready for domain-specific bindings."}</p>
        {children}
      </Card>
    </section>
  );
}
