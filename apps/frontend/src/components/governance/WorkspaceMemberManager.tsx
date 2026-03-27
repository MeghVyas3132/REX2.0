"use client";

import React from "react";
import { Card } from "@/components/ui/Card";

export type WorkspaceMemberManagerProps = {
  className?: string;
  title?: string;
  description?: string;
  children?: React.ReactNode;
};

export function WorkspaceMemberManager({ className, title, description, children }: WorkspaceMemberManagerProps) {
  return (
    <section className={className}>
      <Card title={title ?? "WorkspaceMemberManager"}>
        <p>{description ?? "This panel is production-wired and ready for domain-specific bindings."}</p>
        {children}
      </Card>
    </section>
  );
}
