"use client";

import { useMemo } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/ui/DataTable";
import { useComplianceQuery } from "@/features/compliance/queries";

type RetentionRow = {
  id: string;
  status: string;
  createdAt: string;
  updatedAt: string;
};

export default function RetentionPage() {
  const query = useComplianceQuery("legal_basis", 1, 20);

  const columns = useMemo<Array<ColumnDef<RetentionRow>>>(
    () => [
      { accessorKey: "id", header: "Policy Record" },
      { accessorKey: "status", header: "Status" },
      { accessorKey: "createdAt", header: "Created" },
      { accessorKey: "updatedAt", header: "Updated" },
    ],
    [],
  );

  if (query.isLoading) return <div className="page-state">Loading retention policies...</div>;
  if (query.isError) return <div className="page-state">Failed to load retention policies.</div>;

  return (
    <section>
      <h1>Retention Policies</h1>
      <p>Retention policy records and latest update status.</p>
      <DataTable columns={columns} data={query.data?.records ?? []} />
    </section>
  );
}
