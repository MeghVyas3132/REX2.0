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
    <section className="detail-page-shell template-detail-shell">
      <header className="detail-page-header">
        <p className="detail-page-eyebrow">Template Detail</p>
        <h1>{data.name}</h1>
        <p className="detail-page-subtitle">Template ID: {data.id}</p>
      </header>

      <Card className="detail-card" title="Template Details">
        <div className="detail-kv-list">
          <p className="detail-kv-item">{data.description}</p>
          <p className="detail-kv-item">Tags: {data.tags.length ? data.tags.join(", ") : "No tags"}</p>
          <p className="detail-kv-item">Updated: {data.updatedAt}</p>
        </div>
      </Card>
    </section>
  );
}
