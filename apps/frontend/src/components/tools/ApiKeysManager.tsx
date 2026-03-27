"use client";

import React from "react";
import { Card } from "@/components/ui/Card";

export type ApiKeysManagerProps = {
  className?: string;
  title?: string;
  description?: string;
  children?: React.ReactNode;
};

export function ApiKeysManager({ className, title, description, children }: ApiKeysManagerProps) {
  return (
    <section className={className}>
      <Card title={title ?? "ApiKeysManager"}>
        <p>{description ?? "This panel is wired and ready for domain-specific data bindings."}</p>
        {children}
      </Card>
    </section>
  );
}
