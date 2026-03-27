"use client";

import React from "react";
import { Card } from "@/components/ui/Card";

export type FileParseUploaderProps = {
  className?: string;
  title?: string;
  description?: string;
  children?: React.ReactNode;
};

export function FileParseUploader({ className, title, description, children }: FileParseUploaderProps) {
  return (
    <section className={className}>
      <Card title={title ?? "FileParseUploader"}>
        <p>{description ?? "This panel is wired and ready for domain-specific data bindings."}</p>
        {children}
      </Card>
    </section>
  );
}
