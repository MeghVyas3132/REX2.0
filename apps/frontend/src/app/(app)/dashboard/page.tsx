"use client";

import { Card } from "@/components/ui/Card";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const sampleSeries = [
  { day: "Mon", runs: 12 },
  { day: "Tue", runs: 18 },
  { day: "Wed", runs: 15 },
  { day: "Thu", runs: 24 },
  { day: "Fri", runs: 21 },
  { day: "Sat", runs: 9 },
  { day: "Sun", runs: 14 },
];

export default function DashboardPage() {
  return (
    <section className="dashboard-page">
      <header className="dashboard-page-header card">
        <h1>Dashboard</h1>
        <p>Operational summary for workflows and execution activity.</p>
      </header>

      <Card className="dashboard-trend-card" title="Execution Trend (sample baseline)">
        <div style={{ width: "100%", height: 260 }}>
          <ResponsiveContainer>
            <AreaChart data={sampleSeries}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="day" />
              <YAxis />
              <Tooltip />
              <Area type="monotone" dataKey="runs" stroke="#0e7490" fill="#8dd3df" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </Card>
    </section>
  );
}
