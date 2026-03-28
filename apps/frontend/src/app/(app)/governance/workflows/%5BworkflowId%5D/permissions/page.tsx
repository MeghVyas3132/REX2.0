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
    <section className="detail-page-shell governance-permissions-shell">
      <header className="detail-page-header">
        <p className="detail-page-eyebrow">Governance</p>
        <h1>Workflow Permissions</h1>
        <p className="detail-page-subtitle">Workflow: {workflowQuery.data.name}</p>
      </header>

      <Card className="detail-card" title="Current Access Model">
        <div className="detail-kv-list">
          <p className="detail-kv-item">Owner role: org_admin</p>
          <p className="detail-kv-item">Editor role: org_editor</p>
          <p className="detail-kv-item">Viewer role: org_viewer</p>
          <p className="detail-kv-item">Execution allowed for: org_admin, org_editor</p>
        </div>
      </Card>
    </section>
  );
}
