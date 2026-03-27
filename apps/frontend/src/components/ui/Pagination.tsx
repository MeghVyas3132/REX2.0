"use client";

import React from "react";
import { Button } from "./Button";

type PaginationProps = {
  current: number;
  total: number;
  pageSize?: number;
  onPageChange: (page: number) => void;
};

export function Pagination({ current, total, pageSize = 20, onPageChange }: PaginationProps) {
  const totalPages = Math.ceil(total / pageSize);
  const startItem = (current - 1) * pageSize + 1;
  const endItem = Math.min(current * pageSize, total);

  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "1rem 0", fontSize: "0.875rem" }}>
      <span style={{ color: "var(--text-secondary)" }}>
        Showing {startItem} to {endItem} of {total}
      </span>
      <div style={{ display: "flex", gap: "0.5rem" }}>
        <Button
          variant="secondary"
          disabled={current === 1}
          onClick={() => onPageChange(Math.max(1, current - 1))}
        >
          ← Previous
        </Button>
        <span style={{ display: "flex", alignItems: "center", gap: "0.25rem" }}>
          Page {current} of {totalPages}
        </span>
        <Button
          variant="secondary"
          disabled={current === totalPages}
          onClick={() => onPageChange(Math.min(totalPages, current + 1))}
        >
          Next →
        </Button>
      </div>
    </div>
  );
}
