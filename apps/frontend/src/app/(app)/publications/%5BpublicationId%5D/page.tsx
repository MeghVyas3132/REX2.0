"use client";

import { use } from "react";
import { usePublicationQuery } from "@/features/publications/queries";
import { Card } from "@/components/ui/Card";

export default function PublicationDetailPage({ params }: { params: Promise<{ publicationId: string }> }) {
  const { publicationId: rawPublicationId } = use(params);
  const publicationId = decodeURIComponent(rawPublicationId);
  const { data, isLoading, isError } = usePublicationQuery(publicationId);

  if (isLoading) return <div className="page-state">Loading publication...</div>;
  if (isError || !data) return <div className="page-state">Failed to load publication.</div>;

  return (
    <section>
      <h1>{data.name}</h1>
      <p>Publication ID: {data.id}</p>
      <Card title="Publication Details">
        <p>Status: {data.status}</p>
        <p>Workflow: {data.workflowId}</p>
        <p>API Key: {data.apiKey}</p>
        <p>Updated: {data.updatedAt}</p>
      </Card>
    </section>
  );
}
