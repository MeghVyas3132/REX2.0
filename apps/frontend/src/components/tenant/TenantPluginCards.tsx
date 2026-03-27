"use client";

import React from "react";
import { Card } from "@/components/ui/Card";

export type TenantPluginCardsProps = {
  className?: string;
  title?: string;
  description?: string;
  children?: React.ReactNode;
};

export function TenantPluginCards({ className, title, description, children }: TenantPluginCardsProps) {
  return (
    <section className={className}>
      <Card title={title ?? "TenantPluginCards"}>
        <p>{description ?? "This panel is wired and ready for domain-specific data bindings."}</p>
        {children}
      </Card>
    </section>
  );
}
