"use client";

import { useState } from "react";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { Button } from "@/components/ui/Button";
import type { Policy } from "@/features/governance/types";

type PolicyEditorSubmit = {
  name: string;
  effect: Policy["effect"];
  definition: Record<string, unknown>;
};

export type PolicyEditorProps = {
  onSubmit?: (payload: PolicyEditorSubmit) => void;
  loading?: boolean;
};

export function PolicyEditor({ onSubmit, loading = false }: PolicyEditorProps) {
  const [name, setName] = useState("");
  const [effect, setEffect] = useState<Policy["effect"]>("allow");
  const [definitionText, setDefinitionText] = useState('{"conditions": []}');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = () => {
    try {
      const parsedDefinition = JSON.parse(definitionText) as Record<string, unknown>;
      setError(null);
      onSubmit?.({ name, effect, definition: parsedDefinition });
    } catch {
      setError("Definition must be valid JSON");
    }
  };

  return (
    <Card title="Policy Editor">
      <div style={{ display: "grid", gap: 10 }}>
        <Input
          placeholder="Policy name"
          value={name}
          onChange={(event) => setName(event.target.value)}
          aria-label="Policy name"
        />
        <Select
          label="Effect"
          value={effect}
          onChange={(event) => setEffect(event.target.value as Policy["effect"])}
          options={[
            { value: "allow", label: "Allow" },
            { value: "deny", label: "Deny" },
          ]}
        />
        <Textarea
          label="Definition (JSON)"
          value={definitionText}
          onChange={(event) => setDefinitionText(event.target.value)}
          error={error ?? undefined}
        />
        <Button variant="primary" onClick={handleSubmit} loading={loading} disabled={!name.trim()}>
          Save Policy
        </Button>
      </div>
    </Card>
  );
}
