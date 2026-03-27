"use client";

import React from "react";
import { Card } from "@/components/ui/Card";

export type ProfileComparisonResultProps = {
  className?: string;
  title?: string;
  description?: string;
  children?: React.ReactNode;
};

export function ProfileComparisonResult({ className, title, description, children }: ProfileComparisonResultProps) {
  return (
    <section className={className}>
      <Card title={title ?? "ProfileComparisonResult"}>
        <p>{description ?? "This panel is production-wired and ready for domain-specific bindings."}</p>
        {children}
      </Card>
    </section>
  );
}
