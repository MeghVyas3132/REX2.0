"use client";

import React from "react";

export type TemplateGridProps = {
  className?: string;
};

export function TemplateGrid({ className }: TemplateGridProps) {
  return (
    <section className={className}>
      <h3>TemplateGrid</h3>
    </section>
  );
}
