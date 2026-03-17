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
import { AppShell, getDashboardNavItems } from "@/components/layout";
import { Button, StateBlock } from "@/components/ui";
import styles from "./page.module.css";

type ActiveTab = "add" | "browse" | "search";

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
  { ext: ".pdf", label: "PDF", mime: "application/pdf" },
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

  const clearMessages = () => {
    setError("");
    setSuccess("");
  };

  const showSuccessMsg = (msg: string) => {
    setSuccess(msg);
    setTimeout(() => setSuccess(""), 4000);
  };

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
    if (!token) {
      router.push("/login");
      return;
    }
    void refreshCorpora(token);
  }, [authLoading, token, router, refreshCorpora]);

  useEffect(() => {
    if (!token || !selectedCorpusId) {
      setDocuments([]);
      setSelectedDocumentId("");
      setChunks([]);
      return;
    }
    void loadDocuments(token, selectedCorpusId);
  }, [token, selectedCorpusId, loadDocuments]);

  useEffect(() => {
    if (!token || !selectedDocumentId) {
      setChunks([]);
      return;
    }
    void loadChunks(token, selectedDocumentId);
  }, [token, selectedDocumentId, loadChunks]);

  useEffect(() => {
    if (corpora.length > 0 && !selectedCorpusId) {
      setSelectedCorpusId(corpora[0]!.id);
    }
  }, [corpora, selectedCorpusId]);

  async function handleCreateCorpus(): Promise<void> {
    if (!token) return;
    if (!newCorpusName.trim()) {
      setError("Please enter a name for your knowledge base");
      return;
    }
    setWorking(true);
    clearMessages();
    try {
      await api.knowledge.createCorpus(token, {
        name: newCorpusName.trim(),
        description: newCorpusDescription.trim() || undefined,
        scopeType: "user",
      });
      setNewCorpusName("");
      setNewCorpusDescription("");
      setShowCreateForm(false);
      await refreshCorpora(token);
      showSuccessMsg("Knowledge base created successfully!");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create knowledge base");
    } finally {
      setWorking(false);
    }
  }

  async function handleIngestDocument(): Promise<void> {
    if (!token || !selectedCorpusId) {
      setError("Please select a knowledge base first");
      return;
    }
    const content = inputMode === "file" ? uploadedFile?.content ?? "" : docContent;
    const title = docTitle.trim() || (uploadedFile?.name ?? "");
    if (!title) {
      setError("Please enter a document title or upload a file");
      return;
    }
    if (!content.trim()) {
      setError(inputMode === "file" ? "Please upload a file first" : "Please paste the document content");
      return;
    }
    setWorking(true);
    clearMessages();
    try {
      await api.knowledge.ingestDocument(token, {
        corpusId: selectedCorpusId,
        title,
        contentText: content,
        sourceType: inputMode === "file" ? "upload" : "inline",
        mimeType: uploadedFile?.ext
          ? SUPPORTED_FORMATS.find((f) => f.ext === uploadedFile.ext)?.mime
          : undefined,
      });
      setDocTitle("");
      setDocContent("");
      setUploadedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      await loadDocuments(token, selectedCorpusId);
      await refreshCorpora(token);
      showSuccessMsg(`"${title}" is being processed and will appear in documents shortly.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add document");
    } finally {
      setWorking(false);
    }
  }

  function handleFileRead(file: File): void {
    const ext = getFileExtension(file.name);
    const supported = SUPPORTED_FORMATS.some((f) => f.ext === ext);
    if (!supported) {
      setError(
        `Unsupported file type "${ext}". Supported: ${SUPPORTED_FORMATS.map((f) => f.label)
          .filter((v, i, a) => a.indexOf(v) === i)
          .join(", ")}`
      );
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
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFileRead(file);
  }

  function handleFileInput(e: React.ChangeEvent<HTMLInputElement>): void {
    const file = e.target.files?.[0];
    if (file) handleFileRead(file);
  }

  async function handleQuery(): Promise<void> {
    if (!token) return;
    if (!queryText.trim()) {
      setError("Please enter a search query");
      return;
    }
    const parsedTopK = Number(queryTopK);
    const topK = Number.isFinite(parsedTopK)
      ? Math.max(1, Math.min(50, Math.floor(parsedTopK)))
      : 5;
    setWorking(true);
    clearMessages();
    try {
      const response = await api.knowledge.query(token, {
        query: queryText.trim(),
        topK,
        corpusId: selectedCorpusId || undefined,
      });
      setQueryResult(response.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Search failed");
      setQueryResult(null);
    } finally {
      setWorking(false);
    }
  }

  if (authLoading || !token) return null;

  return (
    <AppShell
      title="Corpora"
      subtitle="Upload documents so your AI workflows can reference them."
      navItems={getDashboardNavItems("corpora")}
      userName={user?.name}
      onSignOut={logout}
      action={
        <Button
          variant="primary"
          onClick={() => {
            setShowCreateForm(!showCreateForm);
            clearMessages();
          }}
        >
          {showCreateForm ? "Cancel" : "+ New Knowledge Base"}
        </Button>
      }
    >
      {error ? <StateBlock tone="error" title="Knowledge operation failed" description={error} /> : null}
      {success ? <div className={styles.alertSuccess}>{success}</div> : null}

      {showCreateForm && (
        <div className={styles.card}>
          <h3 className={styles.cardTitle}>Create a New Knowledge Base</h3>
          <p className={styles.hint}>
            A knowledge base is a collection of documents your AI can reference during workflows.
          </p>
          <div className={styles.formRow}>
            <div className={styles.formField}>
              <label className={styles.label}>Name *</label>
              <input
                className={styles.input}
                placeholder="e.g. Company Policies, Product Docs, FAQ..."
                value={newCorpusName}
                onChange={(e) => setNewCorpusName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && void handleCreateCorpus()}
              />
            </div>
            <div className={styles.formField}>
              <label className={styles.label}>Description (optional)</label>
              <input
                className={styles.input}
                placeholder="What kind of documents will this contain?"
                value={newCorpusDescription}
                onChange={(e) => setNewCorpusDescription(e.target.value)}
              />
            </div>
          </div>
          <button
            className={styles.primaryBtn}
            onClick={() => void handleCreateCorpus()}
            disabled={working || !newCorpusName.trim()}
          >
            {working ? "Creating..." : "Create Knowledge Base"}
          </button>
        </div>
      )}

      {corpora.length > 0 && (
        <div className={styles.sectionGap}>
          <label className={styles.label}>Active Knowledge Base</label>
          <div className={styles.pillRow}>
            {corpora.map((corpus) => (
              <button
                key={corpus.id}
                className={`${styles.pill} ${selectedCorpusId === corpus.id ? styles.pillActive : ""}`}
                onClick={() => {
                  setSelectedCorpusId(corpus.id);
                  setQueryResult(null);
                  clearMessages();
                }}
              >
                <span className={styles.pillName}>{corpus.name}</span>
                <span className={styles.pillStatus}>
                  {corpus.status}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {corpora.length === 0 && !loadingCorpora && !showCreateForm && (
        <StateBlock
          tone="empty"
          title="No knowledge bases yet"
          description="Create your first knowledge base to upload documents and power retrieval-aware workflows."
          action={
            <button className={styles.primaryBtn} onClick={() => setShowCreateForm(true)}>
              + Create Knowledge Base
            </button>
          }
        />
      )}

      {loadingCorpora && corpora.length === 0 && (
        <StateBlock
          tone="loading"
          title="Loading knowledge bases"
          description="Syncing corpora and indexing status."
        />
      )}

      {selectedCorpusId && (
        <>
          <div className={styles.tabBar}>
            {(["add", "browse", "search"] as ActiveTab[]).map((tab) => {
              const labels: Record<ActiveTab, string> = {
                add: "Add Documents",
                browse: `Browse (${documents.length})`,
                search: "Search",
              };
              return (
                <button
                  key={tab}
                  className={`${styles.tab} ${activeTab === tab ? styles.tabActive : ""}`}
                  onClick={() => setActiveTab(tab)}
                >
                  {labels[tab]}
                </button>
              );
            })}
          </div>

          {activeTab === "add" && (
            <div className={styles.card}>
              <h3 className={styles.cardTitle}>Add a Document</h3>
              <p className={styles.hint}>
                Upload a file or paste text. REX will break it into searchable chunks.
              </p>

              <div className={styles.modeToggleRow}>
                <button
                  className={`${styles.modeBtn} ${inputMode === "file" ? styles.modeBtnActive : ""}`}
                  onClick={() => setInputMode("file")}
                >
                  Upload File
                </button>
                <button
                  className={`${styles.modeBtn} ${inputMode === "paste" ? styles.modeBtnActive : ""}`}
                  onClick={() => setInputMode("paste")}
                >
                  Paste Text
                </button>
              </div>

              {inputMode === "file" && (
                <>
                  <div
                    className={`${styles.dropZone} ${dragOver ? styles.dropZoneActive : ""}`}
                    onDragOver={(e) => {
                      e.preventDefault();
                      setDragOver(true);
                    }}
                    onDragLeave={() => setDragOver(false)}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept={ACCEPT_STRING}
                      onChange={handleFileInput}
                      className={styles.hiddenInput}
                    />
                    {!uploadedFile ? (
                      <>
                        <p className={`${styles.dropTitle} ${dragOver ? styles.dropTitleActive : ""}`}>
                          {dragOver ? "Drop your file here" : "Drag and drop a file here"}
                        </p>
                        <p className={styles.dropSub}>or click to browse your computer</p>
                        <div className={styles.formatRow}>
                          {["TXT", "CSV", "JSON", "Markdown", "XML", "HTML", "YAML", "TSV", "LOG"].map((fmt) => (
                            <span key={fmt} className={styles.formatBadge}>{fmt}</span>
                          ))}
                        </div>
                        <p className={styles.dropHint}>Max file size: 10 MB</p>
                      </>
                    ) : (
                      <div className={styles.fileInfoCard}>
                        <div className={styles.fileInfoMain}>
                          <div className={styles.fileName}>{uploadedFile.name}</div>
                          <div className={styles.fileMeta}>
                            {formatFileSize(uploadedFile.size)} · {uploadedFile.content.length.toLocaleString()} characters
                          </div>
                        </div>
                        <button
                          className={styles.removeFileBtn}
                          onClick={(e) => {
                            e.stopPropagation();
                            setUploadedFile(null);
                            setDocTitle("");
                            if (fileInputRef.current) fileInputRef.current.value = "";
                          }}
                          title="Remove file"
                        >
                          ×
                        </button>
                      </div>
                    )}
                  </div>

                  {uploadedFile && (
                    <div className={styles.previewBox}>
                      <div className={styles.previewTitle}>
                        Content Preview
                      </div>
                      <pre className={styles.previewText}>
                        {uploadedFile.content.slice(0, 1000)}
                        {uploadedFile.content.length > 1000 ? "\n\n... (truncated)" : ""}
                      </pre>
                    </div>
                  )}
                </>
              )}

              {inputMode === "paste" && (
                <div className={styles.formField}>
                  <label className={styles.label}>Content *</label>
                  <textarea
                    className={styles.textarea}
                    placeholder="Paste your document content here..."
                    value={docContent}
                    onChange={(e) => setDocContent(e.target.value)}
                    rows={10}
                  />
                </div>
              )}

              <div className={styles.formField}>
                <label className={styles.label}>Document Title</label>
                <input
                  className={styles.input}
                  placeholder="e.g. Returns Policy 2026"
                  value={docTitle}
                  onChange={(e) => setDocTitle(e.target.value)}
                />
              </div>

              <button
                className={`${styles.primaryBtn} ${styles.primaryBtnWide}`}
                onClick={() => void handleIngestDocument()}
                disabled={working || (inputMode === "file" ? !uploadedFile : !docContent.trim())}
              >
                {working ? "Processing..." : "Add Document to Knowledge Base"}
              </button>
            </div>
          )}

          {activeTab === "browse" && (
            <div className={styles.browseWrap}>
              {documents.length === 0 ? (
                <StateBlock
                  tone="empty"
                  title="No documents in this knowledge base"
                  description="Add your first document to enable retrieval and search results."
                  action={
                    <button className={styles.ghostBtn} onClick={() => setActiveTab("add")}>
                      + Add your first document
                    </button>
                  }
                />
              ) : (
                <div className={styles.docGrid}>
                  {documents.map((doc) => (
                    <div
                      key={doc.id}
                      className={`${styles.docCard} ${selectedDocumentId === doc.id ? styles.docCardActive : ""}`}
                      onClick={() => setSelectedDocumentId(doc.id)}
                    >
                      <div className={styles.docCardTop}>
                        <span className={styles.docTitle}>{doc.title}</span>
                        <span className={doc.status === "ready" ? styles.statusReady : doc.status === "failed" ? styles.statusFailed : styles.statusPending}>
                          {doc.status === "ready" ? "Ready" : doc.status === "processing" ? "Processing" : doc.status === "pending" ? "Pending" : "Failed"}
                        </span>
                      </div>
                      <div className={styles.docMeta}>
                        Added {new Date(doc.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {selectedDocumentId && chunks.length > 0 && (
                <div className={styles.chunksWrap}>
                  <h4 className={styles.chunkHeading}>
                    Document Chunks ({chunks.length})
                  </h4>
                  <div className={styles.chunkList}>
                    {chunks.map((chunk) => (
                      <div key={chunk.id} className={styles.chunkCard}>
                        <div className={styles.chunkIndex}>
                          #{chunk.chunkIndex + 1}
                        </div>
                        <div className={styles.chunkContent}>
                          {chunk.content.slice(0, 300)}
                          {chunk.content.length > 300 ? "..." : ""}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === "search" && (
            <div className={styles.card}>
              <h3 className={styles.cardTitle}>Search Your Knowledge</h3>
              <p className={styles.hint}>Ask a question and REX will find the most relevant chunks.</p>
              <div className={styles.searchBar}>
                <input
                  className={`${styles.input} ${styles.searchInput}`}
                  placeholder="Ask a question..."
                  value={queryText}
                  onChange={(e) => setQueryText(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && void handleQuery()}
                />
                <div className={styles.resultCountWrap}>
                  <label className={styles.resultCountLabel}>Results:</label>
                  <input
                    className={`${styles.input} ${styles.resultCountInput}`}
                    type="number"
                    min={1}
                    max={50}
                    value={queryTopK}
                    onChange={(e) => setQueryTopK(e.target.value)}
                  />
                </div>
                <button
                  className={styles.primaryBtn}
                  onClick={() => void handleQuery()}
                  disabled={working || !queryText.trim()}
                >
                  {working ? "Searching..." : "Search"}
                </button>
              </div>
              {queryResult && (
                <div className={styles.resultsWrap}>
                  <h4 className={styles.resultHeading}>
                    {queryResult.matches.length} result{queryResult.matches.length !== 1 ? "s" : ""} found
                  </h4>
                  {queryResult.matches.length === 0 && <p className={styles.muted}>No matching content found.</p>}
                  {queryResult.matches.map((match, i) => (
                    <div key={match.chunkId} className={styles.resultCard}>
                      <div className={styles.resultTop}>
                        <span className={styles.resultIndex}>#{i + 1}</span>
                        <span className={styles.resultTitle}>{match.title}</span>
                        <span className={styles.scoreTag}>{(match.score * 100).toFixed(1)}% match</span>
                      </div>
                      <div className={styles.resultContent}>{match.content}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </>
      )}
    </AppShell>
  );
}

