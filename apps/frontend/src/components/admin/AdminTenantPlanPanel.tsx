"use client";

import React from "react";
import { Card } from "@/components/ui/Card";

export type AdminTenantPlanPanelProps = {
  className?: string;
  title?: string;
  description?: string;
  children?: React.ReactNode;
};

export function AdminTenantPlanPanel({ className, title, description, children }: AdminTenantPlanPanelProps) {
  return (
    <section className={className}>
      <Card title={title ?? "AdminTenantPlanPanel"}>
        <p>{description ?? "This panel is wired and ready for domain-specific data bindings."}</p>
        {children}
      </Card>
    </section>
  );
}
