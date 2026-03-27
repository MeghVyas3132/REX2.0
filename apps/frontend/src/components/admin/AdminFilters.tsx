"use client";

import React, { useState, useCallback } from "react";
import { SearchFilter } from "@/components/ui/SearchFilter";
import { FilterBar } from "@/components/ui/FilterBar";
import { Select } from "@/components/ui/Select";

export type AdminFiltersProps = {
  onSearchChange?: (query: string) => void;
  onStatusChange?: (status: string) => void;
  onReset?: () => void;
  isLoading?: boolean;
  className?: string;
};

export function AdminFilters({
  onSearchChange,
  onStatusChange,
  onReset,
  isLoading = false,
}: AdminFiltersProps & { className?: string }) {
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
      onReset={hasFilters ? handleReset : undefined}
      showReset={hasFilters}
    >
      <SearchFilter
        placeholder="Search tenants, plugins..."
        onSearch={handleSearch}
        isLoading={isLoading}
      />
      <Select
        onChange={handleStatusChange}
        value={status}
        disabled={isLoading}
        options={[
          { value: "", label: "All Status" },
          { value: "active", label: "Active" },
          { value: "inactive", label: "Inactive" },
          { value: "suspended", label: "Suspended" },
        ]}
        style={{ minWidth: "150px" }}
      />
    </FilterBar>
  );
}
