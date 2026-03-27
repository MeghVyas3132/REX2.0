"use client";

import { useGovernanceWorkspacesQuery } from "@/features/governance/queries";
import { WorkspaceTable } from "@/components/governance/WorkspaceTable";

export default function WorkspacesPage() {
  const { data, isLoading, isError } = useGovernanceWorkspacesQuery({ page: 1, limit: 20 });

  if (isLoading) return <div className="page-state">Loading workspaces...</div>;
  if (isError) return <div className="page-state">Failed to load workspaces.</div>;

  return (
    <section>
      <h1>Workspaces</h1>
      <p>Workspace management and isolation boundaries.</p>
      <WorkspaceTable workspaces={data ?? []} />
    </section>
  );
}
