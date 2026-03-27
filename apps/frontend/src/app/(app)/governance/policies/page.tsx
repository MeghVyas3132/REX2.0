"use client";

import { useMemo, useState, useCallback, useEffect } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/ui/DataTable";
import { ListPageWrapper } from "@/components/ui/ListPageWrapper";
import { GovernanceFilters } from "@/components/governance/GovernanceFilters";
import { useGovernancePoliciesQuery } from "@/features/governance/queries";
import { Button } from "@/components/ui/Button";
import { telemetry, useTelemetryPageView } from "@/lib/telemetry/observability";

type PolicyRow = {
  id: string;
  name: string;
  effect: string;
  updatedAt: string;
};

export default function PoliciesPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");

  const { data, isLoading, isError } = useGovernancePoliciesQuery({ page, limit: 20, search });
  useTelemetryPageView("governance.policies", { page, search });

  useEffect(() => {
    if (isError) {
      telemetry.trackQueryError("governance", "Failed to load policies");
    }
  }, [isError]);

  const isEmpty = !isLoading && !isError && (!data || data.length === 0);

  const columns = useMemo<Array<ColumnDef<PolicyRow>>>(
    () => [
      { accessorKey: "name", header: "Policy" },
      { accessorKey: "effect", header: "Effect" },
      { accessorKey: "updatedAt", header: "Updated" },
      {
        id: "actions",
        header: "Actions",
        cell: ({ row: policyRow }) => (
          <Button
            variant="secondary"
            onClick={() => {
              telemetry.trackAction("policy_edit_click", "governance_policy", policyRow.original.id);
            }}
          >
            Edit
          </Button>
        ),
      },
    ],
    [],
  );

  const handleResetFilters = useCallback(() => {
    setSearch("");
    setPage(1);
  }, []);

  return (
    <ListPageWrapper
      title="Policies"
      subtitle="Access and governance policy definitions"
      headerActions={
        <Button
          variant="primary"
          onClick={() => {
            telemetry.trackAction("policy_create_click", "governance_policy");
          }}
        >
          Create Policy
        </Button>
      }
      filters={
        <GovernanceFilters
          onSearchChange={(q) => {
            setSearch(q);
            setPage(1);
          }}
          onReset={handleResetFilters}
          isLoading={isLoading}
        />
      }
      isLoading={isLoading}
      isError={isError}
      errorMessage="Failed to load policies."
      isEmpty={isEmpty}
      emptyTitle="No policies defined"
      emptyDescription="Create a new policy to get started."
      emptyAction={
        <Button
          variant="primary"
          onClick={() => {
            telemetry.trackAction("policy_create_click", "governance_policy");
          }}
        >
          Create Policy
        </Button>
      }
      current={page}
      total={data?.length ?? 0}
      pageSize={20}
      onPageChange={setPage}
    >
      <DataTable columns={columns} data={data ?? []} />
    </ListPageWrapper>
  );
}
