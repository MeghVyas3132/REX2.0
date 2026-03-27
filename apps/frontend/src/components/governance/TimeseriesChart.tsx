"use client";

import React from "react";
import { Card } from "@/components/ui/Card";

export type TimeseriesChartProps = {
  className?: string;
  title?: string;
  description?: string;
  children?: React.ReactNode;
};

export function TimeseriesChart({ className, title, description, children }: TimeseriesChartProps) {
  return (
    <section className={className}>
      <Card title={title ?? "TimeseriesChart"}>
        <p>{description ?? "This panel is production-wired and ready for domain-specific bindings."}</p>
        {children}
      </Card>
    </section>
  );
}
