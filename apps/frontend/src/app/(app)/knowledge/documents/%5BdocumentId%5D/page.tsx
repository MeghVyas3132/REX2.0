"use client";

import { use } from "react";
import { Card } from "@/components/ui/Card";
import { useCorpusQuery } from "@/features/knowledge/queries";

export default function DocumentDetailPage({ params }: { params: Promise<{ documentId: string }> }) {
  const { documentId: rawDocumentId } = use(params);
  const documentId = decodeURIComponent(rawDocumentId);
  const query = useCorpusQuery(documentId);

  if (query.isLoading) return <div className="page-state">Loading document details...</div>;
  if (query.isError || !query.data) return <div className="page-state">Failed to load document details.</div>;

  return (
    <section>
      <h1>Document Source Detail</h1>
      <p>Identifier: {documentId}</p>

      <Card title="Source Metadata">
        <p>Name: {query.data.name}</p>
        <p>Description: {query.data.description}</p>
        <p>Documents: {query.data.documentCount}</p>
      </Card>
    </section>
  );
}
