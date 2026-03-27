"use client";

import React from "react";
import { Card } from "@/components/ui/Card";

export type ByokConfigPanelProps = {
  className?: string;
  title?: string;
  description?: string;
  children?: React.ReactNode;
};

export function ByokConfigPanel({ className, title, description, children }: ByokConfigPanelProps) {
  return (
    <section className={className}>
      <Card title={title ?? "ByokConfigPanel"}>
        <p>{description ?? "This panel is wired and ready for domain-specific data bindings."}</p>
        {children}
      </Card>
    </section>
  );
}
