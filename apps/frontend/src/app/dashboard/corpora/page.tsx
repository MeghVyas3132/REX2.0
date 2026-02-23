"use client";

import { useEffect, useState, useCallback, useRef } from "react";
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

type ActiveTab = "add" | "browse" | "search";

/* Supported file extensions and their labels */
const SUPPORTED_FORMATS = [
  { ext: ".txt", label: "TXT", mime: "text/plain" },
  { ext: ".csv", label: "CSV", mime: "text/csv" },
  { ext: ".json", label: "JSON", mime: "application/json" },
  { ext: ".md", label: "Markdown", mime: "text/markdown" },
  { ext: ".xml", label: "XML", mime: "application/xml" },
  { ext: ".html", label: "HTML", mime: "text/html" },
  { ext: ".log", label: "LOG", mime: "text/plain" },
  { ext: ".yaml", label: "YAML", mime: "text/yaml" },
  { ext: ".yml", label: "YAML", mime: "text/yaml" },
  { ext: ".tsv", label: "TSV", mime: "text/tab-separated-values" },
] as const;
const ACCEPT_STRING = SUPPORTED_FORMATS.map((f) => f.ext).join(",");

function getFileExtension(name: string): string {
  const dot = name.lastIndexOf(".");
  return dot >= 0 ? name.slice(dot).toLowerCase() : "";
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

interface UploadedFile {
  name: string;
  size: number;
  ext: string;
  content: string;
}

export default function CorporaPage() {
  const { user, token, loading: authLoading, logout } = useAuth();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [corpora, setCorpora] = useState<KnowledgeCorpusClient[]>([]);
  const [documents, setDocuments] = useState<KnowledgeDocumentClient[]>([]);
  const [chunks, setChunks] = useState<KnowledgeChunkClient[]>([]);
  const [queryResult, setQueryResult] = useState<KnowledgeQueryResultClient | null>(null);

  const [selectedCorpusId, setSelectedCorpusId] = useState<string>("");
  const [selectedDocumentId, setSelectedDocumentId] = useState<string>("");
  const [activeTab, setActiveTab] = useState<ActiveTab>("add");

  const [newCorpusName, setNewCorpusName] = useState("");
  const [newCorpusDescription, setNewCorpusDescription] = useState("");
  const [showCreateForm, setShowCreateForm] = useState(false);

  const [docTitle, setDocTitle] = useState("");
  const [docContent, setDocContent] = useState("");
  const [uploadedFile, setUploadedFile] = useState<UploadedFile | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [inputMode, setInputMode] = useState<"file" | "paste">("file");

  const [queryText, setQueryText] = useState("");
  const [queryTopK, setQueryTopK] = useState("5");

  const [loadingCorpora, setLoadingCorpora] = useState(true);
  const [working, setWorking] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const clearMessages = () => { setError(""); setSuccess(""); };
  const showSuccessMsg = (msg: string) => { setSuccess(msg); setTimeout(() => setSuccess(""), 4000); };

  const refreshCorpora = useCallback(async (accessToken: string) => {
    setLoadingCorpora(true);
    clearMessages();
    try {
      const response = await api.knowledge.listCorpora(accessToken, 1, 100);
      setCorpora(response.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load knowledge bases");
    } finally {
      setLoadingCorpora(false);
    }
  }, []);

  const loadDocuments = useCallback(async (accessToken: string, corpusId: string) => {
    try {
      const response = await api.knowledge.listDocuments(accessToken, corpusId, 1, 100);
      setDocuments(response.data);
      if (response.data.length > 0) {
        setSelectedDocumentId((prev) => prev || response.data[0]!.id);
      } else {
        setSelectedDocumentId("");
      }
    } catch {
      setDocuments([]);
      setSelectedDocumentId("");
    }
  }, []);

  const loadChunks = useCallback(async (accessToken: string, documentId: string) => {
    try {
      const response = await api.knowledge.listChunks(accessToken, documentId, 1, 100);
      setChunks(response.data);
    } catch {
      setChunks([]);
    }
  }, []);

  useEffect(() => {
    if (authLoading) return;
    if (!token) { router.push("/login"); return; }
    void refreshCorpora(token);
  }, [authLoading, token, router, refreshCorpora]);

  useEffect(() => {
    if (!token || !selectedCorpusId) { setDocuments([]); setSelectedDocumentId(""); setChunks([]); return; }
    void loadDocuments(token, selectedCorpusId);
  }, [token, selectedCorpusId, loadDocuments]);

  useEffect(() => {
    if (!token || !selectedDocumentId) { setChunks([]); return; }
    void loadChunks(token, selectedDocumentId);
  }, [token, selectedDocumentId, loadChunks]);

  useEffect(() => {
    if (corpora.length > 0 && !selectedCorpusId) {
      setSelectedCorpusId(corpora[0]!.id);
    }
  }, [corpora, selectedCorpusId]);

  async function handleCreateCorpus(): Promise<void> {
    if (!token) return;
    if (!newCorpusName.trim()) { setError("Please enter a name for your knowledge base"); return; }
    setWorking(true); clearMessages();
    try {
      await api.knowledge.createCorpus(token, {
        name: newCorpusName.trim(),
        description: newCorpusDescription.trim() || undefined,
        scopeType: "user",
      });
      setNewCorpusName(""); setNewCorpusDescription(""); setShowCreateForm(false);
      await refreshCorpora(token);
      showSuccessMsg("Knowledge base created successfully!");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create knowledge base");
    } finally { setWorking(false); }
  }

  async function handleIngestDocument(): Promise<void> {
    if (!token || !selectedCorpusId) { setError("Please select a knowledge base first"); return; }
    const content = inputMode === "file" ? uploadedFile?.content ?? "" : docContent;
    const title = docTitle.trim() || (uploadedFile?.name ?? "");
    if (!title) { setError("Please enter a document title or upload a file"); return; }
    if (!content.trim()) { setError(inputMode === "file" ? "Please upload a file first" : "Please paste the document content"); return; }
    setWorking(true); clearMessages();
    try {
      await api.knowledge.ingestDocument(token, {
        corpusId: selectedCorpusId,
        title,
        contentText: content,
        sourceType: inputMode === "file" ? "upload" : "inline",
        mimeType: uploadedFile?.ext ? SUPPORTED_FORMATS.find((f) => f.ext === uploadedFile.ext)?.mime : undefined,
      });
      setDocTitle(""); setDocContent(""); setUploadedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      await loadDocuments(token, selectedCorpusId);
      await refreshCorpora(token);
      showSuccessMsg(`"${title}" is being processed and will appear in documents shortly.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add document");
    } finally { setWorking(false); }
  }

  function handleFileRead(file: File): void {
    const ext = getFileExtension(file.name);
    const supported = SUPPORTED_FORMATS.some((f) => f.ext === ext);
    if (!supported) {
      setError(`Unsupported file type "${ext}". Supported: ${SUPPORTED_FORMATS.map((f) => f.label).filter((v, i, a) => a.indexOf(v) === i).join(", ")}`);
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setError("File is too large. Maximum size is 10 MB.");
      return;
    }
    clearMessages();
    const reader = new FileReader();
    reader.onload = () => {
      const text = reader.result as string;
      setUploadedFile({ name: file.name, size: file.size, ext, content: text });
      if (!docTitle.trim()) setDocTitle(file.name.replace(/\.[^.]+$/, ""));
    };
    reader.onerror = () => setError("Failed to read the file. Please try again.");
    reader.readAsText(file);
  }

  function handleDrop(e: React.DragEvent): void {
    e.preventDefault(); e.stopPropagation(); setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFileRead(file);
  }

  function handleFileInput(e: React.ChangeEvent<HTMLInputElement>): void {
    const file = e.target.files?.[0];
    if (file) handleFileRead(file);
  }

  async function handleQuery(): Promise<void> {
    if (!token) return;
    if (!queryText.trim()) { setError("Please enter a search query"); return; }
    const parsedTopK = Number(queryTopK);
    const topK = Number.isFinite(parsedTopK) ? Math.max(1, Math.min(50, Math.floor(parsedTopK))) : 5;
    setWorking(true); clearMessages();
    try {
      const response = await api.knowledge.query(token, {
        query: queryText.trim(), topK,
        corpusId: selectedCorpusId || undefined,
      });
      setQueryResult(response.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Search failed");
      setQueryResult(null);
    } finally { setWorking(false); }
  }

  if (authLoading || !token) return null;

  return (
    <div style={s.layout}>
      {/* Sidebar — identical to dashboard/page.tsx */}
      <nav style={s.sidebar}>
        <div style={s.brand}>REX</div>
        <div style={s.navLinks}>
          <Link href="/dashboard" style={s.navLink}>Workflows</Link>
          <Link href="/dashboard/active-workflows" style={s.navLink}>Active Workflows</Link>
          <Link href="/dashboard/current-workflow" style={s.navLink}>Current Workflow</Link>
          <Link href="/dashboard/corpora" style={s.navLinkActive}>Corpora</Link>
          <Link href="/dashboard/templates" style={s.navLink}>Templates</Link>
          <Link href="/dashboard/settings" style={s.navLink}>Settings</Link>
        </div>
        <div style={s.userSection}>
          <span style={s.userName}>{user?.name}</span>
          <button onClick={logout} style={s.logoutBtn}>Sign Out</button>
        </div>
      </nav>

      {/* Main */}
      <main style={s.main}>
        <div style={s.header}>
          <div>
            <h1 style={s.heading}>Corpora</h1>
            <p style={s.subtitle}>Upload documents so your AI workflows can reference them.</p>
          </div>
          <button style={s.createBtn} onClick={() => { setShowCreateForm(!showCreateForm); clearMessages(); }}>
            {showCreateForm ? "Cancel" : "+ New Knowledge Base"}
          </button>
        </div>

        {error && <div style={s.alertError}>{error}</div>}
        {success && <div style={s.alertSuccess}>{success}</div>}

        {/* Create form */}
        {showCreateForm && (
          <div style={s.card}>
            <h3 style={s.cardTitle}>Create a New Knowledge Base</h3>
            <p style={s.hint}>A knowledge base is a collection of documents your AI can reference during workflows.</p>
            <div style={s.formRow}>
              <div style={s.formField}>
                <label style={s.label}>Name *</label>
                <input style={s.input} placeholder="e.g. Company Policies, Product Docs, FAQ..." value={newCorpusName} onChange={(e) => setNewCorpusName(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleCreateCorpus()} />
              </div>
              <div style={s.formField}>
                <label style={s.label}>Description (optional)</label>
                <input style={s.input} placeholder="What kind of documents will this contain?" value={newCorpusDescription} onChange={(e) => setNewCorpusDescription(e.target.value)} />
              </div>
            </div>
            <button style={{ ...s.primaryBtn, opacity: working || !newCorpusName.trim() ? 0.4 : 1, cursor: working || !newCorpusName.trim() ? "not-allowed" : "pointer" }} onClick={handleCreateCorpus} disabled={working || !newCorpusName.trim()}>
              {working ? "Creating..." : "Create Knowledge Base"}
            </button>
          </div>
        )}

        {/* KB pills */}
        {corpora.length > 0 && (
          <div style={{ marginBottom: "24px" }}>
            <label style={s.label}>Active Knowledge Base</label>
            <div style={s.pillRow}>
              {corpora.map((corpus) => (
                <button key={corpus.id} style={selectedCorpusId === corpus.id ? { ...s.pill, ...s.pillActive } : s.pill} onClick={() => { setSelectedCorpusId(corpus.id); setQueryResult(null); clearMessages(); }}>
                  <span style={{ fontWeight: 500 }}>{corpus.name}</span>
                  <span style={{ fontSize: "11px", opacity: 0.7, textTransform: "capitalize" as const }}>{corpus.status}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Empty state */}
        {corpora.length === 0 && !loadingCorpora && !showCreateForm && (
          <div style={s.emptyState}>
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#444" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: "12px" }}><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/><line x1="9" y1="7" x2="16" y2="7"/><line x1="9" y1="11" x2="14" y2="11"/></svg>
            <p style={{ fontSize: "18px", color: "#999", marginBottom: "8px" }}>No Knowledge Bases Yet</p>
            <p style={s.muted}>Create your first knowledge base to start uploading documents for your AI workflows.</p>
            <button style={{ ...s.primaryBtn, marginTop: "16px" }} onClick={() => setShowCreateForm(true)}>+ Create Knowledge Base</button>
          </div>
        )}

        {loadingCorpora && corpora.length === 0 && <p style={{ ...s.muted, padding: "40px 0", textAlign: "center" as const }}>Loading your knowledge bases...</p>}

        {/* Tabs */}
        {selectedCorpusId && (
          <>
            <div style={s.tabBar}>
              {(["add", "browse", "search"] as ActiveTab[]).map((tab) => {
                const labels: Record<ActiveTab, string> = { add: "Add Documents", browse: `Browse (${documents.length})`, search: "Search" };
                return (
                  <button key={tab} style={activeTab === tab ? { ...s.tab, ...s.tabActive } : s.tab} onClick={() => setActiveTab(tab)}>
                    {labels[tab]}
                  </button>
                );
              })}
            </div>

            {/* Add Documents */}
            {activeTab === "add" && (
              <div style={s.card}>
                <h3 style={s.cardTitle}>Add a Document</h3>
                <p style={s.hint}>Upload a file or paste text. REX will break it into searchable chunks so your AI workflows can reference it.</p>

                {/* Mode toggle */}
                <div style={s.modeToggleRow}>
                  <button style={inputMode === "file" ? { ...s.modeBtn, ...s.modeBtnActive } : s.modeBtn} onClick={() => setInputMode("file")}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                    Upload File
                  </button>
                  <button style={inputMode === "paste" ? { ...s.modeBtn, ...s.modeBtnActive } : s.modeBtn} onClick={() => setInputMode("paste")}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="8" y="2" width="8" height="4" rx="1" ry="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/></svg>
                    Paste Text
                  </button>
                </div>

                {/* File upload mode */}
                {inputMode === "file" && (
                  <>
                    {/* Drop zone */}
                    <div
                      style={dragOver ? { ...s.dropZone, ...s.dropZoneActive } : s.dropZone}
                      onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                      onDragLeave={() => setDragOver(false)}
                      onDrop={handleDrop}
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <input ref={fileInputRef} type="file" accept={ACCEPT_STRING} onChange={handleFileInput} style={{ display: "none" }} />
                      {!uploadedFile ? (
                        <>
                          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke={dragOver ? "#60a5fa" : "#555"} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                            <polyline points="17 8 12 3 7 8"/>
                            <line x1="12" y1="3" x2="12" y2="15"/>
                          </svg>
                          <p style={{ fontSize: "15px", color: dragOver ? "#60a5fa" : "#bbb", margin: "12px 0 4px", fontWeight: 500 }}>
                            {dragOver ? "Drop your file here" : "Drag and drop a file here"}
                          </p>
                          <p style={{ fontSize: "13px", color: "#666", margin: 0 }}>or click to browse your computer</p>
                          <div style={s.formatRow}>
                            {["TXT", "CSV", "JSON", "Markdown", "XML", "HTML", "YAML", "TSV", "LOG"].map((fmt) => (
                              <span key={fmt} style={s.formatBadge}>{fmt}</span>
                            ))}
                          </div>
                          <p style={{ fontSize: "11px", color: "#555", margin: "8px 0 0" }}>Max file size: 10 MB</p>
                        </>
                      ) : (
                        <div style={s.fileInfoCard}>
                          <div style={s.fileIcon}>
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#60a5fa" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>
                            </svg>
                          </div>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: "14px", fontWeight: 500, color: "#e5e5e5" }}>{uploadedFile.name}</div>
                            <div style={{ fontSize: "12px", color: "#777", marginTop: "2px" }}>
                              {formatFileSize(uploadedFile.size)} &middot; {uploadedFile.content.length.toLocaleString()} characters
                            </div>
                          </div>
                          <button style={s.removeFileBtn} onClick={(e) => { e.stopPropagation(); setUploadedFile(null); setDocTitle(""); if (fileInputRef.current) fileInputRef.current.value = ""; }} title="Remove file">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                          </button>
                        </div>
                      )}
                    </div>

                    {/* File content preview */}
                    {uploadedFile && (
                      <div style={s.previewBox}>
                        <div style={{ fontSize: "11px", fontWeight: 600, color: "#888", textTransform: "uppercase" as const, letterSpacing: "0.5px", marginBottom: "8px" }}>Content Preview</div>
                        <pre style={s.previewText}>{uploadedFile.content.slice(0, 1000)}{uploadedFile.content.length > 1000 ? "\n\n... (truncated)" : ""}</pre>
                      </div>
                    )}
                  </>
                )}

                {/* Paste text mode */}
                {inputMode === "paste" && (
                  <div style={s.formField}>
                    <label style={s.label}>Content *</label>
                    <textarea style={s.textarea} placeholder="Paste your document content here..." value={docContent} onChange={(e) => setDocContent(e.target.value)} rows={10} />
                    {docContent.length > 0 && <span style={{ fontSize: "11px", color: "#666", textAlign: "right" as const, marginTop: "4px" }}>{docContent.length.toLocaleString()} characters</span>}
                  </div>
                )}

                {/* Title input */}
                <div style={s.formField}>
                  <label style={s.label}>Document Title {inputMode === "file" && uploadedFile ? "(auto-filled from filename)" : "*"}</label>
                  <input style={s.input} placeholder="e.g. Returns Policy 2026, Product Catalog, Meeting Notes..." value={docTitle} onChange={(e) => setDocTitle(e.target.value)} />
                </div>

                {/* Submit */}
                <button
                  style={{
                    ...s.primaryBtn, padding: "12px 28px", fontSize: "14px",
                    opacity: working || (inputMode === "file" ? !uploadedFile : !docContent.trim()) ? 0.4 : 1,
                    cursor: working || (inputMode === "file" ? !uploadedFile : !docContent.trim()) ? "not-allowed" : "pointer",
                  }}
                  onClick={handleIngestDocument}
                  disabled={working || (inputMode === "file" ? !uploadedFile : !docContent.trim())}
                >
                  {working ? "Processing..." : "Add Document to Knowledge Base"}
                </button>
              </div>
            )}

            {/* Browse */}
            {activeTab === "browse" && (
              <div>
                {documents.length === 0 ? (
                  <div style={{ ...s.emptyState, padding: "40px 20px" }}>
                    <p style={s.muted}>No documents in this knowledge base yet.</p>
                    <button style={{ ...s.ghostBtn, marginTop: "12px" }} onClick={() => setActiveTab("add")}>+ Add your first document</button>
                  </div>
                ) : (
                  <div style={s.docGrid}>
                    {documents.map((doc) => (
                      <div key={doc.id} style={selectedDocumentId === doc.id ? { ...s.docCard, borderColor: "rgba(59,130,246,0.4)", background: "rgba(59,130,246,0.05)" } : s.docCard} onClick={() => setSelectedDocumentId(doc.id)}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "8px" }}>
                          <span style={{ fontSize: "13px", fontWeight: 500, color: "#e5e5e5" }}>{doc.title}</span>
                          <span style={doc.status === "ready" ? s.statusReady : doc.status === "failed" ? s.statusFailed : s.statusPending}>
                            {doc.status === "ready" ? "Ready" : doc.status === "processing" ? "Processing" : doc.status === "pending" ? "Pending" : "Failed"}
                          </span>
                        </div>
                        <div style={{ fontSize: "11px", color: "#666", marginTop: "6px" }}>Added {new Date(doc.createdAt).toLocaleDateString()}</div>
                      </div>
                    ))}
                  </div>
                )}
                {selectedDocumentId && chunks.length > 0 && (
                  <div style={{ marginTop: "24px" }}>
                    <h4 style={{ margin: "0 0 12px", fontSize: "14px", fontWeight: 600, color: "#ccc" }}>
                      Document Chunks ({chunks.length}) <span style={{ fontWeight: 400, fontSize: "12px", color: "#666" }}>— searchable pieces your AI will reference</span>
                    </h4>
                    <div style={{ display: "flex", flexDirection: "column" as const, gap: "8px", maxHeight: "400px", overflowY: "auto" as const }}>
                      {chunks.map((chunk) => (
                        <div key={chunk.id} style={s.chunkCard}>
                          <div style={{ fontSize: "11px", fontWeight: 600, color: "#60a5fa", whiteSpace: "nowrap" as const, paddingTop: "2px" }}>#{chunk.chunkIndex + 1}</div>
                          <div style={{ fontSize: "12px", lineHeight: "1.6", color: "#bbb", flex: 1 }}>{chunk.content.slice(0, 300)}{chunk.content.length > 300 ? "..." : ""}</div>
                          {chunk.tokenCount && <div style={{ fontSize: "10px", color: "#666", whiteSpace: "nowrap" as const, paddingTop: "2px" }}>{chunk.tokenCount} tokens</div>}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Search */}
            {activeTab === "search" && (
              <div style={s.card}>
                <h3 style={s.cardTitle}>Search Your Knowledge</h3>
                <p style={s.hint}>Ask a question and REX will find the most relevant chunks from your documents.</p>
                <div style={{ display: "flex", gap: "10px", alignItems: "flex-end", flexWrap: "wrap" as const, marginBottom: "20px" }}>
                  <input style={{ ...s.input, flex: 1, minWidth: "200px" }} placeholder="Ask a question... e.g. What is the refund policy?" value={queryText} onChange={(e) => setQueryText(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleQuery()} />
                  <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <label style={{ fontSize: "12px", color: "#999", whiteSpace: "nowrap" as const }}>Results:</label>
                    <input style={{ ...s.input, width: "60px", textAlign: "center" as const }} type="number" min={1} max={50} value={queryTopK} onChange={(e) => setQueryTopK(e.target.value)} />
                  </div>
                  <button style={{ ...s.primaryBtn, opacity: working || !queryText.trim() ? 0.4 : 1, cursor: working || !queryText.trim() ? "not-allowed" : "pointer" }} onClick={handleQuery} disabled={working || !queryText.trim()}>
                    {working ? "Searching..." : "Search"}
                  </button>
                </div>
                {queryResult && (
                  <div style={{ display: "flex", flexDirection: "column" as const, gap: "10px" }}>
                    <h4 style={{ margin: "0 0 4px", fontSize: "14px", fontWeight: 600, color: "#ccc" }}>{queryResult.matches.length} result{queryResult.matches.length !== 1 ? "s" : ""} found</h4>
                    {queryResult.matches.length === 0 && <p style={s.muted}>No matching content found. Try a different query or add more documents.</p>}
                    {queryResult.matches.map((match, i) => (
                      <div key={match.chunkId} style={s.resultCard}>
                        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
                          <span style={{ fontSize: "11px", fontWeight: 700, color: "#60a5fa" }}>#{i + 1}</span>
                          <span style={{ fontSize: "13px", fontWeight: 500, color: "#e5e5e5", flex: 1 }}>{match.title}</span>
                          <span style={s.scoreTag}>{(match.score * 100).toFixed(1)}% match</span>
                        </div>
                        <div style={{ fontSize: "13px", lineHeight: "1.7", color: "#bbb" }}>{match.content}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}

/* ── styles (same pattern as dashboard/page.tsx) ── */
const s: Record<string, React.CSSProperties> = {
  layout: { display: "flex", minHeight: "100vh", backgroundColor: "#0a0a0a" },
  sidebar: { width: "220px", backgroundColor: "#111111", borderRight: "1px solid #2a2a2a", display: "flex", flexDirection: "column", padding: "20px 16px" },
  brand: { fontSize: "20px", fontWeight: 700, color: "#e5e5e5", letterSpacing: "3px", marginBottom: "32px" },
  navLinks: { display: "flex", flexDirection: "column", gap: "4px", flex: 1 },
  navLink: { padding: "10px 12px", borderRadius: "6px", color: "#999999", fontSize: "14px", textDecoration: "none", transition: "color 0.15s" },
  navLinkActive: { padding: "10px 12px", borderRadius: "6px", backgroundColor: "#1a1a1a", color: "#e5e5e5", fontSize: "14px", textDecoration: "none", fontWeight: 500 },
  userSection: { borderTop: "1px solid #2a2a2a", paddingTop: "16px", display: "flex", flexDirection: "column", gap: "8px" },
  userName: { fontSize: "13px", color: "#999999" },
  logoutBtn: { background: "none", border: "1px solid #2a2a2a", color: "#666666", padding: "6px 12px", borderRadius: "4px", cursor: "pointer", fontSize: "12px", transition: "color 0.15s" },

  main: { flex: 1, padding: "32px 40px", color: "#e5e5e5" },
  header: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "24px", gap: "16px", flexWrap: "wrap" },
  heading: { fontSize: "24px", fontWeight: 600, color: "#e5e5e5", margin: 0 },
  subtitle: { margin: "6px 0 0", fontSize: "14px", color: "#777", maxWidth: "500px", lineHeight: "1.5" },
  createBtn: { padding: "10px 20px", backgroundColor: "#e5e5e5", color: "#0a0a0a", border: "none", borderRadius: "6px", fontSize: "13px", fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap" },

  alertError: { padding: "12px 16px", borderRadius: "8px", fontSize: "13px", marginBottom: "16px", lineHeight: "1.5", background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)", color: "#f87171" },
  alertSuccess: { padding: "12px 16px", borderRadius: "8px", fontSize: "13px", marginBottom: "16px", lineHeight: "1.5", background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.2)", color: "#4ade80" },

  card: { backgroundColor: "#111111", border: "1px solid #2a2a2a", borderRadius: "8px", padding: "24px", marginBottom: "24px" },
  cardTitle: { margin: "0 0 4px", fontSize: "16px", fontWeight: 600, color: "#f0f0f0" },
  hint: { margin: "0 0 20px", fontSize: "13px", color: "#777", lineHeight: "1.5" },

  formRow: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "16px" },
  formField: { display: "flex", flexDirection: "column", gap: "6px", marginBottom: "16px" },
  label: { fontSize: "12px", fontWeight: 500, color: "#999", textTransform: "uppercase", letterSpacing: "0.5px" },
  input: { background: "#0a0a0a", border: "1px solid #2a2a2a", color: "#e5e5e5", borderRadius: "6px", padding: "10px 14px", fontSize: "14px", outline: "none", width: "100%", boxSizing: "border-box" },
  textarea: { background: "#0a0a0a", border: "1px solid #2a2a2a", color: "#e5e5e5", borderRadius: "6px", padding: "12px 14px", fontSize: "14px", outline: "none", resize: "vertical", minHeight: "160px", lineHeight: "1.6", fontFamily: "inherit", width: "100%", boxSizing: "border-box" },

  primaryBtn: { padding: "10px 20px", backgroundColor: "#e5e5e5", color: "#0a0a0a", border: "none", borderRadius: "6px", fontSize: "13px", fontWeight: 600, cursor: "pointer" },
  ghostBtn: { padding: "8px 16px", background: "none", border: "1px solid #333", color: "#999", borderRadius: "6px", fontSize: "13px", cursor: "pointer" },

  pillRow: { display: "flex", gap: "8px", flexWrap: "wrap", marginTop: "8px" },
  pill: { display: "flex", alignItems: "center", gap: "8px", padding: "8px 16px", background: "#111", border: "1px solid #2a2a2a", borderRadius: "20px", color: "#999", fontSize: "13px", cursor: "pointer" },
  pillActive: { background: "rgba(59,130,246,0.1)", borderColor: "rgba(59,130,246,0.3)", color: "#60a5fa" },

  emptyState: { display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "60px 20px", textAlign: "center" },
  muted: { color: "#666666", fontSize: "14px" },

  tabBar: { display: "flex", gap: "4px", borderBottom: "1px solid #2a2a2a", marginBottom: "20px" },
  tab: { padding: "10px 18px", background: "none", border: "none", borderBottom: "2px solid transparent", color: "#777", fontSize: "13px", cursor: "pointer" },
  tabActive: { color: "#e5e5e5", borderBottomColor: "#e5e5e5" },

  docGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" },
  docCard: { backgroundColor: "#111", border: "1px solid #2a2a2a", borderRadius: "8px", padding: "14px 16px", cursor: "pointer", transition: "border-color 0.15s" },
  statusReady: { fontSize: "11px", padding: "2px 8px", borderRadius: "12px", background: "rgba(34,197,94,0.1)", color: "#4ade80" },
  statusPending: { fontSize: "11px", padding: "2px 8px", borderRadius: "12px", background: "rgba(251,191,36,0.1)", color: "#fbbf24" },
  statusFailed: { fontSize: "11px", padding: "2px 8px", borderRadius: "12px", background: "rgba(239,68,68,0.1)", color: "#f87171" },
  chunkCard: { background: "#111", border: "1px solid #1f1f1f", borderRadius: "8px", padding: "12px 14px", display: "flex", gap: "12px", alignItems: "flex-start" },
  resultCard: { background: "#111", border: "1px solid #1f1f1f", borderRadius: "8px", padding: "14px 16px" },
  scoreTag: { fontSize: "11px", padding: "2px 8px", background: "rgba(34,197,94,0.1)", color: "#4ade80", borderRadius: "12px" },

  modeToggleRow: { display: "flex", gap: "8px", marginBottom: "20px" },
  modeBtn: { display: "flex", alignItems: "center", gap: "6px", padding: "8px 16px", background: "none", border: "1px solid #2a2a2a", borderRadius: "6px", color: "#777", fontSize: "13px", cursor: "pointer" },
  modeBtnActive: { background: "rgba(59,130,246,0.1)", borderColor: "rgba(59,130,246,0.3)", color: "#60a5fa", fontWeight: 500 },

  dropZone: { border: "2px dashed #2a2a2a", borderRadius: "10px", padding: "40px 24px", display: "flex", flexDirection: "column" as const, alignItems: "center", justifyContent: "center", cursor: "pointer", transition: "all 0.2s", marginBottom: "20px", textAlign: "center" as const, background: "#0a0a0a" },
  dropZoneActive: { borderColor: "rgba(59,130,246,0.5)", background: "rgba(59,130,246,0.03)" },

  formatRow: { display: "flex", gap: "6px", flexWrap: "wrap" as const, justifyContent: "center", marginTop: "16px" },
  formatBadge: { fontSize: "10px", fontWeight: 600, padding: "3px 8px", background: "#1a1a1a", border: "1px solid #2a2a2a", borderRadius: "4px", color: "#888", letterSpacing: "0.5px" },

  fileInfoCard: { display: "flex", alignItems: "center", gap: "12px", width: "100%", maxWidth: "440px" },
  fileIcon: { width: "44px", height: "44px", borderRadius: "8px", background: "rgba(59,130,246,0.1)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 },
  removeFileBtn: { background: "none", border: "none", color: "#666", cursor: "pointer", padding: "4px", borderRadius: "4px", display: "flex", alignItems: "center", justifyContent: "center" },

  previewBox: { background: "#0a0a0a", border: "1px solid #1f1f1f", borderRadius: "8px", padding: "14px 16px", marginBottom: "20px", maxHeight: "200px", overflow: "auto" as const },
  previewText: { margin: 0, fontSize: "12px", color: "#999", lineHeight: "1.6", whiteSpace: "pre-wrap" as const, wordBreak: "break-word" as const, fontFamily: "ui-monospace, SFMono-Regular, 'SF Mono', Menlo, monospace" },
};
