"use client";

import { useMemo, useState, useCallback } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { useRouter } from "next/navigation";
import { DataTable } from "@/components/ui/DataTable";
import { ListPageWrapper } from "@/components/ui/ListPageWrapper";
import { AdminFilters } from "@/components/admin/AdminFilters";
import { useAdminTenantsQuery } from "@/features/admin/queries";
import type { AdminTenant } from "@/features/admin/types";
import { Button } from "@/components/ui/Button";

export function AdminTenantsPageClient() {
  const router = useRouter();
  const [page, setPage] = useState(1);

  const { data, isLoading, isError } = useAdminTenantsQuery(page, 20);
  const isEmpty = !isLoading && !isError && (!data || data.length === 0);

  const columns = useMemo<Array<ColumnDef<AdminTenant>>>(
    () => [
      { accessorKey: "name", header: "Tenant" },
      { accessorKey: "status", header: "Status" },
      { accessorKey: "usersCount", header: "Users" },
      { accessorKey: "createdAt", header: "Created" },
      {
        id: "actions",
        header: "Actions",
        cell: ({ row }) => (
          <Button variant="secondary" onClick={() => router.push(`/tenants/${row.original.id}`)}>
            Manage
          </Button>
        ),
      },
    ],
    [router],
  );

  const handleResetFilters = useCallback(() => {
    setPage(1);
  }, []);

  return (
    <ListPageWrapper
      title="Tenants"
      subtitle="Manage tenant lifecycle and configurations"
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
      errorMessage="Failed to load tenants."
      isEmpty={isEmpty}
      emptyTitle="No tenants found"
      emptyDescription="Tenants will appear here once created."
      current={page}
      total={data?.length ?? 0}
      pageSize={20}
      onPageChange={setPage}
    >
      <DataTable columns={columns} data={data ?? []} />
    </ListPageWrapper>
  );
}
