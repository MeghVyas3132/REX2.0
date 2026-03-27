"use client";

import React from "react";
import { Card } from "@/components/ui/Card";

export type DataSubjectResponseModalProps = {
  className?: string;
  title?: string;
  description?: string;
  children?: React.ReactNode;
};

export function DataSubjectResponseModal({ className, title, description, children }: DataSubjectResponseModalProps) {
  return (
    <section className={className}>
      <Card title={title ?? "DataSubjectResponseModal"}>
        <p>{description ?? "This panel is production-wired and ready for domain-specific bindings."}</p>
        {children}
      </Card>
    </section>
  );
}
