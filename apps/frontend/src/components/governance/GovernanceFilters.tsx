"use client";

import React, { useState, useCallback } from "react";
import { SearchFilter } from "@/components/ui/SearchFilter";
import { FilterBar } from "@/components/ui/FilterBar";

export type GovernanceFiltersProps = {
  onSearchChange?: (query: string) => void;
  onReset?: () => void;
  isLoading?: boolean;
  className?: string;
};

export function GovernanceFilters({
  onSearchChange,
  onReset,
  isLoading = false,
}: GovernanceFiltersProps & { className?: string }) {
  const [search, setSearch] = useState("");

  const handleSearch = useCallback(
    (query: string) => {
      setSearch(query);
      onSearchChange?.(query);
    },
    [onSearchChange]
  );

  const handleReset = useCallback(() => {
    setSearch("");
    onReset?.();
  }, [onReset]);

  return (
    <FilterBar
      onReset={search ? handleReset : undefined}
      showReset={Boolean(search)}
    >
      <SearchFilter
        placeholder="Search policies, rules, and workspaces..."
        onSearch={handleSearch}
        isLoading={isLoading}
      />
    </FilterBar>
  );
}
