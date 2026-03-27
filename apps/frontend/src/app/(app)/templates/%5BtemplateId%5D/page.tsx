"use client";

import { use } from "react";
import { useTemplateQuery } from "@/features/templates/queries";
import { Card } from "@/components/ui/Card";

export default function TemplateDetailPage({ params }: { params: Promise<{ templateId: string }> }) {
  const { templateId: rawTemplateId } = use(params);
  const templateId = decodeURIComponent(rawTemplateId);
  const { data, isLoading, isError } = useTemplateQuery(templateId);

  if (isLoading) return <div className="page-state">Loading template...</div>;
  if (isError || !data) return <div className="page-state">Failed to load template.</div>;

  return (
    <section>
      <h1>{data.name}</h1>
      <p>Template ID: {data.id}</p>
      <Card title="Template Details">
        <p>{data.description}</p>
        <p>Tags: {data.tags.length ? data.tags.join(", ") : "No tags"}</p>
        <p>Updated: {data.updatedAt}</p>
      </Card>
    </section>
  );
}
