"use client";

import { WorkflowsGridPage } from "@/components/workflows/WorkflowsGridPage";

export default function StudioWorkflowsPage() {
  return (
    <WorkflowsGridPage
      title="Workflows"
      description="Create, edit, and manage workflow definitions"
      routeBase="/studio/workflows"
      createHref="/studio/workflows/new"
    />
  );
}
