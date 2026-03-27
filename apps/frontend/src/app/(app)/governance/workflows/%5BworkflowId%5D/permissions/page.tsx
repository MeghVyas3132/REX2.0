"use client";

import { use } from "react";
import { Card } from "@/components/ui/Card";
import { useWorkflowQuery } from "@/features/workflows/queries";

export default function WorkflowPermissionsPage({ params }: { params: Promise<{ workflowId: string }> }) {
  const { workflowId: rawWorkflowId } = use(params);
  const workflowId = decodeURIComponent(rawWorkflowId);
  const workflowQuery = useWorkflowQuery(workflowId);

  if (workflowQuery.isLoading) return <div className="page-state">Loading workflow permissions...</div>;
  if (workflowQuery.isError || !workflowQuery.data) return <div className="page-state">Failed to load workflow.</div>;

  return (
    <section>
      <h1>Workflow Permissions</h1>
      <p>Workflow: {workflowQuery.data.name}</p>

      <Card title="Current Access Model">
        <p>Owner role: org_admin</p>
        <p>Editor role: org_editor</p>
        <p>Viewer role: org_viewer</p>
        <p>Execution allowed for: org_admin, org_editor</p>
      </Card>
    </section>
  );
}
