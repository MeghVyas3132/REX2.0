"use client";

import { useMemo } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/ui/DataTable";
import { useComplianceQuery } from "@/features/compliance/queries";

type ComplianceRow = {
  id: string;
  status: string;
  createdAt: string;
  updatedAt: string;
};

export default function DsarPage() {
  const { data, isLoading, isError } = useComplianceQuery("dsar", 1, 20);

  const columns = useMemo<Array<ColumnDef<ComplianceRow>>>(
    () => [
      { accessorKey: "id", header: "Request" },
      { accessorKey: "status", header: "Status" },
      { accessorKey: "createdAt", header: "Created" },
      { accessorKey: "updatedAt", header: "Updated" },
    ],
    [],
  );

  if (isLoading) return <div className="page-state">Loading DSAR requests...</div>;
  if (isError) return <div className="page-state">Failed to load DSAR requests.</div>;

  return (
    <section>
      <h1>Data Subject Requests</h1>
      <p>Track request handling and completion status.</p>
      <DataTable columns={columns} data={data?.records ?? []} />
    </section>
  );
}
