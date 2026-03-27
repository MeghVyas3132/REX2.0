"use client";

import { useState, useMemo } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/ui/DataTable";
import { ListPageWrapper } from "@/components/ui/ListPageWrapper";
import { Button } from "@/components/ui/Button";
import { RequireRole } from "@/lib/rbac/guards";
import { TenantNodeAccessModal } from "@/components/admin/TenantNodeAccessModal";

type Tenant = {
  id: string;
  name: string;
  slug: string;
  planTier: string;
  isActive: boolean;
  allowedPluginSlugs?: string[];
};

export default function AdminTenantsPage() {
  const [page, setPage] = useState(1);
  const [managingTenant, setManagingTenant] = useState<Tenant | null>(null);

  const handleUpdateNodeAccess = async (pluginSlugs: string[]) => {
    if (!managingTenant) return;
    const res = await fetch(`/api/admin/tenants/${managingTenant.id}/plan`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        customLimits: {
          allowedPluginSlugs: pluginSlugs,
        },
      }),
      credentials: "include",
    });
    if (!res.ok) throw new Error("Failed to update node access");
    setManagingTenant(null);
  };

  const columns = useMemo<Array<ColumnDef<Tenant>>>(
    () => [
      { accessorKey: "name", header: "Name" },
      { accessorKey: "slug", header: "Slug" },
      { accessorKey: "planTier", header: "Plan" },
      {
        accessorKey: "isActive",
        header: "Status",
        cell: ({ row }) => (
          <span style={{
            padding: "2px 8px",
            fontSize: "11px",
            borderRadius: "4px",
            background: row.original.isActive ? "#d4edda" : "#f8d7da",
            color: row.original.isActive ? "#155724" : "#721c24",
          }}>
            {row.original.isActive ? "Active" : "Inactive"}
          </span>
        ),
      },
      {
        id: "actions",
        header: "Actions",
        cell: ({ row }) => (
          <Button variant="secondary" onClick={() => setManagingTenant(row.original)}>
            Manage Nodes
          </Button>
        ),
      },
    ],
    [],
  );

  const mockTenants: Tenant[] = [
    { id: "1", name: "Acme Corp", slug: "acme", planTier: "pro", isActive: true },
    { id: "2", name: "Tech Startup", slug: "tech-startup", planTier: "starter", isActive: true },
  ];

  return (
    <RequireRole roles={["super_admin"]}>
      <ListPageWrapper
        title="Tenants"
        subtitle="Manage tenant node access and permissions"
        isLoading={false}
        isError={false}
        errorMessage="Failed to load tenants."
        isEmpty={mockTenants.length === 0}
        emptyTitle="No tenants yet"
        emptyDescription="No tenants found in the system."
        current={page}
        total={mockTenants.length}
        pageSize={20}
        onPageChange={setPage}
      >
        <DataTable columns={columns} data={mockTenants} />
      </ListPageWrapper>

      {managingTenant && (
        <TenantNodeAccessModal
          tenant={managingTenant}
          onClose={() => setManagingTenant(null)}
          onSave={handleUpdateNodeAccess}
        />
      )}
    </RequireRole>
  );
}
