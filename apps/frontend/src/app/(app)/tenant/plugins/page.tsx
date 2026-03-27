"use client";

import { Card } from "@/components/ui/Card";

export default function TenantPluginsPage() {
  return (
    <section>
      <h1>Tenant Plugins</h1>
      <p>Installed plugins and runtime enablement status.</p>

      <Card title="Plugin Management">
        <p>Plugin controls are managed by super admins through the admin plugin registry.</p>
        <p>Tenant-level visibility and compatibility checks are shown here.</p>
      </Card>
    </section>
  );
}
