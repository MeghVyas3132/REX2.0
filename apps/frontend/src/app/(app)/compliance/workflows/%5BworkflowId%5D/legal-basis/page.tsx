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
    <section className="detail-page-shell compliance-legal-basis-shell">
      <header className="detail-page-header">
        <p className="detail-page-eyebrow">Compliance</p>
        <h1>Workflow Legal Basis</h1>
        <p className="detail-page-subtitle">Workflow: {workflowQuery.data.name}</p>
      </header>

      <Card className="detail-card" title="Legal Basis Coverage">
        <div className="detail-kv-list">
          <p className="detail-kv-item">Linked records loaded: {complianceQuery.data?.records.length ?? 0}</p>
          <p className="detail-kv-item">Workflow ID: {workflowQuery.data.id}</p>
          <p className="detail-kv-item">Last workflow update: {workflowQuery.data.updatedAt}</p>
        </div>
      </Card>
    </section>
  );
}
