"use client";

import React from "react";
import { Card } from "@/components/ui/Card";

export type TenantUsersTableProps = {
  className?: string;
  title?: string;
  description?: string;
  children?: React.ReactNode;
};

export function TenantUsersTable({ className, title, description, children }: TenantUsersTableProps) {
  return (
    <section className={className}>
      <Card title={title ?? "TenantUsersTable"}>
        <p>{description ?? "This panel is wired and ready for domain-specific data bindings."}</p>
        {children}
      </Card>
    </section>
  );
}
