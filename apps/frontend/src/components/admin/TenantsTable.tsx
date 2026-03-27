"use client";

import React from "react";
import { Card } from "@/components/ui/Card";

export type TenantsTableProps = {
  className?: string;
  title?: string;
  description?: string;
  children?: React.ReactNode;
};

export function TenantsTable({ className, title, description, children }: TenantsTableProps) {
  return (
    <section className={className}>
      <Card title={title ?? "TenantsTable"}>
        <p>{description ?? "This panel is wired and ready for domain-specific data bindings."}</p>
        {children}
      </Card>
    </section>
  );
}
