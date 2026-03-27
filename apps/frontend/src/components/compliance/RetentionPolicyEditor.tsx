"use client";

import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { useState } from "react";

export type RetentionPolicyEditorProps = {
  defaultDays?: number;
  loading?: boolean;
  onSave?: (days: number) => void;
};

export function RetentionPolicyEditor({ defaultDays = 30, loading = false, onSave }: RetentionPolicyEditorProps) {
  const [days, setDays] = useState(String(defaultDays));

  return (
    <Card title="Retention Policy">
      <div style={{ display: "grid", gap: 10 }}>
        <label htmlFor="retention-days">Retention Days</label>
        <Input
          id="retention-days"
          type="number"
          min={1}
          value={days}
          onChange={(event) => setDays(event.target.value)}
        />
        <Button
          variant="primary"
          loading={loading}
          onClick={() => onSave?.(Math.max(1, Number.parseInt(days || "0", 10)))}
        >
          Save Retention Policy
        </Button>
      </div>
    </Card>
  );
}
