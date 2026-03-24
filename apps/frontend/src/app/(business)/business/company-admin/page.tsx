"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { api, type TenantPlanClient, type TenantUserMembershipClient } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { canManageCompany, getRoleLandingPath } from "@/lib/rbac";

const ROLE_OPTIONS: Array<TenantUserMembershipClient["tenantRole"]> = [
  "org_admin",
  "org_editor",
  "org_viewer",
];

const INTERFACE_OPTIONS: Array<TenantUserMembershipClient["interfaceAccess"]> = [
  "both",
  "studio",
  "business",
];

export default function CompanyAdminPage() {
  const { token, user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [users, setUsers] = useState<TenantUserMembershipClient[]>([]);
  const [plan, setPlan] = useState<TenantPlanClient | null>(null);
  const [inviteUserId, setInviteUserId] = useState("");
  const [inviteRole, setInviteRole] = useState<TenantUserMembershipClient["tenantRole"]>("org_viewer");
  const [inviteInterface, setInviteInterface] = useState<TenantUserMembershipClient["interfaceAccess"]>("business");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!token || !user) {
      router.replace("/login");
      return;
    }
    if (!canManageCompany(user)) {
      router.replace(getRoleLandingPath(user));
      return;
    }

    const load = async () => {
      try {
        setError(null);
        const [usersRes, planRes] = await Promise.all([
          api.tenant.listUsers(token),
          api.tenant.getPlan(token),
        ]);
        setUsers(usersRes.data);
        setPlan(planRes.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load company admin data");
      } finally {
        setIsLoading(false);
      }
    };

    void load();
  }, [authLoading, token, user, router]);

  const templateAccess = useMemo(() => {
    const raw = plan?.customLimits?.["allowedTemplateIds"];
    if (!Array.isArray(raw)) return [];
    return raw.filter((item): item is string => typeof item === "string");
  }, [plan]);

  async function handleInvite(): Promise<void> {
    if (!token || !inviteUserId.trim()) return;
    setIsSaving(true);
    setError(null);
    setNotice(null);
    try {
      await api.tenant.inviteUser(token, {
        userId: inviteUserId.trim(),
        tenantRole: inviteRole,
        interfaceAccess: inviteInterface,
      });
      const refreshed = await api.tenant.listUsers(token);
      setUsers(refreshed.data);
      setInviteUserId("");
      setNotice("User membership saved.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to invite user");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleMembershipUpdate(member: TenantUserMembershipClient): Promise<void> {
    if (!token) return;
    setIsSaving(true);
    setError(null);
    setNotice(null);
    try {
      await api.tenant.updateUser(token, member.userId, {
        tenantRole: member.tenantRole,
        interfaceAccess: member.interfaceAccess,
        isActive: member.isActive,
      });
      setNotice("Membership updated.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update membership");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleRemove(userId: string): Promise<void> {
    if (!token) return;
    setIsSaving(true);
    setError(null);
    setNotice(null);
    try {
      await api.tenant.removeUser(token, userId);
      setUsers((prev) => prev.filter((item) => item.userId !== userId));
      setNotice("Membership removed.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to remove membership");
    } finally {
      setIsSaving(false);
    }
  }

  if (authLoading || !token || !user || !canManageCompany(user)) return null;

  return (
    <section className="control-header">
      <h1>Company Admin Console</h1>
      <p>Manage your company users and operational access. Platform-level node and template assignment is set by super admin.</p>
      {error ? <p className="control-error">{error}</p> : null}
      {notice ? <p className="control-kicker">{notice}</p> : null}

      <div className="control-grid">
        <article className="control-card">
          <h2>Assigned node types</h2>
          <p>{plan?.allowedNodeTypes?.length ? plan.allowedNodeTypes.join(", ") : "No node types assigned"}</p>
        </article>
        <article className="control-card">
          <h2>Assigned templates</h2>
          <p>{templateAccess.length ? templateAccess.join(", ") : "No template restrictions configured"}</p>
        </article>
      </div>

      <article className="control-card">
        <h2>Invite or upsert membership</h2>
        <div className="control-form-grid">
          <label>
            User ID
            <input value={inviteUserId} onChange={(e) => setInviteUserId(e.target.value)} placeholder="UUID" />
          </label>
          <label>
            Role
            <select value={inviteRole} onChange={(e) => setInviteRole(e.target.value as TenantUserMembershipClient["tenantRole"])}>
              {ROLE_OPTIONS.map((item) => (
                <option key={item} value={item}>{item}</option>
              ))}
            </select>
          </label>
          <label>
            Interface
            <select value={inviteInterface} onChange={(e) => setInviteInterface(e.target.value as TenantUserMembershipClient["interfaceAccess"])}>
              {INTERFACE_OPTIONS.map((item) => (
                <option key={item} value={item}>{item}</option>
              ))}
            </select>
          </label>
        </div>
        <button className="control-link" type="button" onClick={() => void handleInvite()} disabled={isSaving || !inviteUserId.trim()}>
          Save Membership
        </button>
      </article>

      <article className="control-card">
        <h2>Company users</h2>
        {isLoading ? <p className="control-empty">Loading memberships…</p> : null}
        {!isLoading && users.length === 0 ? <p className="control-empty">No users found for this tenant.</p> : null}
        <ul className="control-list">
          {users.map((member) => (
            <li key={member.userId}>
              <span>
                <strong>{member.name ?? member.userId}</strong>
                {member.email ? ` (${member.email})` : ""}
              </span>
              <span>
                <select
                  value={member.tenantRole}
                  onChange={(e) => {
                    const nextRole = e.target.value as TenantUserMembershipClient["tenantRole"];
                    setUsers((prev) => prev.map((item) => item.userId === member.userId ? { ...item, tenantRole: nextRole } : item));
                  }}
                >
                  {ROLE_OPTIONS.map((item) => (
                    <option key={item} value={item}>{item}</option>
                  ))}
                </select>
                <select
                  value={member.interfaceAccess}
                  onChange={(e) => {
                    const nextAccess = e.target.value as TenantUserMembershipClient["interfaceAccess"];
                    setUsers((prev) => prev.map((item) => item.userId === member.userId ? { ...item, interfaceAccess: nextAccess } : item));
                  }}
                >
                  {INTERFACE_OPTIONS.map((item) => (
                    <option key={item} value={item}>{item}</option>
                  ))}
                </select>
                <button className="control-link" type="button" onClick={() => void handleMembershipUpdate(member)} disabled={isSaving}>
                  Update
                </button>
                <button className="control-link" type="button" onClick={() => void handleRemove(member.userId)} disabled={isSaving}>
                  Remove
                </button>
              </span>
            </li>
          ))}
        </ul>
      </article>
    </section>
  );
}
