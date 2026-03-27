"use client";

import { useMemo } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/ui/DataTable";
import { Button } from "@/components/ui/Button";
import type { KnowledgeCorpus } from "@/features/knowledge/api";

export type DocumentsTableProps = {
  sources: KnowledgeCorpus[];
  onOpenSource?: (sourceId: string) => void;
};

export function DocumentsTable({ sources, onOpenSource }: DocumentsTableProps) {
  const columns = useMemo<Array<ColumnDef<KnowledgeCorpus>>>(
    () => [
      { accessorKey: "name", header: "Corpus" },
      { accessorKey: "documentCount", header: "Documents" },
      { accessorKey: "updatedAt", header: "Updated" },
      {
        id: "actions",
        header: "Actions",
        cell: ({ row }) =>
          onOpenSource ? (
            <Button variant="secondary" onClick={() => onOpenSource(row.original.id)}>
              View
            </Button>
          ) : null,
      },
    ],
    [onOpenSource],
  );

  return <DataTable columns={columns} data={sources} />;
}
