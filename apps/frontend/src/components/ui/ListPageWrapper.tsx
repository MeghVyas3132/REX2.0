"use client";

import React, { ReactNode } from "react";
import { Card } from "./Card";
import { EmptyState } from "./EmptyState";
import { Pagination } from "./Pagination";

export type ListPageWrapperProps = {
  title: string;
  subtitle?: string;
  headerActions?: ReactNode;
  filters?: ReactNode;
  isLoading?: boolean;
  isError?: boolean;
  errorMessage?: string;
  isEmpty?: boolean;
  emptyTitle?: string;
  emptyDescription?: string;
  emptyAction?: ReactNode;
  children: ReactNode;
  current?: number;
  total?: number;
  pageSize?: number;
  onPageChange?: (page: number) => void;
  showPaginationTop?: boolean;
};

export function ListPageWrapper({
  title,
  subtitle,
  headerActions,
  filters,
  isLoading = false,
  isError = false,
  errorMessage,
  isEmpty = false,
  emptyTitle = "No items found",
  emptyDescription = "Try adjusting your filters or create a new item.",
  emptyAction,
  children,
  current = 1,
  total = 0,
  pageSize = 20,
  onPageChange,
  showPaginationTop = false,
}: ListPageWrapperProps) {
  return (
    <div className="list-page-shell" style={{ padding: "1rem" }}>
      {/* Header */}
      <div
        className="list-page-header"
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          gap: "1rem",
          marginBottom: "2rem",
          borderBottom: "1px solid var(--border)",
          paddingBottom: "1rem",
        }}
      >
        <div className="list-page-heading">
          <h1 style={{ margin: "0 0 0.5rem 0" }}>{title}</h1>
          {subtitle && (
            <p className="list-page-subtitle" style={{ margin: "0", color: "var(--text-secondary)", fontSize: "0.875rem" }}>
              {subtitle}
            </p>
          )}
        </div>
        {headerActions && <div className="list-page-actions">{headerActions}</div>}
      </div>

      {/* Filters */}
      {filters && <div className="list-page-filters" style={{ marginBottom: "1rem" }}>{filters}</div>}

      {/* Loading state */}
      {isLoading && (
        <Card>
          <div style={{ textAlign: "center", padding: "2rem" }}>
            <p>Loading...</p>
          </div>
        </Card>
      )}

      {/* Error state */}
      {isError && !isLoading && (
        <Card>
          <div
            style={{
              padding: "1.5rem",
              backgroundColor: "var(--color-error-bg, #fee2e2)",
              borderLeft: "4px solid var(--color-error, #dc2626)",
            }}
          >
            <p style={{ margin: "0", color: "var(--color-error)" }}>
              {errorMessage || "Failed to load data. Please try again."}
            </p>
          </div>
        </Card>
      )}

      {/* Empty state */}
      {isEmpty && !isLoading && !isError && (
        <Card>
          <EmptyState
            title={emptyTitle}
            description={emptyDescription}
            icon="📭"
            action={emptyAction}
          />
        </Card>
      )}

      {/* Top pagination */}
      {showPaginationTop && !isEmpty && !isError && !isLoading && onPageChange && total > pageSize && (
        <div className="list-page-pagination list-page-pagination-top">
          <Pagination current={current} total={total} pageSize={pageSize} onPageChange={onPageChange} />
        </div>
      )}

      {/* Content */}
      {!isLoading && !isError && !isEmpty && <div className="list-page-content">{children}</div>}

      {/* Bottom pagination */}
      {!isLoading && !isError && !isEmpty && onPageChange && total > pageSize && (
        <div className="list-page-pagination list-page-pagination-bottom">
          <Pagination current={current} total={total} pageSize={pageSize} onPageChange={onPageChange} />
        </div>
      )}
    </div>
  );
}
