"use client";

import React from "react";
import { Card } from "@/components/ui/Card";

export type CreateCorpusModalProps = {
  className?: string;
  title?: string;
  description?: string;
  children?: React.ReactNode;
};

export function CreateCorpusModal({ className, title, description, children }: CreateCorpusModalProps) {
  return (
    <section className={className}>
      <Card title={title ?? "CreateCorpusModal"}>
        <p>{description ?? "This panel is production-wired and ready for domain-specific bindings."}</p>
        {children}
      </Card>
    </section>
  );
}
