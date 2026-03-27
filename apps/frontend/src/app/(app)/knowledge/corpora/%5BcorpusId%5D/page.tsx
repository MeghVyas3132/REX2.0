"use client";

import { use } from "react";
import { Card } from "@/components/ui/Card";
import { useCorpusQuery } from "@/features/knowledge/queries";

export default function CorpusDetailPage({ params }: { params: Promise<{ corpusId: string }> }) {
  const { corpusId: rawCorpusId } = use(params);
  const corpusId = decodeURIComponent(rawCorpusId);
  const query = useCorpusQuery(corpusId);

  if (query.isLoading) return <div className="page-state">Loading corpus...</div>;
  if (query.isError || !query.data) return <div className="page-state">Failed to load corpus.</div>;

  const corpus = query.data;

  return (
    <section>
      <h1>{corpus.name}</h1>
      <p>Corpus ID: {corpus.id}</p>

      <Card title="Corpus Details">
        <p>Description: {corpus.description || "-"}</p>
        <p>Documents: {corpus.documentCount}</p>
        <p>Created: {corpus.createdAt}</p>
        <p>Updated: {corpus.updatedAt}</p>
      </Card>
    </section>
  );
}
