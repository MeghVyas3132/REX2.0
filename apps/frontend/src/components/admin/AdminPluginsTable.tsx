"use client";

import React from "react";
import { Card } from "@/components/ui/Card";

export type AdminPluginsTableProps = {
  className?: string;
  title?: string;
  description?: string;
  children?: React.ReactNode;
};

export function AdminPluginsTable({ className, title, description, children }: AdminPluginsTableProps) {
  return (
    <section className={className}>
      <Card title={title ?? "AdminPluginsTable"}>
        <p>{description ?? "This panel is wired and ready for domain-specific data bindings."}</p>
        {children}
      </Card>
    </section>
  );
}
