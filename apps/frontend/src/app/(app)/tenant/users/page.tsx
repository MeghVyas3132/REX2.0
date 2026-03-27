"use client";

import { useMemo, useState, useCallback } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/ui/DataTable";
import { ListPageWrapper } from "@/components/ui/ListPageWrapper";
import { SearchFilter } from "@/components/ui/SearchFilter";
import { FilterBar } from "@/components/ui/FilterBar";
import { useTenantUsersQuery } from "@/features/tenant/queries";
import { useInviteTenantUserMutation } from "@/features/tenant/mutations";
import type { TenantUser } from "@/features/tenant/types";
import { RequireRole } from "@/lib/rbac/guards";
import { Button } from "@/components/ui/Button";
import { UserInviteModal } from "@/components/tenant/UserInviteModal";
import { UserRoleEditModal } from "@/components/tenant/UserRoleEditModal";
import { updateUserRole } from "@/features/tenant/api";

export default function UsersPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [editingUser, setEditingUser] = useState<TenantUser | null>(null);

  const { data, isLoading, isError } = useTenantUsersQuery(page, 20);
  const inviteMutation = useInviteTenantUserMutation();

  const isEmpty = !isLoading && !isError && (!data?.data || data.data.length === 0);

  const handleInvite = async (inviteData: {
    email: string;
    tenantRole: "org_admin" | "org_editor" | "org_viewer";
    interfaceAccess: "business" | "studio" | "both";
  }) => {
    await inviteMutation.mutateAsync(inviteData);
  };

  const handleUpdateRole = async (updateData: {
    userId: string;
    tenantRole: "org_admin" | "org_editor" | "org_viewer";
    interfaceAccess: "business" | "studio" | "both";
  }) => {
    await updateUserRole(updateData);
  };

  const columns = useMemo<Array<ColumnDef<TenantUser>>>(
    () => [
      { accessorKey: "email", header: "Email" },
      { 
        accessorKey: "tenantRole", 
        header: "Role",
        cell: ({ row }) => {
          const role = row.original.tenantRole || row.original.role;
          return role?.replace("org_", "").replace("_", " ") || "viewer";
        }
      },
      { 
        accessorKey: "interfaceAccess", 
        header: "Interface",
        cell: ({ row }) => row.original.interfaceAccess || "studio"
      },
      { accessorKey: "createdAt", header: "Created" },
      {
        id: "actions",
        header: "Actions",
        cell: ({ row }) => (
          <Button variant="secondary" onClick={() => setEditingUser(row.original)}>
            Edit
          </Button>
        ),
      },
    ],
    [],
  );

  const handleResetFilters = useCallback(() => {
    setSearch("");
    setPage(1);
  }, []);

  return (
    <RequireRole roles={["super_admin", "org_admin"]}>
      <ListPageWrapper
        title="Tenant Users"
        subtitle="User list and role assignments for this tenant"
        headerActions={
          <Button variant="primary" onClick={() => setShowInviteModal(true)}>
            Invite User
          </Button>
        }
        filters={
          <FilterBar
            onReset={search ? handleResetFilters : undefined}
            showReset={Boolean(search)}
          >
            <SearchFilter
              placeholder="Search by email..."
              onSearch={(q) => {
                setSearch(q);
                setPage(1);
              }}
              isLoading={isLoading}
            />
          </FilterBar>
        }
        isLoading={isLoading}
        isError={isError}
        errorMessage="Failed to load users."
        isEmpty={isEmpty}
        emptyTitle="No users yet"
        emptyDescription="Invite team members to your organization."
        emptyAction={
          <Button variant="primary" onClick={() => setShowInviteModal(true)}>
            Invite First User
          </Button>
        }
        current={page}
        total={data?.total ?? 0}
        pageSize={20}
        onPageChange={setPage}
      >
        <DataTable columns={columns} data={data?.data ?? []} />
      </ListPageWrapper>

      {showInviteModal && (
        <UserInviteModal
          onClose={() => setShowInviteModal(false)}
          onInvite={handleInvite}
        />
      )}

      {editingUser && (
        <UserRoleEditModal
          user={editingUser}
          onClose={() => setEditingUser(null)}
          onSave={handleUpdateRole}
        />
      )}
    </RequireRole>
  );
}
