"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { api, type AdminAuditEventClient } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";

export default function AdminAuditLogPage() {
  const { token, loading: authLoading } = useAuth();
  const router = useRouter();
  const [events, setEvents] = useState<AdminAuditEventClient[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!token) {
      router.push("/login");
      return;
    }

    const load = async () => {
      try {
        setError(null);
        const res = await api.admin.getAuditLog(token);
        setEvents(res.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load audit log");
      } finally {
        setIsLoading(false);
      }
    };

    void load();
  }, [authLoading, token, router]);

  const recent = useMemo(() => events.slice(0, 10), [events]);

  if (authLoading || !token) return null;

  return (
    <section className="control-header">
      <h1>Audit Log</h1>
      <p>Immutable record of administrative actions, approvals, and rollback events.</p>
      {error ? <p className="control-error">{error}</p> : null}

      {isLoading ? <article className="control-card control-skeleton" /> : null}

      <article className="control-card">
        <h3>Recent control-plane events</h3>
        <ul className="control-list">
          {!isLoading && recent.length === 0 ? (
            <li>
              <span className="control-empty">No audit events recorded yet.</span>
              <span className="control-badge control-badge--warn">empty</span>
            </li>
          ) : null}
          {recent.map((item, index) => (
            <li key={`${item.createdAt ?? "event"}-${index}`}>
              <span>
                {item.action ?? "action"} · {item.targetType ?? "resource"} · {item.actorId ?? "system"}
              </span>
              <span className="control-badge">
                {item.createdAt ? new Date(item.createdAt).toLocaleString() : "unknown"}
              </span>
            </li>
          ))}
        </ul>
      </article>
    </section>
  );
}
