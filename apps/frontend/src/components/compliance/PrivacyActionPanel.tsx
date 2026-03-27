"use client";

import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

export type PrivacyActionPanelProps = {
  exportLoading?: boolean;
  deleteLoading?: boolean;
  onExport?: () => void;
  onDelete?: () => void;
};

export function PrivacyActionPanel({
  exportLoading = false,
  deleteLoading = false,
  onExport,
  onDelete,
}: PrivacyActionPanelProps) {
  return (
    <div style={{ display: "grid", gap: 12 }}>
      <Card title="Export Data">
        <p>Create a downloadable export package for a selected user.</p>
        <Button variant="secondary" loading={exportLoading} onClick={onExport}>
          Export User Data
        </Button>
      </Card>
      <Card title="Delete Me">
        <p>Trigger account erasure workflow with audit trail.</p>
        <Button variant="danger" loading={deleteLoading} onClick={onDelete}>
          Start Delete Workflow
        </Button>
      </Card>
    </div>
  );
}
