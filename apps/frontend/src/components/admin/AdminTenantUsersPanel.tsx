"use client";

import React from "react";
import { Card } from "@/components/ui/Card";

export type AdminTenantUsersPanelProps = {
  className?: string;
  title?: string;
  description?: string;
  children?: React.ReactNode;
};

export function AdminTenantUsersPanel({ className, title, description, children }: AdminTenantUsersPanelProps) {
  return (
    <section className={className}>
      <Card title={title ?? "AdminTenantUsersPanel"}>
        <p>{description ?? "This panel is wired and ready for domain-specific data bindings."}</p>
        {children}
      </Card>
    </section>
  );
}
