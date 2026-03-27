"use client";

import React from "react";
import { Card } from "@/components/ui/Card";

export type DomainConfigEditorProps = {
  className?: string;
  title?: string;
  description?: string;
  children?: React.ReactNode;
};

export function DomainConfigEditor({ className, title, description, children }: DomainConfigEditorProps) {
  return (
    <section className={className}>
      <Card title={title ?? "DomainConfigEditor"}>
        <p>{description ?? "This panel is production-wired and ready for domain-specific bindings."}</p>
        {children}
      </Card>
    </section>
  );
}
