"use client";

import { Card } from "@/components/ui/Card";
import { useTenantSettingsQuery } from "@/features/tenant/queries";
import { RequireRole } from "@/lib/rbac/guards";

export default function TenantSettingsPage() {
  const { data, isLoading, isError } = useTenantSettingsQuery();

  return (
    <RequireRole roles={["super_admin", "org_admin"]}>
      <section>
        <h1>Tenant Settings</h1>
        <p>Configuration and billing metadata for your organization.</p>

        {isLoading ? <div className="page-state">Loading settings...</div> : null}
        {isError ? <div className="page-state">Failed to load settings.</div> : null}
        {!isLoading && !isError && data ? (
          <Card title="Current Settings">
            <p>Name: {data.name}</p>
            <p>Email: {data.email}</p>
            <p>Billing configured: {data.billing ? "Yes" : "No"}</p>
          </Card>
        ) : null}
      </section>
    </RequireRole>
  );
}
