"use client";

import { Card } from "@/components/ui/Card";
import { useTenantSettingsQuery } from "@/features/tenant/queries";

export default function TenantProfilePage() {
  const { data, isLoading, isError } = useTenantSettingsQuery();

  if (isLoading) return <div className="page-state">Loading tenant profile...</div>;
  if (isError || !data) return <div className="page-state">Failed to load tenant profile.</div>;

  return (
    <section>
      <h1>Tenant Profile</h1>
      <p>Organization identity and contact details.</p>

      <Card title="Profile">
        <p>Name: {data.name}</p>
        <p>Email: {data.email}</p>
      </Card>
    </section>
  );
}
