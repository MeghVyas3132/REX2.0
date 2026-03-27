"use client";

import React from "react";
import { Card } from "./Card";
import { Table } from "./SimpleTable";
import { Pagination } from "./Pagination";

type QueryResult = {
  id: string;
  [key: string]: unknown;
};

type QueryResultsProps = {
  results: QueryResult[];
  columns: string[];
  total: number;
  page: number;
  pageSize?: number;
  onPageChange: (page: number) => void;
  loading?: boolean;
  error?: string;
};

export function QueryResults({
  results,
  columns,
  total,
  page,
  pageSize = 20,
  onPageChange,
  loading = false,
  error,
}: QueryResultsProps) {
  if (error) {
    return (
      <div
        style={{
          borderColor: "#ef4444",
          backgroundColor: "rgba(239, 68, 68, 0.05)",
          padding: "1rem",
          borderRadius: "0.5rem",
          border: "1px solid #ef4444",
        }}
      >
        <p style={{ margin: 0, color: "#ef4444", fontSize: "0.875rem" }}>Error: {error}</p>
      </div>
    );
  }

  if (loading) {
    return (
      <Card>
        <div style={{ textAlign: "center", padding: "2rem" }}>
          <p style={{ margin: 0, color: "var(--text-secondary)" }}>Loading results...</p>
        </div>
      </Card>
    );
  }

  if (results.length === 0) {
    return (
      <Card>
        <div style={{ textAlign: "center", padding: "2rem" }}>
          <p style={{ margin: 0, color: "var(--text-secondary)" }}>No results found</p>
        </div>
      </Card>
    );
  }

  return (
    <Card>
      <Table
        columns={columns}
        rows={results.map((result) => columns.map((col) => String(result[col] || "")))}
      />
      <Pagination current={page} total={total} pageSize={pageSize} onPageChange={onPageChange} />
    </Card>
  );
}
