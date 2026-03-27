"use client";

import type { KnowledgeCorpus } from "@/features/knowledge/api";
import { Card } from "@/components/ui/Card";

export type KnowledgeQueryConsoleProps = {
  corpora: KnowledgeCorpus[];
};

export function KnowledgeQueryConsole({ corpora }: KnowledgeQueryConsoleProps) {
  const totalDocs = corpora.reduce((sum, corpus) => sum + corpus.documentCount, 0);

  return (
    <div style={{ display: "grid", gap: 12 }}>
      <Card title="Retrieval Readiness">
        <p>Available corpora: {corpora.length}</p>
        <p>Total indexed documents: {totalDocs}</p>
        <p>Recommended top-k: {Math.max(5, Math.min(20, corpora.length * 2))}</p>
      </Card>
      <Card title="Corpus Snapshot">
        {corpora.length === 0 ? <p>No corpora available.</p> : null}
        {corpora.slice(0, 5).map((corpus) => (
          <p key={corpus.id} style={{ marginBottom: 6 }}>
            {corpus.name}: {corpus.documentCount} docs
          </p>
        ))}
      </Card>
    </div>
  );
}
