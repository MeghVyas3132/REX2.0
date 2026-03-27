"use client";

import React from "react";
import { Card } from "@/components/ui/Card";

export type TenantDetailTabsProps = {
  className?: string;
  title?: string;
  description?: string;
  children?: React.ReactNode;
};

export function TenantDetailTabs({ className, title, description, children }: TenantDetailTabsProps) {
  return (
    <section className={className}>
      <Card title={title ?? "TenantDetailTabs"}>
        <p>{description ?? "This panel is wired and ready for domain-specific data bindings."}</p>
        {children}
      </Card>
    </section>
  );
}
