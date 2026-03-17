"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { api, type KpiSummaryClient, type KpiTimeseriesPointClient } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { AppShell, getDashboardNavItems } from "@/components/layout";
import { Card, StateBlock } from "@/components/ui";

export default function KpiPage() {
  const { user, token, loading: authLoading, logout } = useAuth();
  const [days, setDays] = useState(7);
  const [summary, setSummary] = useState<KpiSummaryClient | null>(null);
  const [timeseries, setTimeseries] = useState<KpiTimeseriesPointClient[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    if (authLoading) return;
    if (!token) {
      router.push("/login");
      return;
    }
    void loadKpi(days);
  }, [authLoading, token, days]);

  async function loadKpi(windowDays: number): Promise<void> {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const [summaryRes, timeseriesRes] = await Promise.all([
        api.kpi.summary(token, windowDays),
        api.kpi.timeseries(token, windowDays),
      ]);
      setSummary(summaryRes.data);
      setTimeseries(timeseriesRes.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load KPI");
    } finally {
      setLoading(false);
    }
  }

  const latest = useMemo(() => timeseries[timeseries.length - 1] ?? null, [timeseries]);
  const metricItems = summary
    ? [
        { label: "Avg Step Latency", value: `${summary.latency.avgStepMs} ms` },
        { label: "P95 Step Latency", value: `${summary.latency.p95StepMs} ms` },
        { label: "Retrieval Hit Rate", value: `${summary.retrieval.hitRate}%` },
        { label: "Guardrail Triggered", value: String(summary.guardrails.triggered) },
        { label: "Latency Breaches", value: String(summary.latency.breaches) },
        { label: "Corpus Failures", value: String(summary.corpus.failedDocuments) },
      ]
    : [];

  if (authLoading || !token) return null;

  return (
    <AppShell
      title="KPI & Observability"
      subtitle="Track latency, reliability, retrieval quality, and guardrail activity across workflow execution windows."
      navItems={getDashboardNavItems("kpi")}
      userName={user?.name}
      onSignOut={logout}
      action={
        <select
          className="rex-kpi-window"
          value={String(days)}
          onChange={(event) => setDays(Number(event.target.value))}
          style={windowSelectStyle}
        >
          <option value="7">Last 7 days</option>
          <option value="14">Last 14 days</option>
          <option value="30">Last 30 days</option>
        </select>
      }
    >
      {error ? (
        <StateBlock tone="error" title="Unable to load KPI metrics" description={error} />
      ) : null}
      {loading || !summary ? (
        <StateBlock tone="loading" title="Loading KPI metrics" description="Calculating reliability, latency, and retrieval quality for this window." />
      ) : (
        <>
          <div style={gridStyle}>
            {metricItems.map((metric, index) => (
              <MetricCard
                key={metric.label}
                label={metric.label}
                value={metric.value}
                delayMs={Math.min(index * 34, 260)}
              />
            ))}
          </div>

          <Card title="Latest Day Snapshot" className="stagger-in" style={{ marginTop: 14, animationDelay: "120ms" }}>
            {latest ? (
              <div style={snapshotRowStyle}>
                <span>Date: {latest.date}</span>
                <span>Executions: {latest.executions}</span>
                <span>Failures: {latest.failures}</span>
                <span>Avg Step: {latest.avgStepMs} ms</span>
                <span>Hit Rate: {latest.retrievalHitRate}%</span>
              </div>
            ) : (
              <p style={mutedStyle}>No data for this window.</p>
            )}
          </Card>

          <Card title="Daily Trend" className="stagger-in" style={{ marginTop: 14, animationDelay: "180ms" }}>
            {timeseries.length === 0 ? (
              <p style={mutedStyle}>No time-series data available.</p>
            ) : (
              <table style={tableStyle}>
                <thead>
                  <tr>
                    <th style={thStyle}>Date</th>
                    <th style={thStyle}>Executions</th>
                    <th style={thStyle}>Failures</th>
                    <th style={thStyle}>Avg Step (ms)</th>
                    <th style={thStyle}>Retrieval Hit %</th>
                    <th style={thStyle}>Guardrail Triggers</th>
                  </tr>
                </thead>
                <tbody>
                  {timeseries.map((point) => (
                    <tr key={point.date}>
                      <td style={tdStyle}>{point.date}</td>
                      <td style={tdStyle}>{point.executions}</td>
                      <td style={tdStyle}>{point.failures}</td>
                      <td style={tdStyle}>{point.avgStepMs}</td>
                      <td style={tdStyle}>{point.retrievalHitRate}%</td>
                      <td style={tdStyle}>{point.guardrailTriggers}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </Card>
        </>
      )}
    </AppShell>
  );
}

function MetricCard({ label, value, delayMs }: { label: string; value: string; delayMs?: number }) {
  return (
    <Card className="stagger-in" style={{ animationDelay: `${delayMs ?? 0}ms` }}>
      <p style={metricLabelStyle}>{label}</p>
      <p style={metricValueStyle}>{value}</p>
    </Card>
  );
}

const windowSelectStyle: React.CSSProperties = {
  backgroundColor: "var(--surface-2)",
  color: "var(--text-primary)",
  border: "1px solid var(--border-strong)",
  borderRadius: 10,
  padding: "8px 10px",
};

const gridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
  gap: 12,
};

const metricLabelStyle: React.CSSProperties = {
  margin: 0,
  color: "var(--text-tertiary)",
  fontSize: 12,
};

const metricValueStyle: React.CSSProperties = {
  margin: "8px 0 0",
  color: "var(--text-primary)",
  fontSize: 20,
  fontWeight: 600,
};

const snapshotRowStyle: React.CSSProperties = {
  display: "flex",
  gap: 16,
  color: "var(--text-secondary)",
  fontSize: 13,
  flexWrap: "wrap",
};

const tableStyle: React.CSSProperties = {
  width: "100%",
  borderCollapse: "collapse",
};

const thStyle: React.CSSProperties = {
  textAlign: "left",
  fontSize: 12,
  color: "var(--text-tertiary)",
  borderBottom: "1px solid var(--border-muted)",
  paddingBottom: 8,
};

const tdStyle: React.CSSProperties = {
  color: "var(--text-secondary)",
  fontSize: 13,
  paddingTop: 10,
  paddingBottom: 10,
};

const mutedStyle: React.CSSProperties = {
  color: "var(--text-tertiary)",
  fontSize: 14,
};
