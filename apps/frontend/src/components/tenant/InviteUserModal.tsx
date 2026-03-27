"use client";

import React from "react";
import { Card } from "@/components/ui/Card";

export type InviteUserModalProps = {
  className?: string;
  title?: string;
  description?: string;
  children?: React.ReactNode;
};

export function InviteUserModal({ className, title, description, children }: InviteUserModalProps) {
  return (
    <section className={className}>
      <Card title={title ?? "InviteUserModal"}>
        <p>{description ?? "This panel is wired and ready for domain-specific data bindings."}</p>
        {children}
      </Card>
    </section>
  );
}
