"use client";

import { useMemo, useState, useCallback } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { useRouter } from "next/navigation";
import { DataTable } from "@/components/ui/DataTable";
import { ListPageWrapper } from "@/components/ui/ListPageWrapper";
import { SearchFilter } from "@/components/ui/SearchFilter";
import { FilterBar } from "@/components/ui/FilterBar";
import { useTemplatesQuery } from "@/features/templates/queries";
import { Button } from "@/components/ui/Button";

type TemplateRow = {
  id: string;
  name: string;
  description: string;
};

export default function TemplatesPage() {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");

  const { data, isLoading, isError } = useTemplatesQuery(page, 20);

  const isEmpty = !isLoading && !isError && (!data?.templates || data.templates.length === 0);

  const columns = useMemo<Array<ColumnDef<TemplateRow>>>(
    () => [
      { accessorKey: "name", header: "Template" },
      { accessorKey: "description", header: "Description" },
      {
        id: "actions",
        header: "Actions",
        cell: ({ row }) => (
          <Button
            variant="secondary"
            onClick={() => router.push(`/templates/${row.original.id}`)}
          >
            View
          </Button>
        ),
      },
    ],
    [router],
  );

  const handleResetFilters = useCallback(() => {
    setSearch("");
    setPage(1);
  }, []);

  return (
    <ListPageWrapper
      title="Templates"
      subtitle="Browse and instantiate reusable workflow templates"
      filters={
        <FilterBar
          className="templates-filters"
          onReset={search ? handleResetFilters : undefined}
          showReset={Boolean(search)}
        >
          <SearchFilter
            placeholder="Search templates..."
            onSearch={(q) => {
              setSearch(q);
              setPage(1);
            }}
            isLoading={isLoading}
          />
        </FilterBar>
      }
      isLoading={isLoading}
      isError={isError}
      errorMessage="Failed to load templates."
      isEmpty={isEmpty}
      emptyTitle="No templates available"
      emptyDescription="Check back later for new workflow templates."
      current={page}
      total={data?.total ?? 0}
      pageSize={20}
      onPageChange={setPage}
    >
      <DataTable columns={columns} data={data?.templates ?? []} />
    </ListPageWrapper>
  );
}
