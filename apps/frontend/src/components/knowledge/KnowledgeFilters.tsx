"use client";

import React, { useState, useCallback } from "react";
import { SearchFilter } from "@/components/ui/SearchFilter";
import { FilterBar } from "@/components/ui/FilterBar";

export type KnowledgeFiltersProps = {
  onSearchChange?: (query: string) => void;
  onReset?: () => void;
  isLoading?: boolean;
  className?: string;
};

export function KnowledgeFilters({
  onSearchChange,
  onReset,
  isLoading = false,
}: KnowledgeFiltersProps & { className?: string }) {
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
        placeholder="Search corpus or documents..."
        onSearch={handleSearch}
        isLoading={isLoading}
      />
    </FilterBar>
  );
}
