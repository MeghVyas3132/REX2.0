"use client";

import React, { useState, useCallback } from "react";
import { SearchFilter } from "@/components/ui/SearchFilter";
import { FilterBar } from "@/components/ui/FilterBar";
import { Select } from "@/components/ui/Select";

export type ComplianceFiltersProps = {
  onSearchChange?: (query: string) => void;
  onTypeChange?: (type: string) => void;
  onReset?: () => void;
  isLoading?: boolean;
  className?: string;
};

export function ComplianceFilters({
  onSearchChange,
  onTypeChange,
  onReset,
  isLoading = false,
}: ComplianceFiltersProps & { className?: string }) {
  const [search, setSearch] = useState("");
  const [type, setType] = useState("");

  const handleSearch = useCallback(
    (query: string) => {
      setSearch(query);
      onSearchChange?.(query);
    },
    [onSearchChange]
  );

  const handleTypeChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      const value = e.target.value;
      setType(value);
      onTypeChange?.(value);
    },
    [onTypeChange]
  );

  const handleReset = useCallback(() => {
    setSearch("");
    setType("");
    onReset?.();
  }, [onReset]);

  const hasFilters = !!search || !!type;

  return (
    <FilterBar
      onReset={hasFilters ? handleReset : undefined}
      showReset={hasFilters}
    >
      <SearchFilter
        placeholder="Search records..."
        onSearch={handleSearch}
        isLoading={isLoading}
      />
      <Select
        onChange={handleTypeChange}
        value={type}
        disabled={isLoading}
        options={[
          { value: "", label: "All Types" },
          { value: "consent", label: "Consent" },
          { value: "legal_basis", label: "Legal Basis" },
          { value: "retention", label: "Retention" },
          { value: "dsar", label: "Data Subject Request" },
        ]}
        style={{ minWidth: "150px" }}
      />
    </FilterBar>
  );
}
