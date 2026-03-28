"use client";

import { useMemo } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/ui/DataTable";
import { useActiveWorkflowsQuery } from "@/features/workflows/queries";

type ActiveExecutionRow = {
  id: string;
  workflowId: string;
  status: string;
  startedAt: string;
};

export default function ActiveWorkflowsPage() {
  const { data, isLoading, isError } = useActiveWorkflowsQuery();

  const columns = useMemo<Array<ColumnDef<ActiveExecutionRow>>>(
    () => [
      { accessorKey: "workflowId", header: "Workflow" },
      { accessorKey: "status", header: "Status" },
      { accessorKey: "startedAt", header: "Started" },
      { accessorKey: "id", header: "Execution" },
    ],
    [],
  );

  if (isLoading) return <div className="page-state">Loading active workflows...</div>;
  if (isError) return <div className="page-state">Failed to load active workflows.</div>;

  return (
    <section className="detail-page-shell active-workflows-shell">
      <header className="detail-page-header">
        <p className="detail-page-eyebrow">Live Operations</p>
        <h1>Active Workflows</h1>
        <p className="detail-page-subtitle">Live execution activity across workflows.</p>
      </header>
      <div className="detail-table-wrap">
        <DataTable columns={columns} data={data ?? []} />
      </div>
    </section>
  );
}
