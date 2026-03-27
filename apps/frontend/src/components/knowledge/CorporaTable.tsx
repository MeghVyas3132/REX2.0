"use client";

import { useMemo } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/ui/DataTable";
import { Button } from "@/components/ui/Button";
import type { KnowledgeCorpus } from "@/features/knowledge/api";

export type CorporaTableProps = {
  corpora: KnowledgeCorpus[];
  onOpenCorpus?: (corpusId: string) => void;
};

export function CorporaTable({ corpora, onOpenCorpus }: CorporaTableProps) {
  const columns = useMemo<Array<ColumnDef<KnowledgeCorpus>>>(
    () => [
      { accessorKey: "name", header: "Corpus" },
      { accessorKey: "description", header: "Description" },
      { accessorKey: "documentCount", header: "Documents" },
      { accessorKey: "updatedAt", header: "Updated" },
      {
        id: "actions",
        header: "Actions",
        cell: ({ row }) =>
          onOpenCorpus ? (
            <Button variant="secondary" onClick={() => onOpenCorpus(row.original.id)}>
              Open
            </Button>
          ) : null,
      },
    ],
    [onOpenCorpus],
  );

  return <DataTable columns={columns} data={corpora} />;
}
