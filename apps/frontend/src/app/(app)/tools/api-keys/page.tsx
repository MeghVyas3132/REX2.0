"use client";

import { useMemo } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/ui/DataTable";
import { useApiKeysQuery } from "@/features/tools/queries";

type ApiKeyRow = {
  id: string;
  name: string;
  key: string;
  createdAt: string;
};

export default function ApiKeysPage() {
  const { data, isLoading, isError } = useApiKeysQuery();

  const columns = useMemo<Array<ColumnDef<ApiKeyRow>>>(
    () => [
      { accessorKey: "name", header: "Name" },
      { accessorKey: "key", header: "Key" },
      { accessorKey: "createdAt", header: "Created" },
      { accessorKey: "id", header: "ID" },
    ],
    [],
  );

  if (isLoading) return <div className="page-state">Loading API keys...</div>;
  if (isError) return <div className="page-state">Failed to load API keys.</div>;

  return (
    <section>
      <h1>API Keys</h1>
      <p>Manage tenant and publication API credentials.</p>
      <DataTable columns={columns} data={data?.data ?? []} />
    </section>
  );
}
