"use client";

import { Card } from "@/components/ui/Card";
import { WorkflowGraphEditor } from "@/components/workflows/WorkflowGraphEditor";
import { useWorkflowQuery } from "@/features/workflows/queries";
import { RequireRole } from "@/lib/rbac/guards";

type WorkflowViewerClientProps = {
  workflowId: string;
};

export function WorkflowViewerClient({ workflowId }: WorkflowViewerClientProps) {
  const workflowQuery = useWorkflowQuery(workflowId);

  if (workflowQuery.isLoading) return <div className="page-state">Loading workflow...</div>;
  if (workflowQuery.isError || !workflowQuery.data) return <div className="page-state">Failed to load workflow.</div>;

  const workflow = workflowQuery.data;

  return (
    <RequireRole roles={["super_admin", "org_admin", "org_editor", "org_viewer"]}>
      <section>
        <h1>{workflow.name}</h1>
        {workflow.description && <p>{workflow.description}</p>}

        <div style={{ marginTop: "24px" }}>
          <Card title="Workflow View">
            <WorkflowGraphEditor
              nodes={workflow.nodes || []}
              edges={workflow.edges || []}
              readOnly={true}
            />
          </Card>
        </div>
      </section>
    </RequireRole>
  );
}
