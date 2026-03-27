"use client";

import { useMemo } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/ui/DataTable";
import { useGovernanceAlertRulesQuery } from "@/features/governance/queries";

type AlertRow = {
  id: string;
  name: string;
  severity: string;
  enabled: boolean;
};

export default function HyperparametersPage() {
  const { data, isLoading, isError } = useGovernanceAlertRulesQuery({ page: 1, limit: 20 });

  const columns = useMemo<Array<ColumnDef<AlertRow>>>(
    () => [
      { accessorKey: "name", header: "Rule" },
      { accessorKey: "severity", header: "Severity" },
      {
        accessorKey: "enabled",
        header: "Enabled",
        cell: ({ row }) => (row.original.enabled ? "Yes" : "No"),
      },
      { accessorKey: "id", header: "ID" },
    ],
    [],
  );

  if (isLoading) return <div className="page-state">Loading hyperparameters...</div>;
  if (isError) return <div className="page-state">Failed to load hyperparameters.</div>;

  return (
    <section>
      <h1>Hyperparameters</h1>
      <p>Execution tuning and threshold guardrails.</p>
      <DataTable columns={columns} data={(data ?? []) as AlertRow[]} />
    </section>
  );
}
