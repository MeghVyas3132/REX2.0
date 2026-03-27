"use client";

import React from "react";
import { Card } from "@/components/ui/Card";

export type ExecutionStatusHeaderProps = {
  className?: string;
  title?: string;
  description?: string;
  children?: React.ReactNode;
};

export function ExecutionStatusHeader({ className, title, description, children }: ExecutionStatusHeaderProps) {
  return (
    <section className={className}>
      <Card title={title ?? "ExecutionStatusHeader"}>
        <p>{description ?? "This panel is wired and ready for domain-specific data bindings."}</p>
        {children}
      </Card>
    </section>
  );
}
