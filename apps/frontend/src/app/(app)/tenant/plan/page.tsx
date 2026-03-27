"use client";

import { useTenantSettingsQuery } from "@/features/tenant/queries";
import { Card } from "@/components/ui/Card";

export default function TenantPlanPage() {
  const query = useTenantSettingsQuery();

  if (query.isLoading) return <div className="page-state">Loading tenant plan...</div>;
  if (query.isError || !query.data) return <div className="page-state">Failed to load tenant plan.</div>;

  return (
    <section>
      <h1>Tenant Plan</h1>
      <p>Subscription and billing visibility for this tenant.</p>

      <Card title="Plan Summary">
        <p>Tenant: {query.data.name}</p>
        <p>Billing Contact: {query.data.email}</p>
        <p>Billing Metadata: {query.data.billing ? "Configured" : "Not configured"}</p>
      </Card>
    </section>
  );
}
