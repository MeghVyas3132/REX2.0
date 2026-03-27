"use client";

import { useState, useMemo } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/ui/DataTable";
import { ListPageWrapper } from "@/components/ui/ListPageWrapper";
import { Button } from "@/components/ui/Button";
import { RequireRole } from "@/lib/rbac/guards";
import { usePluginsQuery } from "@/features/plugins/queries";
import { PluginFormModal } from "@/components/admin/PluginFormModal";
import type { Plugin } from "@rex/types";

export default function AdminPluginsPage() {
  const [page, setPage] = useState(1);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingPlugin, setEditingPlugin] = useState<Plugin | null>(null);

  const { data: plugins, isLoading, isError } = usePluginsQuery();

  const handleCreatePlugin = async (data: any) => {
    const res = await fetch("/api/admin/plugins", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
      credentials: "include",
    });
    if (!res.ok) throw new Error("Failed to create plugin");
  };

  const handleUpdatePlugin = async (data: any) => {
    if (!editingPlugin) return;
    const res = await fetch(`/api/admin/plugins/${editingPlugin.slug}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
      credentials: "include",
    });
    if (!res.ok) throw new Error("Failed to update plugin");
  };

  const handleDeletePlugin = async (slug: string) => {
    if (!confirm("Are you sure you want to delete this plugin?")) return;
    const res = await fetch(`/api/admin/plugins/${slug}`, {
      method: "DELETE",
      credentials: "include",
    });
    if (!res.ok) throw new Error("Failed to delete plugin");
  };

  const columns = useMemo<Array<ColumnDef<Plugin>>>(
    () => [
      { accessorKey: "name", header: "Name" },
      { accessorKey: "slug", header: "Slug" },
      { accessorKey: "category", header: "Category" },
      { accessorKey: "version", header: "Version" },
      {
        accessorKey: "technicalLevel",
        header: "Level",
        cell: ({ row }) => (
          <span style={{
            padding: "2px 8px",
            fontSize: "11px",
            borderRadius: "4px",
            background: row.original.technicalLevel === "basic" ? "#d4edda" : "#d1ecf1",
            color: row.original.technicalLevel === "basic" ? "#155724" : "#0c5460",
          }}>
            {row.original.technicalLevel || "advanced"}
          </span>
        ),
      },
      {
        id: "actions",
        header: "Actions",
        cell: ({ row }) => (
          <div style={{ display: "flex", gap: "8px" }}>
            <Button variant="secondary" onClick={() => setEditingPlugin(row.original)}>
              Edit
            </Button>
            <Button
              variant="secondary"
              onClick={() => handleDeletePlugin(row.original.slug)}
              style={{ color: "#c00" }}
            >
              Delete
            </Button>
          </div>
        ),
      },
    ],
    [],
  );

  const isEmpty = !isLoading && !isError && (!plugins || plugins.length === 0);

  return (
    <RequireRole roles={["super_admin"]}>
      <ListPageWrapper
        title="Node Registry"
        subtitle="Manage the plugin catalogue for all tenants"
        headerActions={
          <Button variant="primary" onClick={() => setShowCreateModal(true)}>
            Create Plugin
          </Button>
        }
        isLoading={isLoading}
        isError={isError}
        errorMessage="Failed to load plugins."
        isEmpty={isEmpty}
        emptyTitle="No plugins yet"
        emptyDescription="Create your first custom node."
        emptyAction={
          <Button variant="primary" onClick={() => setShowCreateModal(true)}>
            Create First Plugin
          </Button>
        }
        current={page}
        total={plugins?.length || 0}
        pageSize={20}
        onPageChange={setPage}
      >
        <DataTable columns={columns} data={plugins || []} />
      </ListPageWrapper>

      {showCreateModal && (
        <PluginFormModal
          onClose={() => setShowCreateModal(false)}
          onSave={handleCreatePlugin}
        />
      )}

      {editingPlugin && (
        <PluginFormModal
          plugin={editingPlugin as any}
          onClose={() => setEditingPlugin(null)}
          onSave={handleUpdatePlugin}
        />
      )}
    </RequireRole>
  );
}
