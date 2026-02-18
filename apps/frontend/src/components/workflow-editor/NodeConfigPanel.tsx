// ──────────────────────────────────────────────
// REX - Node Config Panel (right sidebar)
// ──────────────────────────────────────────────

"use client";

import React, { useState, useRef, useCallback } from "react";
import type { CanvasNode, CanvasEdge } from "./types";
import { getNodeTypeDef, getCategoryColor } from "./types";
import { api } from "../../lib/api";

interface NodeConfigPanelProps {
  node: CanvasNode;
  nodes: CanvasNode[];
  edges: CanvasEdge[];
  onUpdate: (nodeId: string, updates: Partial<CanvasNode>) => void;
  onDelete: (nodeId: string) => void;
  onClose: () => void;
  token?: string;
}

export function NodeConfigPanel({
  node,
  nodes,
  edges,
  onUpdate,
  onDelete,
  onClose,
  token,
}: NodeConfigPanelProps) {
  const def = getNodeTypeDef(node.type);
  const categoryColor = getCategoryColor(def?.category ?? "action");

  // Detect upstream file-upload nodes for LLM nodes
  const attachedFiles = getUpstreamFileNodes(node.id, nodes, edges);

  function handleLabelChange(value: string) {
    onUpdate(node.id, { label: value });
  }

  function handleConfigChange(key: string, value: string) {
    const updates: Record<string, string> = { [key]: value };

    // Auto-switch model when provider changes on LLM nodes
    if (key === "provider" && node.type === "llm") {
      const currentModel = (node.config["model"] as string) ?? "";
      const geminiModels = ["gemini-2.0-flash", "gemini-pro", "gemini-pro-vision", "gemini-ultra", ""];
      const groqModels = ["llama-3.3-70b-versatile", "llama-3.1-8b-instant", "mixtral-8x7b-32768", ""];

      if (value === "groq" && (geminiModels.includes(currentModel) || currentModel.startsWith("gemini"))) {
        updates["model"] = "llama-3.3-70b-versatile";
      } else if (value === "gemini" && (groqModels.includes(currentModel) || currentModel.startsWith("llama") || currentModel.startsWith("mixtral"))) {
        updates["model"] = "gemini-2.0-flash";
      }
    }

    onUpdate(node.id, {
      config: { ...node.config, ...updates },
    });
  }

  return (
    <div className="wf-panel">
      <div className="wf-panel-header">
        <span className="wf-panel-title">
          <span
            style={{
              display: "inline-block",
              width: 8,
              height: 8,
              borderRadius: "50%",
              backgroundColor: categoryColor,
              marginRight: 8,
            }}
          />
          {def?.label ?? node.type}
        </span>
        <button className="wf-panel-close" onClick={onClose}>
          x
        </button>
      </div>

      <div className="wf-panel-body">
        {/* Node Label */}
        <div className="wf-panel-field">
          <label className="wf-panel-label">Label</label>
          <input
            className="wf-panel-input"
            value={node.label}
            onChange={(e) => handleLabelChange(e.target.value)}
            placeholder="Node label"
          />
        </div>

        {/* Type (read-only) */}
        <div className="wf-panel-field">
          <label className="wf-panel-label">Type</label>
          <input
            className="wf-panel-input"
            value={def?.label ?? node.type}
            readOnly
            style={{ color: "#666" }}
          />
        </div>

        {/* Dynamic config fields */}
        {def?.configFields.map((field) => (
          <div key={field.key} className="wf-panel-field">
            <label className="wf-panel-label">{field.label}</label>
            {field.type === "textarea" ? (
              <textarea
                className="wf-panel-textarea"
                value={(node.config[field.key] as string) ?? ""}
                onChange={(e) => handleConfigChange(field.key, e.target.value)}
                placeholder={field.placeholder}
                rows={5}
              />
            ) : field.type === "select" ? (
              <select
                className="wf-panel-select"
                value={(node.config[field.key] as string) ?? ""}
                onChange={(e) => handleConfigChange(field.key, e.target.value)}
              >
                {field.options?.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            ) : (
              <input
                className="wf-panel-input"
                type={field.type === "number" ? "number" : "text"}
                value={(node.config[field.key] as string) ?? ""}
                onChange={(e) => handleConfigChange(field.key, e.target.value)}
                placeholder={field.placeholder}
              />
            )}
          </div>
        ))}

        {/* API key notice for LLM nodes */}
        {node.type === "llm" && (
          <div className="wf-panel-notice">
            <p className="wf-panel-notice-text">
              This node requires an API key to run. Make sure you have added your
              provider key in settings.
            </p>
            <a href="/dashboard/settings" className="wf-panel-notice-link">
              Manage API Keys
            </a>
          </div>
        )}

        {/* Attached file data indicator for LLM nodes */}
        {node.type === "llm" && attachedFiles.length > 0 && (
          <div className="wf-attached-files">
            <div className="wf-attached-files-header">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2">
                <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/>
              </svg>
              <span>File data attached — auto-injected into prompt</span>
            </div>
            {attachedFiles.map((f) => (
              <div key={f.id} className="wf-attached-file-item">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                  <polyline points="14 2 14 8 20 8"/>
                </svg>
                <span className="wf-attached-file-name">{f.fileName || "Unnamed file"}</span>
                <span className="wf-attached-file-format">{f.format?.toUpperCase()}</span>
                {f.preview ? <span className="wf-attached-file-meta">{f.preview}</span> : null}
              </div>
            ))}
          </div>
        )}

        {/* No file attached hint for LLM nodes */}
        {node.type === "llm" && attachedFiles.length === 0 && (
          <div className="wf-attached-files-hint">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#666" strokeWidth="2">
              <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/>
            </svg>
            <span>Connect a Document Intake node to auto-attach data</span>
          </div>
        )}

        {/* File Upload widget for file-upload nodes */}
        {node.type === "file-upload" && (
          <FileUploadWidget
            node={node}
            onUpdate={onUpdate}
            token={token}
          />
        )}
      </div>

      <div className="wf-panel-footer">
        <button
          className="wf-panel-delete"
          onClick={() => onDelete(node.id)}
        >
          Delete Node
        </button>
      </div>
    </div>
  );
}

// ── File Upload Widget ──────────────────────────

interface FileUploadWidgetProps {
  node: CanvasNode;
  onUpdate: (nodeId: string, updates: Partial<CanvasNode>) => void;
  token?: string;
}

function FileUploadWidget({ node, onUpdate, token }: FileUploadWidgetProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const hasFile = !!node.config["parsedData"];
  const preview = (node.config["filePreview"] as string) ?? "";
  const fileName = (node.config["fileName"] as string) ?? "";
  const fileFormat = (node.config["fileFormat"] as string) ?? "csv";

  const acceptMap: Record<string, string> = {
    csv: ".csv",
    json: ".json",
    txt: ".txt",
    pdf: ".pdf",
  };

  const handleFile = useCallback(
    async (file: File) => {
      if (!token) {
        setError("Not authenticated. Please log in.");
        return;
      }

      setUploading(true);
      setError(null);

      try {
        // Detect format from file extension or use config value
        const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
        const detectedFormat = ["csv", "json", "txt", "pdf"].includes(ext)
          ? ext
          : fileFormat;

        // Size limit: 5MB
        if (file.size > 5 * 1024 * 1024) {
          throw new Error("File too large. Maximum size is 5 MB.");
        }

        // Read file as base64
        const base64 = await fileToBase64(file);

        // Send to backend for parsing
        const result = await api.files.parse(
          token,
          base64,
          file.name,
          detectedFormat
        );

        // Store parsed data in node config
        onUpdate(node.id, {
          config: {
            ...node.config,
            fileName: file.name,
            fileFormat: detectedFormat,
            parsedData: result.data.parsedData,
            filePreview: result.data.preview,
            rowCount: result.data.rowCount,
          },
        });
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to upload file"
        );
      } finally {
        setUploading(false);
      }
    },
    [token, fileFormat, node.id, node.config, onUpdate]
  );

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(true);
  }

  function handleDragLeave() {
    setDragOver(false);
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  }

  function handleRemoveFile() {
    onUpdate(node.id, {
      config: {
        ...node.config,
        parsedData: null,
        fileName: "",
        filePreview: "",
        rowCount: undefined,
        fileContent: undefined,
      },
    });
  }

  return (
    <div className="wf-panel-field">
      <label className="wf-panel-label">File</label>

      {hasFile ? (
        <div className="wf-file-info">
          <div className="wf-file-info-name">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
            </svg>
            <span>{fileName}</span>
          </div>
          <div className="wf-file-info-preview">{preview}</div>
          <button
            type="button"
            className="wf-file-remove"
            onClick={handleRemoveFile}
          >
            Remove file
          </button>
        </div>
      ) : (
        <div
          className={`wf-file-dropzone${dragOver ? " wf-file-dropzone-active" : ""}`}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={() => fileInputRef.current?.click()}
        >
          {uploading ? (
            <div className="wf-file-uploading">
              <div className="wf-file-spinner" />
              <span>Parsing file…</span>
            </div>
          ) : (
            <>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#666" strokeWidth="1.5">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                <polyline points="17 8 12 3 7 8"/>
                <line x1="12" y1="3" x2="12" y2="15"/>
              </svg>
              <span className="wf-file-dropzone-text">
                Drop a file here or click to browse
              </span>
              <span className="wf-file-dropzone-hint">
                {acceptMap[fileFormat] ?? ".csv, .json, .txt, .pdf"} — max 5 MB
              </span>
            </>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept={acceptMap[fileFormat] ?? ".csv,.json,.txt,.pdf"}
            onChange={handleInputChange}
            style={{ display: "none" }}
          />
        </div>
      )}

      {error && <div className="wf-file-error">{error}</div>}
    </div>
  );
}

// ── Helpers ─────────────────────────────────────

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      // result is data:mime;base64,XXXX — extract the base64 part
      const result = reader.result as string;
      const base64 = result.split(",")[1] ?? "";
      resolve(base64);
    };
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsDataURL(file);
  });
}

// ── Upstream file detection ─────────────────────

interface AttachedFile {
  id: string;
  fileName: string;
  format: string | null;
  preview: string | null;
}

/**
 * Walk upstream edges to find file-upload nodes connected (directly or
 * transitively) to this node. Searches up to 5 levels deep.
 */
function getUpstreamFileNodes(
  nodeId: string,
  nodes: CanvasNode[],
  edges: CanvasEdge[],
  depth = 0
): AttachedFile[] {
  if (depth > 5) return [];

  const parentEdges = edges.filter((e) => e.target === nodeId);
  const files: AttachedFile[] = [];

  for (const edge of parentEdges) {
    const parent = nodes.find((n) => n.id === edge.source);
    if (!parent) continue;

    if (parent.type === "file-upload" && parent.config["parsedData"]) {
      files.push({
        id: parent.id,
        fileName: (parent.config["fileName"] as string) ?? "",
        format: (parent.config["fileFormat"] as string) ?? null,
        preview: (parent.config["filePreview"] as string) ?? null,
      });
    }

    // Also check transitive parents (e.g. Manual Trigger → File Upload → LLM)
    files.push(...getUpstreamFileNodes(edge.source, nodes, edges, depth + 1));
  }

  // Deduplicate by id
  const seen = new Set<string>();
  return files.filter((f) => {
    if (seen.has(f.id)) return false;
    seen.add(f.id);
    return true;
  });
}
