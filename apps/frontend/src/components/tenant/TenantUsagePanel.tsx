"use client";

import React from "react";
import { Card } from "@/components/ui/Card";

export type TenantUsagePanelProps = {
  className?: string;
  title?: string;
  description?: string;
  children?: React.ReactNode;
};

export function TenantUsagePanel({ className, title, description, children }: TenantUsagePanelProps) {
  return (
    <section className={className}>
      <Card title={title ?? "TenantUsagePanel"}>
        <p>{description ?? "This panel is wired and ready for domain-specific data bindings."}</p>
        {children}
      </Card>
    </section>
  );
}
