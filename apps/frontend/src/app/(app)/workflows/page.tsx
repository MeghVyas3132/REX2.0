"use client";

import { useMemo, useState, useCallback, useEffect } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { useRouter } from "next/navigation";
import { DataTable } from "@/components/ui/DataTable";
import { ListPageWrapper } from "@/components/ui/ListPageWrapper";
import { WorkflowFilters } from "@/components/workflows/WorkflowFilters";
import { WorkflowHeaderActions } from "@/components/workflows/WorkflowHeaderActions";
import { useWorkflowsQuery } from "@/features/workflows/queries";
import { Button } from "@/components/ui/Button";
import { telemetry, useTelemetryPageView } from "@/lib/telemetry/observability";

type WorkflowRow = {
  id: string;
  name: string;
  status: string;
  version: number;
};

export default function WorkflowsPage() {
  const router = useRouter();
  const [page, setPage] = useState(1);

  const { data, isLoading, isError } = useWorkflowsQuery(page, 20);
  useTelemetryPageView("workflows.list", { page });

  useEffect(() => {
    if (isError) {
      telemetry.trackQueryError("workflows", "Failed to load workflows list");
    }
  }, [isError]);

  const isEmpty = !isLoading && !isError && (!data?.data || data.data.length === 0);

  const columns = useMemo<Array<ColumnDef<WorkflowRow>>>(
    () => [
      { accessorKey: "name", header: "Workflow" },
      { accessorKey: "status", header: "Status" },
      { accessorKey: "version", header: "Version" },
      {
        id: "actions",
        header: "Actions",
        cell: ({ row }) => (
          <Button
            variant="secondary"
            onClick={() => {
              telemetry.trackAction("workflow_view_click", "workflow", row.original.id);
              router.push(`/workflows/${row.original.id}`);
            }}
          >
            View
          </Button>
        ),
      },
    ],
    [router],
  );

  const handleNewWorkflow = useCallback(() => {
    telemetry.trackAction("workflow_new_click", "workflow");
    router.push("/workflows/new");
  }, [router]);

  const handleResetFilters = useCallback(() => {
    setPage(1);
  }, []);

  return (
    <ListPageWrapper
      title="Workflows"
      subtitle="Create and manage workflow definitions"
      headerActions={
        <WorkflowHeaderActions
          onNew={handleNewWorkflow}
          isLoading={isLoading}
        />
      }
      filters={
        <WorkflowFilters
          onSearchChange={() => setPage(1)}
          onStatusChange={() => setPage(1)}
          onReset={handleResetFilters}
          isLoading={isLoading}
        />
      }
      isLoading={isLoading}
      isError={isError}
      errorMessage="Failed to load workflows."
      isEmpty={isEmpty}
      emptyTitle="No workflows yet"
      emptyDescription="Create your first workflow to get started."
      emptyAction={
        <Button variant="primary" onClick={handleNewWorkflow}>
          Create Workflow
        </Button>
      }
      current={page}
      total={data?.meta?.total ?? 0}
      pageSize={20}
      onPageChange={setPage}
    >
      <DataTable columns={columns} data={data?.data ?? []} />
    </ListPageWrapper>
  );
}
