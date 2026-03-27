"use client";

import React from "react";
import { Card } from "@/components/ui/Card";

export type HyperparameterProfileEditorProps = {
  className?: string;
  title?: string;
  description?: string;
  children?: React.ReactNode;
};

export function HyperparameterProfileEditor({ className, title, description, children }: HyperparameterProfileEditorProps) {
  return (
    <section className={className}>
      <Card title={title ?? "HyperparameterProfileEditor"}>
        <p>{description ?? "This panel is production-wired and ready for domain-specific bindings."}</p>
        {children}
      </Card>
    </section>
  );
}
