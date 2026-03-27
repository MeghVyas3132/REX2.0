"use client";

import { use } from "react";
import { Card } from "@/components/ui/Card";
import { useWorkflowQuery } from "@/features/workflows/queries";
import { useComplianceQuery } from "@/features/compliance/queries";

export default function WorkflowLegalBasisPage({ params }: { params: Promise<{ workflowId: string }> }) {
  const { workflowId: rawWorkflowId } = use(params);
  const workflowId = decodeURIComponent(rawWorkflowId);
  const workflowQuery = useWorkflowQuery(workflowId);
  const complianceQuery = useComplianceQuery("legal_basis", 1, 20);

  if (workflowQuery.isLoading || complianceQuery.isLoading) return <div className="page-state">Loading workflow legal basis...</div>;
  if (workflowQuery.isError || complianceQuery.isError || !workflowQuery.data) return <div className="page-state">Failed to load workflow legal basis.</div>;

  return (
    <section>
      <h1>Workflow Legal Basis</h1>
      <p>Workflow: {workflowQuery.data.name}</p>

      <Card title="Legal Basis Coverage">
        <p>Linked records loaded: {complianceQuery.data?.records.length ?? 0}</p>
        <p>Workflow ID: {workflowQuery.data.id}</p>
        <p>Last workflow update: {workflowQuery.data.updatedAt}</p>
      </Card>
    </section>
  );
}
