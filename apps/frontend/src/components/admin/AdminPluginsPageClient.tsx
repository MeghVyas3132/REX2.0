"use client";

import { useMemo, useState, useCallback } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/ui/DataTable";
import { ListPageWrapper } from "@/components/ui/ListPageWrapper";
import { AdminFilters } from "@/components/admin/AdminFilters";
import { usePluginsQuery } from "@/features/admin/queries";
import type { AdminPlugin } from "@/features/admin/types";

export function AdminPluginsPageClient() {
  const [page, setPage] = useState(1);

  const { data, isLoading, isError } = usePluginsQuery(page, 20);
  const isEmpty = !isLoading && !isError && (!data || data.length === 0);

  const columns = useMemo<Array<ColumnDef<AdminPlugin>>>(
    () => [
      { accessorKey: "name", header: "Plugin" },
      { accessorKey: "version", header: "Version" },
      { accessorKey: "status", header: "Status" },
      { accessorKey: "id", header: "ID" },
    ],
    [],
  );

  const handleResetFilters = useCallback(() => {
    setPage(1);
  }, []);

  return (
    <ListPageWrapper
      title="Plugin Registry"
      subtitle="Manage system plugins and their activation state"
      filters={
        <AdminFilters
          onSearchChange={() => setPage(1)}
          onStatusChange={() => setPage(1)}
          onReset={handleResetFilters}
          isLoading={isLoading}
        />
      }
      isLoading={isLoading}
      isError={isError}
      errorMessage="Failed to load plugins."
      isEmpty={isEmpty}
      emptyTitle="No plugins available"
      emptyDescription="No plugins are currently registered in the system."
      current={page}
      total={data?.length ?? 0}
      pageSize={20}
      onPageChange={setPage}
    >
      <DataTable columns={columns} data={data ?? []} />
    </ListPageWrapper>
  );
}
