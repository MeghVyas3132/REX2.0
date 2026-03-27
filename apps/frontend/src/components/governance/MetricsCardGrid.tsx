"use client";

import { Card } from "@/components/ui/Card";
import type { GovernanceKpi } from "@/features/governance/types";

export type MetricsCardGridProps = {
  metrics: GovernanceKpi[];
};

export function MetricsCardGrid({ metrics }: MetricsCardGridProps) {
  return (
    <div style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))" }}>
      {metrics.map((metric) => (
        <Card key={metric.key} title={metric.label}>
          <p>Value: {metric.value}</p>
          <p>Trend: {metric.trend}%</p>
        </Card>
      ))}
    </div>
  );
}
