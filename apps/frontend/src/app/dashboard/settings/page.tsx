"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api";
import type { ApiKeyItem, ModelRegistryClient } from "@/lib/api";
import { useRouter } from "next/navigation";
import { AppShell, getDashboardNavItems } from "@/components/layout";
import { Badge, Button, Card, Input, StateBlock } from "@/components/ui";
import styles from "./page.module.css";

export default function SettingsPage() {
  const { user, token, loading: authLoading, logout } = useAuth();
  const [keys, setKeys] = useState<ApiKeyItem[]>([]);
  const [models, setModels] = useState<ModelRegistryClient[]>([]);
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
    void loadKeys();
  }, [authLoading, token]);

  async function loadKeys() {
    if (!token) return;
    try {
      const [keysRes, modelsRes] = await Promise.all([api.keys.list(token), api.models.list(token)]);
      setKeys(keysRes.data);
      setModels(modelsRes.data);
    } catch {
      // keep current state
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
    if (!window.confirm("Remove this API key?")) return;
    try {
      await api.keys.delete(token, keyId);
      await loadKeys();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete key");
    }
  }

  if (authLoading || !token) return null;

  return (
    <AppShell
      title="Settings"
      subtitle="Manage identity context, provider keys, and model registry visibility."
      navItems={getDashboardNavItems("settings")}
      userName={user?.name}
      onSignOut={logout}
    >
      <div className={styles.contentWrap}>
        <Card title="Account">
          <div className={styles.fieldRow}>
            <span className={styles.fieldLabel}>Email</span>
            <span className={styles.fieldValue}>{user?.email}</span>
          </div>
          <div className={styles.fieldRow}>
            <span className={styles.fieldLabel}>Name</span>
            <span className={styles.fieldValue}>{user?.name}</span>
          </div>
          <div className={styles.fieldRow}>
            <span className={styles.fieldLabel}>Role</span>
            <span className={styles.fieldValue}>{user?.role ?? "editor"}</span>
          </div>
        </Card>

        <Card
          title="API Keys"
          headerRight={
            <Button variant="secondary" size="sm" onClick={() => { setShowForm(!showForm); setError(""); }}>
              {showForm ? "Cancel" : "Add Key"}
            </Button>
          }
        >
          {error && !showForm ? (
            <StateBlock tone="error" title="Unable to update API keys" description={error} />
          ) : null}

          {showForm ? (
            <form onSubmit={handleAdd} className={styles.form}>
              {error ? (
                <StateBlock tone="error" title="Unable to save API key" description={error} />
              ) : null}

              <label className={styles.field}>
                <span className={styles.fieldLabel}>Provider</span>
                <select value={provider} onChange={(e) => setProvider(e.target.value)} className={styles.select}>
                  <option value="gemini">Gemini</option>
                  <option value="groq">Groq</option>
                  <option value="openai">OpenAI</option>
                  <option value="cohere">Cohere</option>
                </select>
              </label>

              <Input
                label="Label"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                placeholder="e.g. Production Key"
                required
              />

              <Input
                label="API Key"
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="Enter your API key"
                required
              />

              <Button type="submit" variant="primary" disabled={saving}>
                {saving ? "Saving..." : "Save Key"}
              </Button>
            </form>
          ) : null}

          {loading ? (
            <StateBlock
              tone="loading"
              title="Loading API keys"
              description="Fetching provider credentials for this workspace."
            />
          ) : keys.length === 0 ? (
            <StateBlock
              tone="empty"
              title="No API keys configured"
              description="Add at least one provider key to enable AI model nodes."
            />
          ) : (
            <table className={styles.table}>
              <thead>
                <tr>
                  <th className={styles.th}>Provider</th>
                  <th className={styles.th}>Label</th>
                  <th className={styles.th}>Added</th>
                  <th className={styles.th}></th>
                </tr>
              </thead>
              <tbody>
                {keys.map((k) => (
                  <tr key={k.id}>
                    <td className={styles.td}><Badge tone="accent">{k.provider}</Badge></td>
                    <td className={styles.td}>{k.label}</td>
                    <td className={styles.td}>{new Date(k.createdAt).toLocaleDateString()}</td>
                    <td className={styles.td}>
                      <Button type="button" variant="danger" size="sm" onClick={() => void handleDelete(k.id)}>
                        Remove
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>

        <Card title="Model Registry">
          {models.length === 0 ? (
            <StateBlock
              tone="empty"
              title="No models available"
              description="Model catalog is empty in this environment."
            />
          ) : (
            <table className={styles.table}>
              <thead>
                <tr>
                  <th className={styles.th}>Provider</th>
                  <th className={styles.th}>Model</th>
                  <th className={styles.th}>Tier</th>
                  <th className={styles.th}>Context</th>
                </tr>
              </thead>
              <tbody>
                {models.map((model) => (
                  <tr key={model.id}>
                    <td className={styles.td}>{model.provider}</td>
                    <td className={styles.td}>{model.displayName}</td>
                    <td className={styles.td}>{model.qualityTier}</td>
                    <td className={styles.td}>{model.contextWindow ?? "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>
      </div>
    </AppShell>
  );
}
