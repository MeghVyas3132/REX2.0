"use client";

import dynamic from "next/dynamic";
import { Card } from "@/components/ui/Card";
import { useComplianceQuery } from "@/features/compliance/queries";

const ComplianceOverviewChart = dynamic(
  () =>
    import("@/components/compliance/ComplianceOverviewChart").then(
      (mod) => mod.ComplianceOverviewChart,
    ),
  {
    ssr: false,
    loading: () => <div className="page-state">Loading compliance charts...</div>,
  },
);

export default function ComplianceReportPage() {
  const consent = useComplianceQuery("consent", 1, 20);
  const dsar = useComplianceQuery("dsar", 1, 20);

  if (consent.isLoading || dsar.isLoading) return <div className="page-state">Loading compliance report...</div>;
  if (consent.isError || dsar.isError) return <div className="page-state">Failed to load compliance report.</div>;

  const consentTotal = consent.data?.records.length ?? 0;
  const dsarTotal = dsar.data?.records.length ?? 0;

  return (
    <section>
      <h1>Compliance Report</h1>
      <p>High-level compliance snapshot for current tenant.</p>
      <div style={{ display: "grid", gap: 12 }}>
        <Card title="Consent Records">
          <p>Total loaded: {consentTotal}</p>
        </Card>
        <Card title="DSAR Requests">
          <p>Total loaded: {dsarTotal}</p>
        </Card>
        <Card title="Compliance Volume Overview">
          <ComplianceOverviewChart consentTotal={consentTotal} dsarTotal={dsarTotal} />
        </Card>
      </div>
    </section>
  );
}
