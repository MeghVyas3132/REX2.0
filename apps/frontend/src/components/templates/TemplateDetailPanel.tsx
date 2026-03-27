"use client";

import React from "react";

export type TemplateDetailPanelProps = {
  className?: string;
};

export function TemplateDetailPanel({ className }: TemplateDetailPanelProps) {
  return (
    <section className={className}>
      <h3>TemplateDetailPanel</h3>
    </section>
  );
}
