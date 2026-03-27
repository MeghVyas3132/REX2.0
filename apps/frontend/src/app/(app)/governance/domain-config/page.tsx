"use client";

import { useMemo } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/ui/DataTable";
import { useGovernancePoliciesQuery } from "@/features/governance/queries";

type PolicyRow = {
  id: string;
  name: string;
  effect: string;
  updatedAt: string;
};

export default function DomainConfigPage() {
  const { data, isLoading, isError } = useGovernancePoliciesQuery({ page: 1, limit: 20 });

  const columns = useMemo<Array<ColumnDef<PolicyRow>>>(
    () => [
      { accessorKey: "name", header: "Policy" },
      { accessorKey: "effect", header: "Effect" },
      { accessorKey: "updatedAt", header: "Updated" },
      { accessorKey: "id", header: "ID" },
    ],
    [],
  );

  if (isLoading) return <div className="page-state">Loading domain configuration...</div>;
  if (isError) return <div className="page-state">Failed to load domain configuration.</div>;

  return (
    <section>
      <h1>Domain Configuration</h1>
      <p>Domain-level configuration and policy mappings.</p>
      <DataTable columns={columns} data={(data ?? []) as unknown as PolicyRow[]} />
    </section>
  );
}
