"use client";

import Link from "next/link";
import { usePublicationsQuery } from "@/features/publications/queries";
import { Card } from "@/components/ui/Card";

export default function PublicationsCatalogPage() {
  const query = usePublicationsQuery(1, 50);

  if (query.isLoading) return <div className="page-state">Loading publication catalog...</div>;
  if (query.isError) return <div className="page-state">Failed to load publication catalog.</div>;

  return (
    <section>
      <h1>Publication Catalog</h1>
      <p>Published and draft endpoints available for consumers.</p>

      <div style={{ display: "grid", gap: 12 }}>
        {(query.data?.publications ?? []).map((publication) => (
          <Card key={publication.id} title={publication.name}>
            <p>Status: {publication.status}</p>
            <p>Workflow: {publication.workflowId}</p>
            <p>
              <Link href={`/publications/${encodeURIComponent(publication.id)}`}>Open publication</Link>
            </p>
          </Card>
        ))}
      </div>
    </section>
  );
}
