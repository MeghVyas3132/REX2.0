"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { useCreateWorkflowMutation } from "@/features/workflows/mutations";
import { RequireRole } from "@/lib/rbac/guards";

export default function NewWorkflowPage() {
  const router = useRouter();
  const createMutation = useCreateWorkflowMutation();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!name.trim()) return;

    const workflow = await createMutation.mutateAsync({
      name: name.trim(),
      description: description.trim() || undefined,
      status: "draft",
    });

    router.push(`/workflows/${encodeURIComponent(workflow.id)}`);
  };

  return (
    <RequireRole roles={["super_admin", "org_admin", "org_editor"]}>
      <section className="workflow-create-shell">
        <header className="workflow-create-header">
          <p className="workflow-create-eyebrow">Workflow Authoring</p>
          <h1>Create Workflow</h1>
          <p>Create a new workflow draft and continue in the editor.</p>
        </header>

        <Card className="workflow-create-card" title="Workflow Details">
          <form className="workflow-create-form" onSubmit={handleSubmit} style={{ display: "grid", gap: 12 }}>
            <label className="workflow-create-field">
              <span className="workflow-create-label">Workflow Name</span>
              <Input
                className="workflow-create-input"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Workflow name"
                required
              />
            </label>
            <label className="workflow-create-field">
              <span className="workflow-create-label">Description</span>
              <Textarea
                className="workflow-create-textarea"
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                placeholder="Workflow description"
              />
            </label>
            <div className="workflow-create-actions">
              <Button className="workflow-create-submit" type="submit" loading={createMutation.isPending}>
                Create Workflow
              </Button>
            </div>
          </form>
        </Card>
      </section>
    </RequireRole>
  );
}
