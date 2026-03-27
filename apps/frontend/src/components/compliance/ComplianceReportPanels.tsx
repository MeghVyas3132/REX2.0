"use client";

import { Card } from "@/components/ui/Card";

export type ComplianceReportPanelsProps = {
  consentTotal: number;
  dsarTotal: number;
  legalBasisTotal?: number;
};

export function ComplianceReportPanels({ consentTotal, dsarTotal, legalBasisTotal = 0 }: ComplianceReportPanelsProps) {
  return (
    <div style={{ display: "grid", gap: 12 }}>
      <Card title="Consent Records">
        <p>Total loaded: {consentTotal}</p>
      </Card>
      <Card title="DSAR Requests">
        <p>Total loaded: {dsarTotal}</p>
      </Card>
      <Card title="Legal Basis Records">
        <p>Total loaded: {legalBasisTotal}</p>
      </Card>
    </div>
  );
}
