"use client";

import { useGovernanceKpisQuery } from "@/features/governance/queries";
import { MetricsCardGrid } from "@/components/governance/MetricsCardGrid";

export default function KpiPage() {
  const { data, isLoading, isError } = useGovernanceKpisQuery();

  if (isLoading) return <div className="page-state">Loading KPI metrics...</div>;
  if (isError) return <div className="page-state">Failed to load KPI metrics.</div>;

  return (
    <section className="kpi-page-shell">
      <p className="kpi-page-eyebrow">Governance Analytics</p>
      <h1>KPI & Metrics</h1>
      <p className="kpi-page-subtitle">Operational governance indicators across tenant workloads.</p>
      <MetricsCardGrid metrics={data ?? []} />
    </section>
  );
}
