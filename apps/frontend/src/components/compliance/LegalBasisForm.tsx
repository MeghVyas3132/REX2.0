"use client";

import { Card } from "@/components/ui/Card";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { Button } from "@/components/ui/Button";
import { useState } from "react";

export type LegalBasisFormProps = {
  initialStatus?: string;
  loading?: boolean;
  onSubmit?: (input: { status: string; metadata?: Record<string, unknown> }) => void;
};

export function LegalBasisForm({ initialStatus = "pending", loading = false, onSubmit }: LegalBasisFormProps) {
  const [status, setStatus] = useState(initialStatus);
  const [notes, setNotes] = useState("");

  const handleSubmit = () => {
    onSubmit?.({ status, metadata: notes ? { notes } : undefined });
  };

  return (
    <Card title="Legal Basis Update">
      <div style={{ display: "grid", gap: 10 }}>
        <Select
          label="Status"
          value={status}
          onChange={(event) => setStatus(event.target.value)}
          options={[
            { value: "pending", label: "Pending" },
            { value: "approved", label: "Approved" },
            { value: "rejected", label: "Rejected" },
          ]}
        />
        <Textarea
          label="Notes"
          placeholder="Reason, legal context, or reviewer notes"
          value={notes}
          onChange={(event) => setNotes(event.target.value)}
        />
        <Button variant="primary" onClick={handleSubmit} loading={loading}>
          Update Legal Basis
        </Button>
      </div>
    </Card>
  );
}
