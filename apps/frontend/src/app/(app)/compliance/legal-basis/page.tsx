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

export default function LegalBasisPage() {
  const { data, isLoading, isError } = useComplianceQuery("legal_basis", 1, 20);

  const columns = useMemo<Array<ColumnDef<ComplianceRow>>>(
    () => [
      { accessorKey: "id", header: "Record" },
      { accessorKey: "status", header: "Status" },
      { accessorKey: "createdAt", header: "Created" },
      { accessorKey: "updatedAt", header: "Updated" },
    ],
    [],
  );

  if (isLoading) return <div className="page-state">Loading legal basis records...</div>;
  if (isError) return <div className="page-state">Failed to load legal basis records.</div>;

  return (
    <section>
      <h1>Legal Basis</h1>
      <p>Track legal basis declarations and status.</p>
      <DataTable columns={columns} data={data?.records ?? []} />
    </section>
  );
}
