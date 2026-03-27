"use client";

import { useState, useCallback } from "react";
import { ListPageWrapper } from "@/components/ui/ListPageWrapper";
import { GovernanceFilters } from "@/components/governance/GovernanceFilters";
import { AlertRulesTable } from "@/components/governance/AlertRulesTable";
import { useGovernanceAlertRulesQuery } from "@/features/governance/queries";
import { Button } from "@/components/ui/Button";

export default function AlertsPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");

  const { data, isLoading, isError } = useGovernanceAlertRulesQuery({ page, limit: 20, search });

  const isEmpty = !isLoading && !isError && (!data || data.length === 0);

  const handleResetFilters = useCallback(() => {
    setSearch("");
    setPage(1);
  }, []);

  return (
    <ListPageWrapper
      title="Alerts"
      subtitle="Alert rule definitions and monitoring surface"
      headerActions={
        <Button variant="primary" onClick={() => {}}>
          Create Alert Rule
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
      errorMessage="Failed to load alert rules."
      isEmpty={isEmpty}
      emptyTitle="No alert rules defined"
      emptyDescription="Create alert rules to monitor your system."
      emptyAction={
        <Button variant="primary" onClick={() => {}}>
          Create First Alert Rule
        </Button>
      }
      current={page}
      total={data?.length ?? 0}
      pageSize={20}
      onPageChange={setPage}
    >
      <AlertRulesTable rules={data ?? []} />
    </ListPageWrapper>
  );
}
