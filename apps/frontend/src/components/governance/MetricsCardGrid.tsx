"use client";

import { Card } from "@/components/ui/Card";
import type { GovernanceKpi } from "@/features/governance/types";

export type MetricsCardGridProps = {
  metrics: GovernanceKpi[];
};

export function MetricsCardGrid({ metrics }: MetricsCardGridProps) {
  return (
    <div className="kpi-metrics-grid" style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))" }}>
      {metrics.map((metric) => (
        <Card className="kpi-metric-card" key={metric.key} title={metric.label}>
          <p className="kpi-metric-value">Value: {metric.value}</p>
          <p className="kpi-metric-trend">Trend: {metric.trend}%</p>
        </Card>
      ))}
    </div>
  );
}
