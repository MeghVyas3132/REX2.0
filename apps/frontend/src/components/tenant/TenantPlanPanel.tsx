"use client";

import React from "react";
import { Card } from "@/components/ui/Card";

export type TenantPlanPanelProps = {
  className?: string;
  title?: string;
  description?: string;
  children?: React.ReactNode;
};

export function TenantPlanPanel({ className, title, description, children }: TenantPlanPanelProps) {
  return (
    <section className={className}>
      <Card title={title ?? "TenantPlanPanel"}>
        <p>{description ?? "This panel is wired and ready for domain-specific data bindings."}</p>
        {children}
      </Card>
    </section>
  );
}
