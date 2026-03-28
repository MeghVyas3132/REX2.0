"use client";

import { use, useMemo } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/ui/DataTable";
import { useWorkflowExecutionsQuery } from "@/features/workflows/queries";

type WorkflowExecutionRow = {
  id: string;
  status: string;
  startedAt: string;
  completedAt?: string;
};

export default function WorkflowExecutionsPage({ params }: { params: Promise<{ workflowId: string }> }) {
  const { workflowId: rawWorkflowId } = use(params);
  const workflowId = decodeURIComponent(rawWorkflowId);
  const { data, isLoading, isError } = useWorkflowExecutionsQuery(workflowId, 1, 20);

  const columns = useMemo<Array<ColumnDef<WorkflowExecutionRow>>>(
    () => [
      { accessorKey: "id", header: "Execution" },
      { accessorKey: "status", header: "Status" },
      { accessorKey: "startedAt", header: "Started" },
      { accessorKey: "completedAt", header: "Completed" },
    ],
    [],
  );

  if (isLoading) return <div className="page-state">Loading workflow executions...</div>;
  if (isError) return <div className="page-state">Failed to load workflow executions.</div>;

  return (
    <section className="detail-page-shell workflow-executions-shell">
      <header className="detail-page-header">
        <p className="detail-page-eyebrow">Workflow Activity</p>
        <h1>Workflow Executions</h1>
        <p className="detail-page-subtitle">Workflow: {workflowId}</p>
      </header>
      <div className="detail-table-wrap">
        <DataTable columns={columns} data={data ?? []} />
      </div>
    </section>
  );
}
