"use client";

import React from "react";
import { Card } from "@/components/ui/Card";

export type ExecutionStepTimelineProps = {
  className?: string;
  title?: string;
  description?: string;
  children?: React.ReactNode;
};

export function ExecutionStepTimeline({ className, title, description, children }: ExecutionStepTimelineProps) {
  return (
    <section className={className}>
      <Card title={title ?? "ExecutionStepTimeline"}>
        <p>{description ?? "This panel is wired and ready for domain-specific data bindings."}</p>
        {children}
      </Card>
    </section>
  );
}
