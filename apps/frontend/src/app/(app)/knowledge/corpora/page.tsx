"use client";

import { useRouter } from "next/navigation";
import { CorporaTable } from "@/components/knowledge/CorporaTable";
import { useCorporaQuery } from "@/features/knowledge/queries";

export default function KnowledgeCorporaPage() {
  const router = useRouter();
  const { data, isLoading, isError } = useCorporaQuery(1, 20);

  if (isLoading) return <div className="page-state">Loading corpora...</div>;
  if (isError) return <div className="page-state">Failed to load corpora.</div>;

  return (
    <section>
      <h1>Knowledge Corpora</h1>
      <p>Manage corpora used for retrieval and grounding.</p>
      <CorporaTable
        corpora={data?.corpora ?? []}
        onOpenCorpus={(corpusId) => router.push(`/knowledge/corpora/${encodeURIComponent(corpusId)}`)}
      />
    </section>
  );
}
