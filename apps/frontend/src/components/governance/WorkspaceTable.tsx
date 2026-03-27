"use client";

import { useMemo } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/ui/DataTable";
import type { Workspace } from "@/features/governance/types";

export type WorkspaceTableProps = {
  workspaces: Workspace[];
};

export function WorkspaceTable({ workspaces }: WorkspaceTableProps) {
  const columns = useMemo<Array<ColumnDef<Workspace>>>(
    () => [
      { accessorKey: "name", header: "Workspace" },
      { accessorKey: "memberCount", header: "Members" },
      { accessorKey: "updatedAt", header: "Updated" },
      { accessorKey: "id", header: "ID" },
    ],
    [],
  );

  return <DataTable columns={columns} data={workspaces} />;
}
