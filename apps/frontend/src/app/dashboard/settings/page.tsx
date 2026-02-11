"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api";
import type { ApiKeyItem } from "@/lib/api";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function SettingsPage() {
  const { user, token, loading: authLoading, logout } = useAuth();
  const [keys, setKeys] = useState<ApiKeyItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [provider, setProvider] = useState("gemini");
  const [label, setLabel] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  useEffect(() => {
    if (authLoading) return;
    if (!token) {
      router.push("/login");
      return;
    }
    loadKeys();
  }, [authLoading, token]);

  async function loadKeys() {
    if (!token) return;
    try {
      const res = await api.keys.list(token);
      setKeys(res.data);
    } catch {
      // Handle silently
    } finally {
      setLoading(false);
    }
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!token) return;
    setError("");
    setSaving(true);
    try {
      await api.keys.create(token, provider, apiKey, label);
      setShowForm(false);
      setProvider("gemini");
      setLabel("");
      setApiKey("");
      await loadKeys();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to save key");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(keyId: string) {
    if (!token) return;
    if (!confirm("Remove this API key?")) return;
    try {
      await api.keys.delete(token, keyId);
      await loadKeys();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete key");
    }
  }

  if (authLoading || !token) return null;

  return (
    <div style={styles.layout}>
      <nav style={styles.sidebar}>
        <div style={styles.brand}>REX</div>
        <div style={styles.navLinks}>
          <Link href="/dashboard" style={styles.navLink}>Workflows</Link>
          <Link href="/dashboard/settings" style={styles.navLinkActive}>Settings</Link>
        </div>
        <div style={styles.userSection}>
          <span style={styles.userName}>{user?.name}</span>
          <button onClick={logout} style={styles.logoutBtn}>Sign Out</button>
        </div>
      </nav>

      <main style={styles.main}>
        <h1 style={styles.heading}>Settings</h1>

        {/* User Info */}
        <div style={styles.card}>
          <h2 style={styles.cardTitle}>Account</h2>
          <div style={styles.fieldRow}>
            <span style={styles.fieldLabel}>Email</span>
            <span style={styles.fieldValue}>{user?.email}</span>
          </div>
          <div style={styles.fieldRow}>
            <span style={styles.fieldLabel}>Name</span>
            <span style={styles.fieldValue}>{user?.name}</span>
          </div>
        </div>

        {/* API Keys */}
        <div style={styles.card}>
          <div style={styles.cardHeader}>
            <h2 style={styles.cardTitle}>API Keys</h2>
            <button
              onClick={() => { setShowForm(!showForm); setError(""); }}
              style={styles.addBtn}
            >
              {showForm ? "Cancel" : "Add Key"}
            </button>
          </div>

          {error && !showForm && <p style={styles.error}>{error}</p>}

          {showForm && (
            <form onSubmit={handleAdd} style={styles.form}>
              {error && <p style={styles.error}>{error}</p>}
              <div style={styles.formRow}>
                <label style={styles.formLabel}>Provider</label>
                <select
                  value={provider}
                  onChange={(e) => setProvider(e.target.value)}
                  style={styles.select}
                >
                  <option value="gemini">Gemini</option>
                  <option value="groq">Groq</option>
                </select>
              </div>
              <div style={styles.formRow}>
                <label style={styles.formLabel}>Label</label>
                <input
                  type="text"
                  value={label}
                  onChange={(e) => setLabel(e.target.value)}
                  placeholder="e.g. Production Key"
                  style={styles.input}
                  required
                />
              </div>
              <div style={styles.formRow}>
                <label style={styles.formLabel}>API Key</label>
                <input
                  type="password"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="Enter your API key"
                  style={styles.input}
                  required
                />
              </div>
              <button type="submit" style={styles.submitBtn} disabled={saving}>
                {saving ? "Saving..." : "Save Key"}
              </button>
            </form>
          )}

          {loading ? (
            <p style={styles.muted}>Loading...</p>
          ) : keys.length === 0 ? (
            <p style={styles.muted}>No API keys configured. Add one to use LLM nodes.</p>
          ) : (
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>Provider</th>
                  <th style={styles.th}>Label</th>
                  <th style={styles.th}>Added</th>
                  <th style={styles.th}></th>
                </tr>
              </thead>
              <tbody>
                {keys.map((k) => (
                  <tr key={k.id}>
                    <td style={styles.td}>
                      <span style={styles.providerBadge}>{k.provider}</span>
                    </td>
                    <td style={styles.td}>{k.label}</td>
                    <td style={styles.td}>{new Date(k.createdAt).toLocaleDateString()}</td>
                    <td style={styles.td}>
                      <button
                        type="button"
                        onClick={() => handleDelete(k.id)}
                        style={styles.deleteBtn}
                      >
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </main>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  layout: {
    display: "flex",
    minHeight: "100vh",
    backgroundColor: "#0a0a0a",
  },
  sidebar: {
    width: "220px",
    backgroundColor: "#111111",
    borderRight: "1px solid #2a2a2a",
    display: "flex",
    flexDirection: "column",
    padding: "20px 16px",
  },
  brand: {
    fontSize: "20px",
    fontWeight: 700,
    color: "#e5e5e5",
    letterSpacing: "3px",
    marginBottom: "32px",
  },
  navLinks: {
    display: "flex",
    flexDirection: "column",
    gap: "4px",
    flex: 1,
  },
  navLink: {
    padding: "10px 12px",
    borderRadius: "6px",
    color: "#999999",
    fontSize: "14px",
    textDecoration: "none",
  },
  navLinkActive: {
    padding: "10px 12px",
    borderRadius: "6px",
    backgroundColor: "#1a1a1a",
    color: "#e5e5e5",
    fontSize: "14px",
    textDecoration: "none",
    fontWeight: 500,
  },
  userSection: {
    borderTop: "1px solid #2a2a2a",
    paddingTop: "16px",
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  },
  userName: {
    fontSize: "13px",
    color: "#999999",
  },
  logoutBtn: {
    background: "none",
    border: "1px solid #2a2a2a",
    color: "#666666",
    padding: "6px 12px",
    borderRadius: "4px",
    cursor: "pointer",
    fontSize: "12px",
  },
  main: {
    flex: 1,
    padding: "32px 40px",
    maxWidth: "800px",
  },
  heading: {
    fontSize: "24px",
    fontWeight: 600,
    color: "#e5e5e5",
    marginBottom: "32px",
  },
  card: {
    backgroundColor: "#111111",
    border: "1px solid #2a2a2a",
    borderRadius: "8px",
    padding: "24px",
    marginBottom: "20px",
  },
  cardHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "16px",
  },
  cardTitle: {
    fontSize: "16px",
    fontWeight: 600,
    color: "#cccccc",
    margin: 0,
    marginBottom: "16px",
  },
  fieldRow: {
    display: "flex",
    justifyContent: "space-between",
    padding: "8px 0",
    borderBottom: "1px solid #1a1a1a",
  },
  fieldLabel: {
    fontSize: "13px",
    color: "#666666",
  },
  fieldValue: {
    fontSize: "13px",
    color: "#e5e5e5",
  },
  addBtn: {
    padding: "6px 14px",
    backgroundColor: "transparent",
    color: "#999999",
    border: "1px solid #2a2a2a",
    borderRadius: "4px",
    fontSize: "12px",
    cursor: "pointer",
  },
  form: {
    backgroundColor: "#0a0a0a",
    border: "1px solid #1a1a1a",
    borderRadius: "6px",
    padding: "20px",
    marginBottom: "16px",
    display: "flex",
    flexDirection: "column",
    gap: "14px",
  },
  formRow: {
    display: "flex",
    flexDirection: "column",
    gap: "6px",
  },
  formLabel: {
    fontSize: "12px",
    color: "#666666",
    textTransform: "uppercase" as const,
    letterSpacing: "0.5px",
  },
  input: {
    padding: "10px 12px",
    backgroundColor: "#111111",
    border: "1px solid #2a2a2a",
    borderRadius: "4px",
    color: "#e5e5e5",
    fontSize: "14px",
    outline: "none",
  },
  select: {
    padding: "10px 12px",
    backgroundColor: "#111111",
    border: "1px solid #2a2a2a",
    borderRadius: "4px",
    color: "#e5e5e5",
    fontSize: "14px",
    outline: "none",
  },
  submitBtn: {
    padding: "10px 20px",
    backgroundColor: "#e5e5e5",
    color: "#0a0a0a",
    border: "none",
    borderRadius: "6px",
    fontSize: "13px",
    fontWeight: 600,
    cursor: "pointer",
    alignSelf: "flex-start",
  },
  error: {
    color: "#ef4444",
    fontSize: "13px",
    margin: 0,
  },
  muted: {
    color: "#666666",
    fontSize: "14px",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
  },
  th: {
    textAlign: "left",
    padding: "10px 12px",
    fontSize: "11px",
    fontWeight: 600,
    color: "#666666",
    textTransform: "uppercase" as const,
    letterSpacing: "0.5px",
    borderBottom: "1px solid #2a2a2a",
  },
  td: {
    padding: "12px",
    fontSize: "13px",
    color: "#999999",
    borderBottom: "1px solid #1a1a1a",
  },
  providerBadge: {
    fontSize: "11px",
    fontWeight: 500,
    color: "#e5e5e5",
    backgroundColor: "#1a1a1a",
    padding: "2px 8px",
    borderRadius: "3px",
    textTransform: "uppercase" as const,
    letterSpacing: "0.5px",
  },
  deleteBtn: {
    background: "none",
    border: "none",
    color: "#ef4444",
    fontSize: "12px",
    cursor: "pointer",
    padding: "4px 8px",
  },
};
