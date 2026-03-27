"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { ListPageWrapper } from "@/components/ui/ListPageWrapper";
import { KnowledgeFilters } from "@/components/knowledge/KnowledgeFilters";
import { DocumentsTable } from "@/components/knowledge/DocumentsTable";
import { useCorporaQuery } from "@/features/knowledge/queries";
import { Button } from "@/components/ui/Button";

export default function DocumentsPage() {
  const router = useRouter();
  const [page, setPage] = useState(1);

  const { data, isLoading, isError } = useCorporaQuery(page, 20);

  const isEmpty = !isLoading && !isError && (!data?.corpora || data.corpora.length === 0);

  const handleResetFilters = useCallback(() => {
    setPage(1);
  }, []);

  return (
    <ListPageWrapper
      title="Knowledge Documents"
      subtitle="Document source coverage by corpus"
      filters={
        <KnowledgeFilters
          onSearchChange={() => setPage(1)}
          onReset={handleResetFilters}
          isLoading={isLoading}
        />
      }
      isLoading={isLoading}
      isError={isError}
      errorMessage="Failed to load documents."
      isEmpty={isEmpty}
      emptyTitle="No corpora found"
      emptyDescription="Create a corpus to start ingesting documents."
      emptyAction={
        <Button variant="primary" onClick={() => router.push("/knowledge/query")}>
          Create Corpus
        </Button>
      }
      current={page}
      total={data?.total ?? 0}
      pageSize={20}
      onPageChange={setPage}
    >
      <DocumentsTable
        sources={data?.corpora ?? []}
        onOpenSource={(sourceId) => router.push(`/knowledge/documents/${encodeURIComponent(sourceId)}`)}
      />
    </ListPageWrapper>
  );
}
