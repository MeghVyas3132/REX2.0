"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api";
import type {
  KnowledgeCorpusClient,
  KnowledgeDocumentClient,
  KnowledgeChunkClient,
  KnowledgeQueryResultClient,
} from "@/lib/api";
import { useRouter } from "next/navigation";
import Link from "next/link";

type ScopeType = "user" | "workflow" | "execution";

export default function CorporaPage() {
  const { user, token, loading: authLoading, logout } = useAuth();
  const [corpora, setCorpora] = useState<KnowledgeCorpusClient[]>([]);
  const [documents, setDocuments] = useState<KnowledgeDocumentClient[]>([]);
  const [chunks, setChunks] = useState<KnowledgeChunkClient[]>([]);
  const [queryResult, setQueryResult] = useState<KnowledgeQueryResultClient | null>(null);

  const [selectedCorpusId, setSelectedCorpusId] = useState<string>("");
  const [selectedDocumentId, setSelectedDocumentId] = useState<string>("");

  const [newCorpusName, setNewCorpusName] = useState("");
  const [newCorpusDescription, setNewCorpusDescription] = useState("");
  const [newCorpusScope, setNewCorpusScope] = useState<ScopeType>("user");
  const [newCorpusWorkflowId, setNewCorpusWorkflowId] = useState("");
  const [newCorpusExecutionId, setNewCorpusExecutionId] = useState("");

  const [docTitle, setDocTitle] = useState("");
  const [docContent, setDocContent] = useState("");
  const [docSourceType, setDocSourceType] = useState<"upload" | "inline" | "api">("inline");

  const [queryText, setQueryText] = useState("");
  const [queryTopK, setQueryTopK] = useState("8");

  const [loadingCorpora, setLoadingCorpora] = useState(true);
  const [working, setWorking] = useState(false);
  const [error, setError] = useState("");

  const router = useRouter();

  useEffect(() => {
    if (authLoading) return;
    if (!token) {
      router.push("/login");
      return;
    }
    void refreshCorpora(token);
  }, [authLoading, token, router]);

  useEffect(() => {
    if (!token || !selectedCorpusId) {
      setDocuments([]);
      setSelectedDocumentId("");
      setChunks([]);
      return;
    }

    void loadDocuments(token, selectedCorpusId);
  }, [token, selectedCorpusId]);

  useEffect(() => {
    if (!token || !selectedDocumentId) {
      setChunks([]);
      return;
    }

    void loadChunks(token, selectedDocumentId);
  }, [token, selectedDocumentId]);

  async function refreshCorpora(accessToken: string): Promise<void> {
    setLoadingCorpora(true);
    setError("");
    try {
      const response = await api.knowledge.listCorpora(accessToken, 1, 100);
      setCorpora(response.data);
      if (response.data.length > 0 && !selectedCorpusId) {
        setSelectedCorpusId(response.data[0]!.id);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load corpora");
    } finally {
      setLoadingCorpora(false);
    }
  }

  async function loadDocuments(accessToken: string, corpusId: string): Promise<void> {
    try {
      const response = await api.knowledge.listDocuments(accessToken, corpusId, 1, 100);
      setDocuments(response.data);
      if (response.data.length > 0) {
        setSelectedDocumentId((prev) => prev || response.data[0]!.id);
      } else {
        setSelectedDocumentId("");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load documents");
      setDocuments([]);
      setSelectedDocumentId("");
    }
  }

  async function loadChunks(accessToken: string, documentId: string): Promise<void> {
    try {
      const response = await api.knowledge.listChunks(accessToken, documentId, 1, 100);
      setChunks(response.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load chunks");
      setChunks([]);
    }
  }

  async function handleCreateCorpus(): Promise<void> {
    if (!token) return;
    if (!newCorpusName.trim()) {
      setError("Corpus name is required");
      return;
    }

    if (newCorpusScope === "workflow" && !newCorpusWorkflowId.trim()) {
      setError("workflowId is required for workflow scope");
      return;
    }

    if (newCorpusScope === "execution" && !newCorpusExecutionId.trim()) {
      setError("executionId is required for execution scope");
      return;
    }

    setWorking(true);
    setError("");

    try {
      await api.knowledge.createCorpus(token, {
        name: newCorpusName.trim(),
        description: newCorpusDescription.trim() || undefined,
        scopeType: newCorpusScope,
        workflowId: newCorpusScope === "workflow" ? newCorpusWorkflowId.trim() : undefined,
        executionId: newCorpusScope === "execution" ? newCorpusExecutionId.trim() : undefined,
      });

      setNewCorpusName("");
      setNewCorpusDescription("");
      setNewCorpusScope("user");
      setNewCorpusWorkflowId("");
      setNewCorpusExecutionId("");
      await refreshCorpora(token);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create corpus");
    } finally {
      setWorking(false);
    }
  }

  async function handleIngestDocument(): Promise<void> {
    if (!token || !selectedCorpusId) {
      setError("Select a corpus first");
      return;
    }

    if (!docTitle.trim() || !docContent.trim()) {
      setError("Document title and content are required");
      return;
    }

    setWorking(true);
    setError("");

    try {
      await api.knowledge.ingestDocument(token, {
        corpusId: selectedCorpusId,
        title: docTitle.trim(),
        contentText: docContent,
        sourceType: docSourceType,
      });

      setDocTitle("");
      setDocContent("");
      await loadDocuments(token, selectedCorpusId);
      await refreshCorpora(token);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to ingest document");
    } finally {
      setWorking(false);
    }
  }

  async function handleQuery(): Promise<void> {
    if (!token) return;
    if (!queryText.trim()) {
      setError("Query is required");
      return;
    }

    const parsedTopK = Number(queryTopK);
    const topK = Number.isFinite(parsedTopK) ? Math.max(1, Math.min(50, Math.floor(parsedTopK))) : 8;

    setWorking(true);
    setError("");

    try {
      const response = await api.knowledge.query(token, {
        query: queryText.trim(),
        topK,
        corpusId: selectedCorpusId || undefined,
      });
      setQueryResult(response.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to query corpus");
      setQueryResult(null);
    } finally {
      setWorking(false);
    }
  }

  if (authLoading || !token) return null;

  return (
    <div style={styles.layout}>
      <nav style={styles.sidebar}>
        <div style={styles.brand}>REX</div>
        <div style={styles.navLinks}>
          <Link href="/dashboard" style={styles.navLink}>Workflows</Link>
          <Link href="/dashboard/active-workflows" style={styles.navLink}>Active Workflows</Link>
          <Link href="/dashboard/current-workflow" style={styles.navLink}>Current Workflow</Link>
          <Link href="/dashboard/corpora" style={styles.navLinkActive}>Corpora</Link>
          <Link href="/dashboard/templates" style={styles.navLink}>Templates</Link>
          <Link href="/dashboard/settings" style={styles.navLink}>Settings</Link>
        </div>
        <div style={styles.userSection}>
          <span style={styles.userName}>{user?.name}</span>
          <button onClick={logout} style={styles.logoutBtn}>Sign Out</button>
        </div>
      </nav>

      <main style={styles.main}>
        <h1 style={styles.heading}>Corpora</h1>

        {error ? <p style={styles.error}>{error}</p> : null}

        <div style={styles.grid}>
          <section style={styles.card}>
            <h2 style={styles.cardTitle}>Create Corpus</h2>
            <input
              style={styles.input}
              placeholder="Corpus name"
              value={newCorpusName}
              onChange={(e) => setNewCorpusName(e.target.value)}
            />
            <input
              style={styles.input}
              placeholder="Description (optional)"
              value={newCorpusDescription}
              onChange={(e) => setNewCorpusDescription(e.target.value)}
            />
            <select style={styles.input} value={newCorpusScope} onChange={(e) => setNewCorpusScope(e.target.value as ScopeType)}>
              <option value="user">User</option>
              <option value="workflow">Workflow</option>
              <option value="execution">Execution</option>
            </select>
            {newCorpusScope === "workflow" ? (
              <input
                style={styles.input}
                placeholder="workflowId"
                value={newCorpusWorkflowId}
                onChange={(e) => setNewCorpusWorkflowId(e.target.value)}
              />
            ) : null}
            {newCorpusScope === "execution" ? (
              <input
                style={styles.input}
                placeholder="executionId"
                value={newCorpusExecutionId}
                onChange={(e) => setNewCorpusExecutionId(e.target.value)}
              />
            ) : null}
            <button style={styles.btnPrimary} onClick={handleCreateCorpus} disabled={working}>Create Corpus</button>
          </section>

          <section style={styles.card}>
            <h2 style={styles.cardTitle}>Corpora List</h2>
            {loadingCorpora ? (
              <p style={styles.muted}>Loading...</p>
            ) : (
              <select
                style={styles.input}
                value={selectedCorpusId}
                onChange={(e) => {
                  setSelectedCorpusId(e.target.value);
                  setQueryResult(null);
                }}
              >
                <option value="">Select corpus</option>
                {corpora.map((corpus) => (
                  <option key={corpus.id} value={corpus.id}>
                    {corpus.name} ({corpus.scopeType})
                  </option>
                ))}
              </select>
            )}

            {selectedCorpusId ? (
              <div style={styles.metaBox}>
                <div>Selected Corpus ID:</div>
                <div style={styles.mono}>{selectedCorpusId}</div>
              </div>
            ) : null}
          </section>

          <section style={styles.cardWide}>
            <h2 style={styles.cardTitle}>Ingest Document</h2>
            <input
              style={styles.input}
              placeholder="Document title"
              value={docTitle}
              onChange={(e) => setDocTitle(e.target.value)}
            />
            <select style={styles.input} value={docSourceType} onChange={(e) => setDocSourceType(e.target.value as "upload" | "inline" | "api")}>
              <option value="inline">inline</option>
              <option value="upload">upload</option>
              <option value="api">api</option>
            </select>
            <textarea
              style={styles.textarea}
              placeholder="Paste document content"
              value={docContent}
              onChange={(e) => setDocContent(e.target.value)}
            />
            <button style={styles.btnPrimary} onClick={handleIngestDocument} disabled={working || !selectedCorpusId}>Ingest Document</button>
          </section>

          <section style={styles.card}>
            <h2 style={styles.cardTitle}>Documents</h2>
            <select
              style={styles.input}
              value={selectedDocumentId}
              onChange={(e) => setSelectedDocumentId(e.target.value)}
            >
              <option value="">Select document</option>
              {documents.map((doc) => (
                <option key={doc.id} value={doc.id}>
                  {doc.title} ({doc.status})
                </option>
              ))}
            </select>
            <div style={styles.scrollBox}>
              {documents.map((doc) => (
                <div key={doc.id} style={styles.listRow}>
                  <div>{doc.title}</div>
                  <div style={styles.smallMuted}>{doc.status}</div>
                </div>
              ))}
            </div>
          </section>

          <section style={styles.card}>
            <h2 style={styles.cardTitle}>Chunks</h2>
            <div style={styles.scrollBox}>
              {chunks.map((chunk) => (
                <div key={chunk.id} style={styles.chunkCard}>
                  <div style={styles.smallMuted}>#{chunk.chunkIndex}</div>
                  <div style={styles.chunkText}>{chunk.content.slice(0, 200)}{chunk.content.length > 200 ? "..." : ""}</div>
                </div>
              ))}
            </div>
          </section>

          <section style={styles.cardWide}>
            <h2 style={styles.cardTitle}>Query Corpus</h2>
            <input
              style={styles.input}
              placeholder="Query"
              value={queryText}
              onChange={(e) => setQueryText(e.target.value)}
            />
            <input
              style={styles.input}
              type="number"
              min={1}
              max={50}
              value={queryTopK}
              onChange={(e) => setQueryTopK(e.target.value)}
            />
            <button style={styles.btnPrimary} onClick={handleQuery} disabled={working}>Run Query</button>

            {queryResult ? (
              <div style={styles.scrollBox}>
                {queryResult.matches.map((match) => (
                  <div key={match.chunkId} style={styles.chunkCard}>
                    <div style={styles.smallMuted}>{match.title} • score {match.score.toFixed(4)}</div>
                    <div style={styles.chunkText}>{match.content}</div>
                  </div>
                ))}
              </div>
            ) : null}
          </section>
        </div>
      </main>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  layout: { display: "flex", minHeight: "100vh", backgroundColor: "#0a0a0a" },
  sidebar: {
    width: "220px",
    backgroundColor: "#111111",
    borderRight: "1px solid #2a2a2a",
    display: "flex",
    flexDirection: "column",
    padding: "20px 16px",
  },
  brand: { fontSize: "20px", fontWeight: 700, color: "#e5e5e5", letterSpacing: "3px", marginBottom: "32px" },
  navLinks: { display: "flex", flexDirection: "column", gap: "4px", flex: 1 },
  navLink: { padding: "10px 12px", borderRadius: "6px", color: "#999999", fontSize: "14px", textDecoration: "none" },
  navLinkActive: {
    padding: "10px 12px",
    borderRadius: "6px",
    backgroundColor: "#1a1a1a",
    color: "#e5e5e5",
    fontSize: "14px",
    textDecoration: "none",
    fontWeight: 500,
  },
  userSection: { borderTop: "1px solid #2a2a2a", paddingTop: "16px", display: "flex", flexDirection: "column", gap: "8px" },
  userName: { fontSize: "13px", color: "#999999" },
  logoutBtn: {
    background: "none",
    border: "1px solid #2a2a2a",
    color: "#666666",
    padding: "6px 12px",
    borderRadius: "4px",
    cursor: "pointer",
    fontSize: "12px",
  },
  main: { flex: 1, padding: "30px 36px" },
  heading: { margin: 0, marginBottom: "16px", fontSize: "24px", color: "#e5e5e5" },
  error: { color: "#ef4444", fontSize: "13px" },
  muted: { color: "#666", fontSize: "13px" },
  grid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" },
  card: { background: "#111", border: "1px solid #2a2a2a", borderRadius: "8px", padding: "12px", display: "flex", flexDirection: "column", gap: "8px", minHeight: "180px" },
  cardWide: { gridColumn: "1 / -1", background: "#111", border: "1px solid #2a2a2a", borderRadius: "8px", padding: "12px", display: "flex", flexDirection: "column", gap: "8px" },
  cardTitle: { margin: 0, fontSize: "14px", color: "#e5e5e5" },
  input: {
    background: "#0b0b0b",
    border: "1px solid #2a2a2a",
    color: "#e5e5e5",
    borderRadius: "6px",
    padding: "8px 10px",
    fontSize: "13px",
  },
  textarea: {
    background: "#0b0b0b",
    border: "1px solid #2a2a2a",
    color: "#e5e5e5",
    borderRadius: "6px",
    padding: "8px 10px",
    minHeight: "140px",
    fontSize: "13px",
    resize: "vertical",
  },
  btnPrimary: {
    alignSelf: "flex-start",
    padding: "8px 12px",
    border: "none",
    borderRadius: "6px",
    background: "#e5e5e5",
    color: "#111",
    fontWeight: 600,
    fontSize: "12px",
    cursor: "pointer",
  },
  metaBox: {
    background: "#0d0d0d",
    border: "1px solid #232323",
    borderRadius: "6px",
    padding: "8px",
    color: "#9b9b9b",
    fontSize: "12px",
  },
  mono: { fontFamily: "monospace", marginTop: "4px", color: "#c9c9c9" },
  scrollBox: {
    border: "1px solid #232323",
    borderRadius: "6px",
    padding: "8px",
    maxHeight: "280px",
    overflowY: "auto",
    display: "flex",
    flexDirection: "column",
    gap: "6px",
  },
  listRow: {
    background: "#0c0c0c",
    border: "1px solid #222",
    borderRadius: "6px",
    padding: "8px",
    color: "#d7d7d7",
    fontSize: "12px",
  },
  smallMuted: { color: "#888", fontSize: "11px" },
  chunkCard: {
    background: "#0c0c0c",
    border: "1px solid #222",
    borderRadius: "6px",
    padding: "8px",
    display: "flex",
    flexDirection: "column",
    gap: "6px",
  },
  chunkText: { color: "#d8d8d8", fontSize: "12px", lineHeight: 1.4 },
};
