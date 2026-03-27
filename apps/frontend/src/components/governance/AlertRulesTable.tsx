"use client";

import { useMemo } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/ui/DataTable";
import { Button } from "@/components/ui/Button";
import type { AlertRule } from "@/features/governance/types";

export type AlertRulesTableProps = {
  rules: AlertRule[];
  onEdit?: (ruleId: string) => void;
};

export function AlertRulesTable({ rules, onEdit }: AlertRulesTableProps) {
  const columns = useMemo<Array<ColumnDef<AlertRule>>>(
    () => [
      { accessorKey: "name", header: "Alert Rule" },
      { accessorKey: "severity", header: "Severity" },
      { accessorKey: "enabled", header: "Enabled", cell: ({ row }) => (row.original.enabled ? "Yes" : "No") },
      {
        id: "actions",
        header: "Actions",
        cell: ({ row }) =>
          onEdit ? (
            <Button variant="secondary" onClick={() => onEdit(row.original.id)}>
              Edit
            </Button>
          ) : null,
      },
    ],
    [onEdit],
  );

  return <DataTable columns={columns} data={rules} />;
}
