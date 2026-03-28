"use client";

import React, { ReactNode } from "react";
import { Button } from "./Button";

export type FilterBarProps = {
  children: ReactNode;
  onReset?: () => void;
  showReset?: boolean;
  className?: string;
};

export function FilterBar({ children, onReset, showReset = true, className }: FilterBarProps) {
  return (
    <div
      className={className ? `filter-bar ${className}` : "filter-bar"}
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
        <Button className="filter-bar-reset" variant="secondary" onClick={onReset} style={{ marginLeft: "auto" }}>
          Reset Filters
        </Button>
      )}
    </div>
  );
}
