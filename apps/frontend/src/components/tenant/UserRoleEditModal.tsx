"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

type UserRoleEditModalProps = {
  user: {
    id: string;
    email: string;
    tenantRole: string;
    interfaceAccess: string;
  };
  onClose: () => void;
  onSave: (data: {
    userId: string;
    tenantRole: "org_admin" | "org_editor" | "org_viewer";
    interfaceAccess: "business" | "studio" | "both";
  }) => Promise<void>;
};

export function UserRoleEditModal({ user, onClose, onSave }: UserRoleEditModalProps) {
  const [tenantRole, setTenantRole] = useState<"org_admin" | "org_editor" | "org_viewer">(
    user.tenantRole as any
  );
  const [interfaceAccess, setInterfaceAccess] = useState<"business" | "studio" | "both">(
    user.interfaceAccess as any
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setTenantRole(user.tenantRole as any);
    setInterfaceAccess(user.interfaceAccess as any);
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      await onSave({ userId: user.id, tenantRole, interfaceAccess });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update user");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: "rgba(0,0,0,0.5)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: "white",
          borderRadius: "8px",
          padding: "24px",
          maxWidth: "500px",
          width: "90%",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <Card title={`Edit User: ${user.email}`}>
          <form onSubmit={handleSubmit} style={{ display: "grid", gap: "16px" }}>
            {error && (
              <div
                style={{
                  padding: "12px",
                  background: "#fee",
                  border: "1px solid #fcc",
                  borderRadius: "4px",
                  color: "#c00",
                }}
              >
                {error}
              </div>
            )}

            <div>
              <label style={{ display: "block", fontWeight: 600, marginBottom: "6px" }}>
                Tenant Role *
              </label>
              <select
                value={tenantRole}
                onChange={(e) => setTenantRole(e.target.value as any)}
                style={{
                  width: "100%",
                  padding: "8px 12px",
                  borderRadius: "6px",
                  border: "1px solid var(--border-default)",
                  fontSize: "14px",
                }}
              >
                <option value="org_viewer">Org Viewer (Read-only)</option>
                <option value="org_editor">Org Editor (Can edit)</option>
                <option value="org_admin">Org Admin (Full access)</option>
              </select>
            </div>

            <div>
              <label style={{ display: "block", fontWeight: 600, marginBottom: "6px" }}>
                Interface Access *
              </label>
              <select
                value={interfaceAccess}
                onChange={(e) => setInterfaceAccess(e.target.value as any)}
                style={{
                  width: "100%",
                  padding: "8px 12px",
                  borderRadius: "6px",
                  border: "1px solid var(--border-default)",
                  fontSize: "14px",
                }}
              >
                <option value="business">Business (Simplified UI)</option>
                <option value="studio">Studio (Full technical UI)</option>
                <option value="both">Both (Can switch)</option>
              </select>
            </div>

            <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end", marginTop: "8px" }}>
              <Button type="button" variant="secondary" onClick={onClose} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button type="submit" loading={isSubmitting}>
                Save Changes
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
}
