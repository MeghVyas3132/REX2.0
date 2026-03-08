"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api, type KpiSummaryClient, type KpiTimeseriesPointClient } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";

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

  if (authLoading || !token) return null;

  return (
    <div style={styles.layout}>
      <nav style={styles.sidebar}>
        <div style={styles.brand}>REX</div>
        <div style={styles.navLinks}>
          <Link href="/dashboard" style={styles.navLink}>Workflows</Link>
          <Link href="/dashboard/active-workflows" style={styles.navLink}>Active Workflows</Link>
          <Link href="/dashboard/current-workflow" style={styles.navLink}>Current Workflow</Link>
          <Link href="/dashboard/corpora" style={styles.navLink}>Corpora</Link>
          <Link href="/dashboard/kpi" style={styles.navLinkActive}>KPI</Link>
          <Link href="/dashboard/templates" style={styles.navLink}>Templates</Link>
          <Link href="/dashboard/settings" style={styles.navLink}>Settings</Link>
        </div>
        <div style={styles.userSection}>
          <span style={styles.userName}>{user?.name}</span>
          <button onClick={logout} style={styles.logoutBtn}>Sign Out</button>
        </div>
      </nav>

      <main style={styles.main}>
        <div style={styles.headerRow}>
          <h1 style={styles.heading}>KPI & Observability</h1>
          <select
            value={String(days)}
            onChange={(event) => setDays(Number(event.target.value))}
            style={styles.windowSelect}
          >
            <option value="7">Last 7 days</option>
            <option value="14">Last 14 days</option>
            <option value="30">Last 30 days</option>
          </select>
        </div>

        {error ? <p style={styles.error}>{error}</p> : null}
        {loading || !summary ? (
          <p style={styles.muted}>Loading KPI metrics...</p>
        ) : (
          <>
            <div style={styles.grid}>
              <MetricCard label="Avg Step Latency" value={`${summary.latency.avgStepMs} ms`} />
              <MetricCard label="P95 Step Latency" value={`${summary.latency.p95StepMs} ms`} />
              <MetricCard label="Retrieval Hit Rate" value={`${summary.retrieval.hitRate}%`} />
              <MetricCard label="Guardrail Triggered" value={String(summary.guardrails.triggered)} />
              <MetricCard label="Latency Breaches" value={String(summary.latency.breaches)} />
              <MetricCard label="Corpus Failures" value={String(summary.corpus.failedDocuments)} />
            </div>

            <div style={styles.card}>
              <h2 style={styles.cardTitle}>Latest Day Snapshot</h2>
              {latest ? (
                <div style={styles.snapshotRow}>
                  <span>Date: {latest.date}</span>
                  <span>Executions: {latest.executions}</span>
                  <span>Failures: {latest.failures}</span>
                  <span>Avg Step: {latest.avgStepMs} ms</span>
                  <span>Hit Rate: {latest.retrievalHitRate}%</span>
                </div>
              ) : (
                <p style={styles.muted}>No data for this window.</p>
              )}
            </div>

            <div style={styles.card}>
              <h2 style={styles.cardTitle}>Daily Trend</h2>
              {timeseries.length === 0 ? (
                <p style={styles.muted}>No time-series data available.</p>
              ) : (
                <table style={styles.table}>
                  <thead>
                    <tr>
                      <th style={styles.th}>Date</th>
                      <th style={styles.th}>Executions</th>
                      <th style={styles.th}>Failures</th>
                      <th style={styles.th}>Avg Step (ms)</th>
                      <th style={styles.th}>Retrieval Hit %</th>
                      <th style={styles.th}>Guardrail Triggers</th>
                    </tr>
                  </thead>
                  <tbody>
                    {timeseries.map((point) => (
                      <tr key={point.date}>
                        <td style={styles.td}>{point.date}</td>
                        <td style={styles.td}>{point.executions}</td>
                        <td style={styles.td}>{point.failures}</td>
                        <td style={styles.td}>{point.avgStepMs}</td>
                        <td style={styles.td}>{point.retrievalHitRate}%</td>
                        <td style={styles.td}>{point.guardrailTriggers}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </>
        )}
      </main>
    </div>
  );
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div style={styles.metricCard}>
      <p style={styles.metricLabel}>{label}</p>
      <p style={styles.metricValue}>{value}</p>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  layout: { display: "flex", minHeight: "100vh", backgroundColor: "#0a0a0a" },
  sidebar: {
    width: "220px",
    backgroundColor: "#111111",
    borderRight: "1px solid #2a2a2a",
    display: "flex",
    flexDirection: "column",
    padding: "20px 16px",
  },
  brand: {
    fontSize: "20px",
    fontWeight: 700,
    color: "#e5e5e5",
    letterSpacing: "3px",
    marginBottom: "32px",
  },
  navLinks: { display: "flex", flexDirection: "column", gap: "4px", flex: 1 },
  navLink: {
    padding: "10px 12px",
    borderRadius: "6px",
    color: "#999999",
    fontSize: "14px",
    textDecoration: "none",
  },
  navLinkActive: {
    padding: "10px 12px",
    borderRadius: "6px",
    backgroundColor: "#1a1a1a",
    color: "#e5e5e5",
    fontSize: "14px",
    textDecoration: "none",
    fontWeight: 500,
  },
  userSection: {
    borderTop: "1px solid #2a2a2a",
    paddingTop: "16px",
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  },
  userName: { fontSize: "13px", color: "#999999" },
  logoutBtn: {
    background: "none",
    border: "1px solid #2a2a2a",
    color: "#666666",
    padding: "6px 12px",
    borderRadius: "4px",
    cursor: "pointer",
    fontSize: "12px",
  },
  main: { flex: 1, padding: "32px 40px" },
  headerRow: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" },
  heading: { fontSize: "24px", fontWeight: 600, color: "#e5e5e5" },
  windowSelect: {
    backgroundColor: "#111111",
    color: "#e5e5e5",
    border: "1px solid #2a2a2a",
    borderRadius: "6px",
    padding: "8px 10px",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
    gap: "12px",
    marginBottom: "16px",
  },
  metricCard: {
    backgroundColor: "#111111",
    border: "1px solid #2a2a2a",
    borderRadius: "8px",
    padding: "16px",
  },
  metricLabel: { color: "#999999", fontSize: "12px", marginBottom: "6px" },
  metricValue: { color: "#e5e5e5", fontSize: "20px", fontWeight: 600 },
  card: {
    backgroundColor: "#111111",
    border: "1px solid #2a2a2a",
    borderRadius: "8px",
    padding: "16px",
    marginBottom: "16px",
  },
  cardTitle: { color: "#e5e5e5", fontSize: "15px", marginBottom: "10px" },
  snapshotRow: { display: "flex", gap: "16px", color: "#b3b3b3", fontSize: "13px", flexWrap: "wrap" },
  table: { width: "100%", borderCollapse: "collapse" },
  th: {
    textAlign: "left",
    fontSize: "12px",
    color: "#777777",
    borderBottom: "1px solid #2a2a2a",
    paddingBottom: "8px",
  },
  td: { color: "#d4d4d4", fontSize: "13px", paddingTop: "10px", paddingBottom: "10px" },
  muted: { color: "#666666", fontSize: "14px" },
  error: { color: "#ef4444", fontSize: "13px", marginBottom: "12px" },
};
