"use client";

import React, { useState, useCallback } from "react";
import { Input } from "./Input";
import { Button } from "./Button";

export type SearchFilterProps = {
  placeholder?: string;
  onSearch: (query: string) => void;
  debounceMs?: number;
  isLoading?: boolean;
};

export function SearchFilter({
  placeholder = "Search...",
  onSearch,
  debounceMs = 300,
  isLoading = false,
}: SearchFilterProps) {
  const [query, setQuery] = useState("");
  const [timeoutId, setTimeoutId] = useState<NodeJS.Timeout | null>(null);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      setQuery(value);

      if (timeoutId) clearTimeout(timeoutId);
      const id = setTimeout(() => onSearch(value), debounceMs);
      setTimeoutId(id);
    },
    [debounceMs, timeoutId, onSearch]
  );

  const handleClear = useCallback(() => {
    setQuery("");
    if (timeoutId) clearTimeout(timeoutId);
    onSearch("");
  }, [timeoutId, onSearch]);

  return (
    <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
      <Input
        type="text"
        placeholder={placeholder}
        value={query}
        onChange={handleChange}
        disabled={isLoading}
        style={{ flex: 1, minWidth: "200px" }}
      />
      {query && (
        <Button variant="secondary" onClick={handleClear} disabled={isLoading}>
          Clear
        </Button>
      )}
    </div>
  );
}
