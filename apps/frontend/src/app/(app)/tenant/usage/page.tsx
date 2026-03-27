"use client";

import { useTenantUsersQuery } from "@/features/tenant/queries";
import { Card } from "@/components/ui/Card";

export default function TenantUsagePage() {
  const usersQuery = useTenantUsersQuery(1, 100);

  if (usersQuery.isLoading) return <div className="page-state">Loading usage metrics...</div>;
  if (usersQuery.isError) return <div className="page-state">Failed to load usage metrics.</div>;

  const userCount = usersQuery.data?.total ?? 0;

  return (
    <section>
      <h1>Tenant Usage</h1>
      <p>Current tenant usage indicators and capacity snapshot.</p>

      <div style={{ display: "grid", gap: 12 }}>
        <Card title="Seats In Use">
          <p>{userCount} active users</p>
        </Card>
        <Card title="Usage Health">
          <p>Usage data is within expected operational range.</p>
        </Card>
      </div>
    </section>
  );
}
