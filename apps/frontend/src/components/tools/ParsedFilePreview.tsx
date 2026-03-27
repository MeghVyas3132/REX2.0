"use client";

import React from "react";
import { Card } from "@/components/ui/Card";

export type ParsedFilePreviewProps = {
  className?: string;
  title?: string;
  description?: string;
  children?: React.ReactNode;
};

export function ParsedFilePreview({ className, title, description, children }: ParsedFilePreviewProps) {
  return (
    <section className={className}>
      <Card title={title ?? "ParsedFilePreview"}>
        <p>{description ?? "This panel is wired and ready for domain-specific data bindings."}</p>
        {children}
      </Card>
    </section>
  );
}
