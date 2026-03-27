"use client";

import React from "react";
import { Card } from "@/components/ui/Card";

export type AdminTenantPluginPanelProps = {
  className?: string;
  title?: string;
  description?: string;
  children?: React.ReactNode;
};

export function AdminTenantPluginPanel({ className, title, description, children }: AdminTenantPluginPanelProps) {
  return (
    <section className={className}>
      <Card title={title ?? "AdminTenantPluginPanel"}>
        <p>{description ?? "This panel is wired and ready for domain-specific data bindings."}</p>
        {children}
      </Card>
    </section>
  );
}
