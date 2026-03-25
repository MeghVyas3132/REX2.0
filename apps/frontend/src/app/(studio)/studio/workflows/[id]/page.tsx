import { redirect } from "next/navigation";

export default async function StudioWorkflowDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  redirect(`/dashboard/workflows/${id}`);
}
