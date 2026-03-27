"use client";

import React from "react";
import { Card } from "@/components/ui/Card";

export type TenantProfileFormProps = {
  className?: string;
  title?: string;
  description?: string;
  children?: React.ReactNode;
};

export function TenantProfileForm({ className, title, description, children }: TenantProfileFormProps) {
  return (
    <section className={className}>
      <Card title={title ?? "TenantProfileForm"}>
        <p>{description ?? "This panel is wired and ready for domain-specific data bindings."}</p>
        {children}
      </Card>
    </section>
  );
}
