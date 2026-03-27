"use client";

import { useMemo, useState, useCallback } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { useRouter } from "next/navigation";
import { DataTable } from "@/components/ui/DataTable";
import { ListPageWrapper } from "@/components/ui/ListPageWrapper";
import { SearchFilter } from "@/components/ui/SearchFilter";
import { FilterBar } from "@/components/ui/FilterBar";
import { Select } from "@/components/ui/Select";
import { usePublicationsQuery } from "@/features/publications/queries";
import { Button } from "@/components/ui/Button";

type PublicationRow = {
  id: string;
  name: string;
  status: string;
  workflowId: string;
};

export default function PublicationsPage() {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const { data, isLoading, isError } = usePublicationsQuery(page, 20);

  const isEmpty = !isLoading && !isError && (!data?.publications || data.publications.length === 0);

  const columns = useMemo<Array<ColumnDef<PublicationRow>>>(
    () => [
      { accessorKey: "name", header: "Publication" },
      { accessorKey: "status", header: "Status" },
      { accessorKey: "workflowId", header: "Workflow" },
      {
        id: "actions",
        header: "Actions",
        cell: ({ row }) => (
          <Button
            variant="secondary"
            onClick={() => router.push(`/publications/${row.original.id}`)}
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
    setStatusFilter("");
    setPage(1);
  }, []);

  return (
    <ListPageWrapper
      title="Publications"
      subtitle="Manage publication endpoints and statuses"
      filters={
        <FilterBar
          onReset={search || statusFilter ? handleResetFilters : undefined}
          showReset={Boolean(search || statusFilter)}
        >
          <SearchFilter
            placeholder="Search publications..."
            onSearch={(q) => {
              setSearch(q);
              setPage(1);
            }}
            isLoading={isLoading}
          />
          <Select
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            value={statusFilter}
            disabled={isLoading}
            options={[
              { value: "", label: "All Status" },
              { value: "draft", label: "Draft" },
              { value: "published", label: "Published" },
              { value: "archived", label: "Archived" },
            ]}
            style={{ minWidth: "150px" }}
          />
        </FilterBar>
      }
      isLoading={isLoading}
      isError={isError}
      errorMessage="Failed to load publications."
      isEmpty={isEmpty}
      emptyTitle="No publications yet"
      emptyDescription="Create a publication from an active workflow."
      current={page}
      total={data?.total ?? 0}
      pageSize={20}
      onPageChange={setPage}
    >
      <DataTable columns={columns} data={data?.publications ?? []} />
    </ListPageWrapper>
  );
}
