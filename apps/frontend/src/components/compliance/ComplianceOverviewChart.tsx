"use client";

import { ResponsiveContainer, BarChart, Bar, CartesianGrid, Tooltip, XAxis, YAxis } from "recharts";

type ComplianceOverviewChartProps = {
  consentTotal: number;
  dsarTotal: number;
};

export function ComplianceOverviewChart({ consentTotal, dsarTotal }: ComplianceOverviewChartProps) {
  const chartData = [
    { category: "Consents", total: consentTotal },
    { category: "DSAR", total: dsarTotal },
  ];

  return (
    <div style={{ width: "100%", height: 240 }}>
      <ResponsiveContainer>
        <BarChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="category" />
          <YAxis allowDecimals={false} />
          <Tooltip />
          <Bar dataKey="total" fill="#0e7490" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
