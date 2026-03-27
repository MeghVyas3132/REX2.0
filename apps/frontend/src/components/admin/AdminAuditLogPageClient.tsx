"use client";

import { useMemo, useState, useCallback } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/ui/DataTable";
import { ListPageWrapper } from "@/components/ui/ListPageWrapper";
import { AdminFilters } from "@/components/admin/AdminFilters";
import { useAuditLogQuery } from "@/features/admin/queries";
import type { AdminAuditEvent } from "@/features/admin/types";

export function AdminAuditLogPageClient() {
  const [page, setPage] = useState(1);

  const { data, isLoading, isError } = useAuditLogQuery(page, 20);
  const isEmpty = !isLoading && !isError && (!data || data.length === 0);

  const columns = useMemo<Array<ColumnDef<AdminAuditEvent>>>(
    () => [
      { accessorKey: "actor", header: "Actor" },
      { accessorKey: "action", header: "Action" },
      { accessorKey: "target", header: "Target" },
      { accessorKey: "createdAt", header: "When" },
    ],
    [],
  );

  const handleResetFilters = useCallback(() => {
    setPage(1);
  }, []);

  return (
    <ListPageWrapper
      title="Audit Log"
      subtitle="System-level security and admin activity timeline"
      filters={
        <AdminFilters
          onSearchChange={() => setPage(1)}
          onReset={handleResetFilters}
          isLoading={isLoading}
        />
      }
      isLoading={isLoading}
      isError={isError}
      errorMessage="Failed to load audit events."
      isEmpty={isEmpty}
      emptyTitle="No audit events found"
      emptyDescription="System activity will appear here."
      current={page}
      total={data?.length ?? 0}
      pageSize={20}
      onPageChange={setPage}
    >
      <DataTable columns={columns} data={data ?? []} />
    </ListPageWrapper>
  );
}
