"use client";

import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

export default function PrivacyPage() {
  return (
    <section>
      <h1>Privacy Actions</h1>
      <p>Manage data export and delete-me workflows for tenant users.</p>

      <div style={{ display: "grid", gap: 12 }}>
        <Card title="Export Data">
          <p>Create a downloadable export package for a selected user.</p>
          <Button variant="secondary" disabled>
            Export User Data
          </Button>
        </Card>
        <Card title="Delete Me">
          <p>Trigger account erasure workflow with audit trail.</p>
          <Button variant="danger" disabled>
            Start Delete Workflow
          </Button>
        </Card>
      </div>
    </section>
  );
}
