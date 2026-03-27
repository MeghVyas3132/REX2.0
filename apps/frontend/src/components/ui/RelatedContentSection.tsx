"use client";

import React from "react";

export type RelatedContentSectionProps = {
  title: string;
  description?: string;
  children: React.ReactNode;
};

export function RelatedContentSection({
  title,
  description,
  children,
}: RelatedContentSectionProps) {
  return (
    <div
      style={{
        padding: "1.5rem",
        border: "1px solid var(--border)",
        borderRadius: "0.5rem",
        backgroundColor: "var(--background-secondary)",
      }}
    >
      <h3 style={{ margin: "0 0 0.5rem 0" }}>{title}</h3>
      {description && (
        <p style={{ margin: "0 0 1rem 0", fontSize: "0.875rem", color: "var(--text-secondary)" }}>
          {description}
        </p>
      )}
      {children}
    </div>
  );
}
