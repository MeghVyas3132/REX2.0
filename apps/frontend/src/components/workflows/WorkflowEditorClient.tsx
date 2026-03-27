"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { WorkflowGraphEditor } from "@/components/workflows/WorkflowGraphEditor";
import { NodePalette } from "@/components/workflows/NodePalette";
import { useUpdateWorkflowMutation } from "@/features/workflows/mutations";
import { useWorkflowQuery } from "@/features/workflows/queries";
import { RequireRole } from "@/lib/rbac/guards";
import { useSession } from "@/lib/auth/session-context";

type WorkflowEditorClientProps = {
  workflowId: string;
};

export function WorkflowEditorClient({ workflowId }: WorkflowEditorClientProps) {
  const workflowQuery = useWorkflowQuery(workflowId);
  const updateMutation = useUpdateWorkflowMutation();
  const { user } = useSession();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  useEffect(() => {
    if (!workflowQuery.data) return;
    setName(workflowQuery.data.name);
    setDescription(workflowQuery.data.description ?? "");
  }, [workflowQuery.data]);

  const handleMetadataSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!name.trim()) return;

    await updateMutation.mutateAsync({
      workflowId,
      input: {
        name: name.trim(),
        description: description.trim() || undefined,
      },
    });
  };

  const handleWorkflowSave = async (nodes: any[], edges: any[]) => {
    await updateMutation.mutateAsync({
      workflowId,
      input: {
        nodes,
        edges,
      },
    });
  };

  if (workflowQuery.isLoading) return <div className="page-state">Loading workflow editor...</div>;
  if (workflowQuery.isError || !workflowQuery.data) return <div className="page-state">Failed to load workflow.</div>;

  const workflow = workflowQuery.data;
  const interfaceAccess = user?.interfaceAccess || "studio";

  return (
    <RequireRole roles={["super_admin", "org_admin", "org_editor"]}>
      <section>
        <h1>Edit Workflow</h1>
        <p>Workflow ID: {workflowId}</p>

        <Card title="Workflow Metadata">
          <form onSubmit={handleMetadataSubmit} style={{ display: "grid", gap: 12 }}>
            <Input 
              placeholder="Workflow Name"
              value={name} 
              onChange={(event) => setName(event.target.value)} 
              required 
            />
            <Textarea 
              placeholder="Description (optional)"
              value={description} 
              onChange={(event) => setDescription(event.target.value)} 
            />
            <Button type="submit" loading={updateMutation.isPending}>
              Save Metadata
            </Button>
          </form>
        </Card>

        <div style={{ marginTop: "24px", display: "grid", gridTemplateColumns: "280px 1fr", gap: "16px" }}>
          <div style={{ height: "700px" }}>
            <NodePalette interfaceAccess={interfaceAccess} />
          </div>
          <div>
            <WorkflowGraphEditor
              nodes={workflow.nodes || []}
              edges={workflow.edges || []}
              readOnly={false}
              onSave={handleWorkflowSave}
            />
          </div>
        </div>
      </section>
    </RequireRole>
  );
}