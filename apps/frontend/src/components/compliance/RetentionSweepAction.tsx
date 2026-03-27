"use client";

import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

export type RetentionSweepActionProps = {
  loading?: boolean;
  onRun?: () => void;
};

export function RetentionSweepAction({ loading = false, onRun }: RetentionSweepActionProps) {
  return (
    <Card title="Retention Sweep">
      <p>Run retention sweep to remove expired records based on current policy.</p>
      <Button variant="danger" loading={loading} onClick={onRun}>
        Run Retention Sweep
      </Button>
    </Card>
  );
}
