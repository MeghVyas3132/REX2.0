"use client";

import { useMemo } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/ui/DataTable";
import type { ComplianceRecord } from "@/features/compliance/api";

export type ConsentTableProps = {
  records: ComplianceRecord[];
};

export function ConsentTable({ records }: ConsentTableProps) {
  const columns = useMemo<Array<ColumnDef<ComplianceRecord>>>(
    () => [
      { accessorKey: "id", header: "Record" },
      { accessorKey: "status", header: "Status" },
      { accessorKey: "createdAt", header: "Created" },
      { accessorKey: "updatedAt", header: "Updated" },
    ],
    [],
  );

  return <DataTable columns={columns} data={records} />;
}
