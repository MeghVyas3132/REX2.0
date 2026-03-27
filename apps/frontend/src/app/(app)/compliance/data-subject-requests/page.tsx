"use client";

import { useMemo } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/ui/DataTable";
import { useComplianceQuery } from "@/features/compliance/queries";

type DsarRow = {
  id: string;
  status: string;
  createdAt: string;
  updatedAt: string;
};

export default function DataSubjectRequestsPage() {
  const query = useComplianceQuery("dsar", 1, 20);

  const columns = useMemo<Array<ColumnDef<DsarRow>>>(
    () => [
      { accessorKey: "id", header: "Request" },
      { accessorKey: "status", header: "Status" },
      { accessorKey: "createdAt", header: "Created" },
      { accessorKey: "updatedAt", header: "Updated" },
    ],
    [],
  );

  if (query.isLoading) return <div className="page-state">Loading data subject requests...</div>;
  if (query.isError) return <div className="page-state">Failed to load data subject requests.</div>;

  return (
    <section>
      <h1>Data Subject Requests</h1>
      <p>Queue of privacy requests raised by data subjects.</p>
      <DataTable columns={columns} data={query.data?.records ?? []} />
    </section>
  );
}
