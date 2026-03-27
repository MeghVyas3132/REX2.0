"use client";

import React, { ReactNode } from "react";
import { Button } from "./Button";

export type FilterBarProps = {
  children: ReactNode;
  onReset?: () => void;
  showReset?: boolean;
};

export function FilterBar({ children, onReset, showReset = true }: FilterBarProps) {
  return (
    <div
      style={{
        display: "flex",
        gap: "1rem",
        alignItems: "center",
        padding: "1rem",
        borderBottom: "1px solid var(--border)",
        flexWrap: "wrap",
        backgroundColor: "var(--bg-secondary)",
      }}
    >
      {children}
      {showReset && onReset && (
        <Button variant="secondary" onClick={onReset} style={{ marginLeft: "auto" }}>
          Reset Filters
        </Button>
      )}
    </div>
  );
}
