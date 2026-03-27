"use client";

import React from "react";
import { Card } from "@/components/ui/Card";

export type ModelRegistryTableProps = {
  className?: string;
  title?: string;
  description?: string;
  children?: React.ReactNode;
};

export function ModelRegistryTable({ className, title, description, children }: ModelRegistryTableProps) {
  return (
    <section className={className}>
      <Card title={title ?? "ModelRegistryTable"}>
        <p>{description ?? "This panel is production-wired and ready for domain-specific bindings."}</p>
        {children}
      </Card>
    </section>
  );
}
