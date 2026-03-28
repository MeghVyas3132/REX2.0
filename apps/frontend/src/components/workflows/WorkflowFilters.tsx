"use client";

import React, { useState, useCallback } from "react";
import { SearchFilter } from "@/components/ui/SearchFilter";
import { FilterBar } from "@/components/ui/FilterBar";
import { Select } from "@/components/ui/Select";

export type WorkflowFiltersProps = {
  onSearchChange?: (query: string) => void;
  onStatusChange?: (status: string) => void;
  onReset?: () => void;
  isLoading?: boolean;
  className?: string;
};

export type WorkflowFilterState = {
  search: string;
  status: string;
};

export function WorkflowFilters({
  onSearchChange,
  onStatusChange,
  onReset,
  isLoading = false,
  className,
}: WorkflowFiltersProps &  { className?: string }) {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");

  const handleSearch = useCallback(
    (query: string) => {
      setSearch(query);
      onSearchChange?.(query);
    },
    [onSearchChange]
  );

  const handleStatusChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      const value = e.target.value;
      setStatus(value);
      onStatusChange?.(value);
    },
    [onStatusChange]
  );

  const handleReset = useCallback(() => {
    setSearch("");
    setStatus("");
    onReset?.();
  }, [onReset]);

  const hasFilters = !!search || !!status;

  return (
    <FilterBar
      className={className ? `workflow-filters ${className}` : "workflow-filters"}
      onReset={hasFilters ? handleReset : undefined}
      showReset={hasFilters}
    >
      <div className="workflow-filters-search">
        <SearchFilter
          placeholder="Search workflows by name..."
          onSearch={handleSearch}
          isLoading={isLoading}
        />
      </div>
      <div className="workflow-filters-status">
        <Select
          onChange={handleStatusChange}
          value={status}
          disabled={isLoading}
          options={[
            { value: "", label: "All Status" },
            { value: "draft", label: "Draft" },
            { value: "active", label: "Active" },
            { value: "archived", label: "Archived" },
          ]}
          style={{ minWidth: "150px" }}
        />
      </div>
    </FilterBar>
  );
}
