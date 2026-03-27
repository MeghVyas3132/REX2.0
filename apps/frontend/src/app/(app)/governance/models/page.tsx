"use client";

import { Card } from "@/components/ui/Card";
import { useGovernanceKpisQuery } from "@/features/governance/queries";

export default function ModelsPage() {
  const { data, isLoading, isError } = useGovernanceKpisQuery();

  if (isLoading) return <div className="page-state">Loading model governance...</div>;
  if (isError) return <div className="page-state">Failed to load model governance.</div>;

  return (
    <section>
      <h1>LLM Models</h1>
      <p>Model behavior and quality indicators.</p>
      <Card title="KPI Snapshot">
        <pre style={{ margin: 0 }}>{JSON.stringify(data, null, 2)}</pre>
      </Card>
    </section>
  );
}
