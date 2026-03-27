import dynamic from "next/dynamic";

const WorkflowEditorClient = dynamic(
  () => import("@/components/workflows/WorkflowEditorClient").then((mod) => mod.WorkflowEditorClient),
  {
    loading: () => <div className="page-state">Loading workflow editor...</div>,
  },
);

export default async function WorkflowEditorPage({
  params,
}: {
  params: Promise<{ workflowId: string }>;
}) {
  const { workflowId: rawWorkflowId } = await params;
  const workflowId = decodeURIComponent(rawWorkflowId);

  return <WorkflowEditorClient workflowId={workflowId} />;
}
