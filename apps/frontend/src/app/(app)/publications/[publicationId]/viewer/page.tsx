import dynamic from "next/dynamic";

const WorkflowViewerClient = dynamic(
  () => import("@/components/workflows/WorkflowViewerClient").then((mod) => mod.WorkflowViewerClient),
  {
    loading: () => <div className="page-state">Loading workflow viewer...</div>,
  },
);

export default async function WorkflowViewerPage({
  params,
}: {
  params: Promise<{ publicationId: string }>;
}) {
  const { publicationId } = await params;

  return <WorkflowViewerClient workflowId={decodeURIComponent(publicationId)} />;
}
