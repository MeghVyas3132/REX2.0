// ──────────────────────────────────────────────
// REX - Workflow Editor (main canvas component)
// ──────────────────────────────────────────────

"use client";

import React, { useState, useCallback, useRef, useEffect } from "react";
import type { CanvasNode, CanvasEdge, ViewTransform, NodeTypeDefinition } from "./types";
import { NodePalette } from "./NodePalette";
import { CanvasNodeComponent } from "./CanvasNode";
import { NodeConfigPanel } from "./NodeConfigPanel";
import { ChatPanel } from "./ChatPanel";
import "./workflow-editor.css";
import "./chat-panel.css";

// ── Helpers ─────────────────────────────────────

function uuid(): string {
  return crypto.randomUUID();
}

function bezierPath(
  x1: number,
  y1: number,
  x2: number,
  y2: number
): string {
  const dx = Math.abs(x2 - x1) * 0.5;
  return `M ${x1} ${y1} C ${x1 + dx} ${y1}, ${x2 - dx} ${y2}, ${x2} ${y2}`;
}

// Node dimensions for port calculations
const NODE_WIDTH = 180;
const NODE_HEIGHT = 58;

// ── Props ───────────────────────────────────────

export interface WorkflowEditorProps {
  initialNodes?: CanvasNode[];
  initialEdges?: CanvasEdge[];
  workflowName?: string;
  workflowDescription?: string;
  workflowId?: string;
  token?: string;
  saving?: boolean;
  saveStatus?: "idle" | "saving" | "saved" | "error";
  onSave: (data: {
    name: string;
    description: string;
    nodes: CanvasNode[];
    edges: CanvasEdge[];
  }) => void;
  onExecute?: () => Promise<string | undefined>;
  onPollExecution?: (executionId: string) => Promise<ExecutionPollResult | null>;
  onBack: () => void;
  showExecute?: boolean;
}

export interface ExecutionPollResult {
  status: string;
  steps: {
    nodeId: string;
    nodeType: string;
    status: string;
    durationMs: number | null;
    error: string | null;
    output: Record<string, unknown> | null;
  }[];
  errorMessage: string | null;
}

// ── Component ───────────────────────────────────

export function WorkflowEditor({
  initialNodes = [],
  initialEdges = [],
  workflowName = "Untitled Workflow",
  workflowDescription: _workflowDescription = "",
  workflowId: wfId,
  token,
  saving = false,
  saveStatus = "idle",
  onSave,
  onExecute,
  onPollExecution,
  onBack,
  showExecute = false,
}: WorkflowEditorProps) {
  // State
  const [nodes, setNodes] = useState<CanvasNode[]>(initialNodes);
  const [edges, setEdges] = useState<CanvasEdge[]>(initialEdges);
  const [name, setName] = useState(workflowName);
  const [description, setDescription] = useState(_workflowDescription);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [transform, setTransform] = useState<ViewTransform>({ x: 0, y: 0, scale: 1 });

  // Execution state
  const [executionStatus, setExecutionStatus] = useState<string | null>(null);
  const [executionId, setExecutionId] = useState<string | null>(null);
  const [nodeStatuses, setNodeStatuses] = useState<Record<string, { status: string; durationMs: number | null; error: string | null }>>({});
  const [nodeOutputs, setNodeOutputs] = useState<Record<string, Record<string, unknown> | null>>({});
  const [executionError, setExecutionError] = useState<string | null>(null);
  const [isRunning, setIsRunning] = useState(false);

  // Drag state
  const [draggingNodeId, setDraggingNodeId] = useState<string | null>(null);
  const [isPanning, setIsPanning] = useState(false);
  const [connectionDrag, setConnectionDrag] = useState<{
    sourceId: string;
    mouseX: number;
    mouseY: number;
  } | null>(null);

  // Refs
  const canvasRef = useRef<HTMLDivElement>(null);
  const dragStartRef = useRef<{ mx: number; my: number; nx: number; ny: number } | null>(null);
  const panStartRef = useRef<{ mx: number; my: number; tx: number; ty: number } | null>(null);

  // ── Canvas coordinate conversion ──────────────

  const screenToCanvas = useCallback(
    (screenX: number, screenY: number) => {
      const rect = canvasRef.current?.getBoundingClientRect();
      if (!rect) return { x: screenX, y: screenY };
      return {
        x: (screenX - rect.left - transform.x) / transform.scale,
        y: (screenY - rect.top - transform.y) / transform.scale,
      };
    },
    [transform]
  );

  // ── Drop from palette ─────────────────────────

  const handlePaletteDragStart = useCallback(
    (e: React.DragEvent, def: NodeTypeDefinition) => {
      e.dataTransfer.setData("application/rex-node-type", JSON.stringify(def));
      e.dataTransfer.effectAllowed = "copy";
    },
    []
  );

  const handleCanvasDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "copy";
  }, []);

  const handleCanvasDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const raw = e.dataTransfer.getData("application/rex-node-type");
      if (!raw) return;
      const def: NodeTypeDefinition = JSON.parse(raw);
      const pos = screenToCanvas(e.clientX, e.clientY);

      const newNode: CanvasNode = {
        id: uuid(),
        type: def.type,
        label: def.label,
        position: { x: pos.x - NODE_WIDTH / 2, y: pos.y - NODE_HEIGHT / 2 },
        config: { ...def.defaultConfig },
      };

      setNodes((prev) => [...prev, newNode]);
      setSelectedNodeId(newNode.id);
    },
    [screenToCanvas]
  );

  // ── Node drag ─────────────────────────────────

  const handleNodeMouseDown = useCallback(
    (e: React.MouseEvent, nodeId: string) => {
      const node = nodes.find((n) => n.id === nodeId);
      if (!node) return;
      setDraggingNodeId(nodeId);
      dragStartRef.current = {
        mx: e.clientX,
        my: e.clientY,
        nx: node.position.x,
        ny: node.position.y,
      };
    },
    [nodes]
  );

  const handleNodeClick = useCallback((_e: React.MouseEvent, nodeId: string) => {
    setSelectedNodeId(nodeId);
  }, []);

  // ── Canvas pan ────────────────────────────────

  const handleCanvasMouseDown = useCallback(
    (e: React.MouseEvent) => {
      // Only pan on direct canvas click (not on nodes/ports)
      if (e.target !== canvasRef.current) return;
      setIsPanning(true);
      setSelectedNodeId(null);
      panStartRef.current = {
        mx: e.clientX,
        my: e.clientY,
        tx: transform.x,
        ty: transform.y,
      };
    },
    [transform]
  );

  // ── Connection drag ───────────────────────────

  const handlePortMouseDown = useCallback(
    (e: React.MouseEvent, nodeId: string, portType: "in" | "out") => {
      e.stopPropagation();
      if (portType === "out") {
        setConnectionDrag({
          sourceId: nodeId,
          mouseX: e.clientX,
          mouseY: e.clientY,
        });
      }
    },
    []
  );

  const handlePortMouseUp = useCallback(
    (_e: React.MouseEvent, nodeId: string, portType: "in" | "out") => {
      if (!connectionDrag || portType !== "in") return;
      if (connectionDrag.sourceId === nodeId) return;

      // Check for duplicate
      const exists = edges.some(
        (ed) => ed.source === connectionDrag.sourceId && ed.target === nodeId
      );
      if (!exists) {
        setEdges((prev) => [
          ...prev,
          { id: uuid(), source: connectionDrag.sourceId, target: nodeId },
        ]);
      }
      setConnectionDrag(null);
    },
    [connectionDrag, edges]
  );

  // ── Mouse move / up (global) ──────────────────

  useEffect(() => {
    function handleMouseMove(e: MouseEvent) {
      // Node drag
      if (draggingNodeId && dragStartRef.current) {
        const ds = dragStartRef.current;
        const dx = (e.clientX - ds.mx) / transform.scale;
        const dy = (e.clientY - ds.my) / transform.scale;
        setNodes((prev) =>
          prev.map((n) =>
            n.id === draggingNodeId
              ? { ...n, position: { x: ds.nx + dx, y: ds.ny + dy } }
              : n
          )
        );
      }
      // Canvas pan
      if (isPanning && panStartRef.current) {
        const ps = panStartRef.current;
        setTransform((t) => ({
          ...t,
          x: ps.tx + (e.clientX - ps.mx),
          y: ps.ty + (e.clientY - ps.my),
        }));
      }
      // Connection drag
      if (connectionDrag) {
        setConnectionDrag((prev) =>
          prev ? { ...prev, mouseX: e.clientX, mouseY: e.clientY } : null
        );
      }
    }

    function handleMouseUp() {
      setDraggingNodeId(null);
      dragStartRef.current = null;
      setIsPanning(false);
      panStartRef.current = null;
      setConnectionDrag(null);
    }

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [draggingNodeId, isPanning, connectionDrag, transform.scale]);

  // ── Zoom ──────────────────────────────────────

  useEffect(() => {
    const el = canvasRef.current;
    if (!el) return;

    function handleWheel(e: WheelEvent) {
      e.preventDefault();
      const rect = el!.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;

      setTransform((t) => {
        const delta = e.deltaY > 0 ? 0.9 : 1.1;
        const newScale = Math.min(Math.max(t.scale * delta, 0.2), 3);
        const ratio = newScale / t.scale;
        return {
          scale: newScale,
          x: mx - (mx - t.x) * ratio,
          y: my - (my - t.y) * ratio,
        };
      });
    }

    el.addEventListener("wheel", handleWheel, { passive: false });
    return () => el.removeEventListener("wheel", handleWheel);
  }, []);

  const zoomIn = () =>
    setTransform((t) => ({ ...t, scale: Math.min(t.scale * 1.2, 3) }));
  const zoomOut = () =>
    setTransform((t) => ({ ...t, scale: Math.max(t.scale / 1.2, 0.2) }));
  const zoomReset = () => setTransform({ x: 0, y: 0, scale: 1 });

  // ── Node update / delete ──────────────────────

  const handleNodeUpdate = useCallback(
    (nodeId: string, updates: Partial<CanvasNode>) => {
      setNodes((prev) =>
        prev.map((n) => (n.id === nodeId ? { ...n, ...updates } : n))
      );
    },
    []
  );

  const handleNodeDelete = useCallback(
    (nodeId: string) => {
      setNodes((prev) => prev.filter((n) => n.id !== nodeId));
      setEdges((prev) => prev.filter((e) => e.source !== nodeId && e.target !== nodeId));
      if (selectedNodeId === nodeId) setSelectedNodeId(null);
    },
    [selectedNodeId]
  );

  // ── Edge delete (click on edge) ───────────────

  const handleEdgeClick = useCallback((edgeId: string) => {
    setEdges((prev) => prev.filter((e) => e.id !== edgeId));
  }, []);

  // ── Save ──────────────────────────────────────

  const handleSave = useCallback(() => {
    onSave({ name, description, nodes, edges });
  }, [name, description, nodes, edges, onSave]);

  // ── Execute + Poll ────────────────────────────

  const handleExecute = useCallback(async () => {
    if (!onExecute || !onPollExecution) return;
    setIsRunning(true);
    setExecutionError(null);
    setNodeStatuses({});
    setNodeOutputs({});
    setExecutionStatus("pending");
    setExecutionId(null);

    try {
      const execId = await onExecute();
      if (!execId) {
        setIsRunning(false);
        setExecutionStatus(null);
        return;
      }

      setExecutionId(execId);

      // Poll for status
      let attempts = 0;
      const maxAttempts = 120; // 2 minutes at 1s intervals
      const poll = async () => {
        if (attempts >= maxAttempts) {
          setExecutionStatus("timeout");
          setExecutionError("Execution timed out waiting for results");
          setIsRunning(false);
          return;
        }

        attempts++;
        try {
          const result = await onPollExecution(execId);
          if (!result) return;

          setExecutionStatus(result.status);
          if (result.errorMessage) {
            setExecutionError(result.errorMessage);
          }

          // Update per-node statuses
          const statuses: Record<string, { status: string; durationMs: number | null; error: string | null }> = {};
          const outputs: Record<string, Record<string, unknown> | null> = {};
          for (const step of result.steps) {
            statuses[step.nodeId] = {
              status: step.status,
              durationMs: step.durationMs,
              error: step.error,
            };
            outputs[step.nodeId] = step.output ?? null;
          }
          setNodeStatuses(statuses);
          setNodeOutputs(outputs);

          if (result.status === "completed" || result.status === "failed") {
            setIsRunning(false);
            return;
          }

          // Continue polling
          setTimeout(poll, 1000);
        } catch {
          setTimeout(poll, 2000);
        }
      };

      // Start polling after a short delay
      setTimeout(poll, 500);
    } catch {
      setExecutionStatus("failed");
      setExecutionError("Failed to start execution");
      setIsRunning(false);
    }
  }, [onExecute, onPollExecution]);

  // ── Compute edge paths ────────────────────────

  function getNodeCenter(node: CanvasNode, side: "out" | "in") {
    if (side === "out") {
      return {
        x: node.position.x + NODE_WIDTH,
        y: node.position.y + NODE_HEIGHT / 2,
      };
    }
    return {
      x: node.position.x,
      y: node.position.y + NODE_HEIGHT / 2,
    };
  }

  // ── Smart output renderer ──────────────────

  function renderNodeOutput(nodeId: string, output: Record<string, unknown> | null) {
    if (!output) return null;

    // Find the node type
    const node = nodes.find((n: CanvasNode) => n.id === nodeId);
    const nodeType = node?.type ?? "";

    // LLM nodes — show content as readable text with metadata
    if (nodeType === "llm" && typeof output.content === "string") {
      return (
        <div className="wf-output-readable">
          <div className="wf-output-text">{output.content}</div>
          <div className="wf-output-meta">
            {output.model ? <span>Model: {String(output.model)}</span> : null}
            {output.provider ? <span>Provider: {String(output.provider)}</span> : null}
            {(output.usage && typeof output.usage === "object") ? (
              <span>Tokens: {String((output.usage as Record<string, unknown>).totalTokens ?? "—")}</span>
            ) : null}
          </div>
        </div>
      );
    }

    // HTTP request nodes — show status + body
    if (nodeType === "http-request") {
      const status = output.statusCode ?? output.status;
      const body = output.body ?? output.data ?? output.response;
      return (
        <div className="wf-output-readable">
          {status ? <div className="wf-output-meta"><span>Status: {String(status)}</span></div> : null}
          <pre className="wf-output-panel-content">{typeof body === "string" ? body : JSON.stringify(body, null, 2)}</pre>
        </div>
      );
    }

    // Data cleaner / transformer — show cleaned data
    if ((nodeType === "data-cleaner" || nodeType === "transformer") && output.data) {
      return (
        <div className="wf-output-readable">
          <pre className="wf-output-panel-content">{typeof output.data === "string" ? output.data : JSON.stringify(output.data, null, 2)}</pre>
          {output.summary ? <div className="wf-output-meta"><span>{String(output.summary)}</span></div> : null}
        </div>
      );
    }

    // Log / Output nodes — show message
    if ((nodeType === "log" || nodeType === "output") && (output.message || output.data)) {
      const display = output.message ?? output.data;
      return (
        <div className="wf-output-readable">
          <div className="wf-output-text">{typeof display === "string" ? display : JSON.stringify(display, null, 2)}</div>
        </div>
      );
    }

    // File Upload nodes — show file info + data preview
    if (nodeType === "file-upload") {
      const fname = output.fileName as string | undefined;
      const format = output.fileFormat as string | undefined;
      const prev = output.preview as string | undefined;
      const data = output.data;
      const rowCount = output.rowCount as number | undefined;
      return (
        <div className="wf-output-readable">
          <div className="wf-output-meta">
            {fname ? <span>File: {fname}</span> : null}
            {format ? <span>Format: {format.toUpperCase()}</span> : null}
            {rowCount ? <span>Rows: {rowCount}</span> : null}
          </div>
          {prev ? <div className="wf-output-text" style={{ fontSize: 12, color: "#888", marginBottom: 8 }}>{prev}</div> : null}
          {Array.isArray(data) ? (
            <pre className="wf-output-panel-content">{JSON.stringify(data.slice(0, 10), null, 2)}{data.length > 10 ? `\n... and ${data.length - 10} more rows` : ""}</pre>
          ) : typeof data === "string" ? (
            <div className="wf-output-text">{data.length > 2000 ? data.slice(0, 2000) + "\n... (truncated)" : data}</div>
          ) : (
            <pre className="wf-output-panel-content">{JSON.stringify(data, null, 2)}</pre>
          )}
        </div>
      );
    }

    // Fallback — show raw JSON for unknown types
    return (
      <pre className="wf-output-panel-content">
        {JSON.stringify(output, null, 2)}
      </pre>
    );
  }

  // ── Render ────────────────────────────────────

  const selectedNode = nodes.find((n) => n.id === selectedNodeId);

  const saveStatusLabel =
    saveStatus === "saving"
      ? "Saving..."
      : saveStatus === "saved"
        ? "Saved"
        : saveStatus === "error"
          ? "Save failed"
          : "";

  return (
    <div className="wf-editor">
      {/* Toolbar */}
      <div className="wf-toolbar">
        <button className="wf-toolbar-back" onClick={onBack} title="Back">
          &larr;
        </button>
        <div className="wf-toolbar-sep" />
        <input
          className="wf-toolbar-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Untitled Workflow"
        />
        <input
          className="wf-toolbar-name"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Description (optional)"
          style={{ fontWeight: 400, color: "#999" }}
        />
        <div className="wf-toolbar-spacer" />

        {saveStatusLabel && (
          <span className={`wf-save-indicator ${saveStatus}`}>
            {saveStatusLabel}
          </span>
        )}

        <div className="wf-toolbar-zoom">
          <button className="wf-toolbar-zoom-btn" onClick={zoomOut}>-</button>
          <span
            className="wf-toolbar-zoom-label"
            onClick={zoomReset}
            style={{ cursor: "pointer" }}
          >
            {Math.round(transform.scale * 100)}%
          </span>
          <button className="wf-toolbar-zoom-btn" onClick={zoomIn}>+</button>
        </div>

        <div className="wf-toolbar-sep" />

        {showExecute && onExecute && (
          <button
            className="wf-btn-run"
            onClick={handleExecute}
            disabled={isRunning}
          >
            {isRunning ? "Running..." : "Run Workflow"}
          </button>
        )}

        {executionStatus && (
          <span className={`wf-save-indicator ${executionStatus === "completed" ? "saved" : executionStatus === "failed" ? "error" : "saving"}`}>
            {executionStatus === "pending" ? "Pending..." :
             executionStatus === "running" ? "Executing..." :
             executionStatus === "completed" ? "Completed" :
             executionStatus === "failed" ? "Failed" :
             executionStatus}
          </span>
        )}

        {executionId && wfId && (executionStatus === "completed" || executionStatus === "failed") && (
          <a
            href={`/dashboard/workflows/${wfId}/executions/${executionId}`}
            className="wf-btn-secondary"
            style={{ fontSize: 11, textDecoration: "none", padding: "4px 10px", border: "1px solid #444", borderRadius: 6, color: "#ccc" }}
          >
            View Results
          </a>
        )}

        <button
          className="wf-btn-primary"
          onClick={handleSave}
          disabled={saving || !name.trim()}
        >
          {saving ? "Saving..." : "Save"}
        </button>

        {!showExecute && (
          <span style={{ fontSize: 11, color: "#555" }}>
            Save to enable execution
          </span>
        )}
      </div>

      {/* Execution error banner */}
      {executionError && (
        <div className="wf-exec-error">
          <span>{executionError}</span>
          <button onClick={() => setExecutionError(null)}>x</button>
        </div>
      )}

      {/* Body */}
      <div className="wf-body">
        {/* Palette */}
        <NodePalette onDragStart={handlePaletteDragStart} />

        {/* Canvas */}
        <div
          ref={canvasRef}
          className={`wf-canvas-wrap ${isPanning ? "panning" : ""}`}
          onMouseDown={handleCanvasMouseDown}
          onDragOver={handleCanvasDragOver}
          onDrop={handleCanvasDrop}
        >
          {nodes.length === 0 && (
            <div className="wf-empty">
              <div className="wf-empty-title">Drag nodes from the left panel</div>
              <div className="wf-empty-desc">
                Drop them here to build your workflow
              </div>
            </div>
          )}

          {/* SVG edges layer */}
          <svg className="wf-canvas-svg">
            <g
              transform={`translate(${transform.x}, ${transform.y}) scale(${transform.scale})`}
            >
              {edges.map((edge) => {
                const srcNode = nodes.find((n) => n.id === edge.source);
                const tgtNode = nodes.find((n) => n.id === edge.target);
                if (!srcNode || !tgtNode) return null;
                const start = getNodeCenter(srcNode, "out");
                const end = getNodeCenter(tgtNode, "in");
                return (
                  <path
                    key={edge.id}
                    className="wf-edge"
                    d={bezierPath(start.x, start.y, end.x, end.y)}
                    onClick={() => handleEdgeClick(edge.id)}
                  />
                );
              })}

              {/* Temporary connection line */}
              {connectionDrag && (() => {
                const srcNode = nodes.find((n) => n.id === connectionDrag.sourceId);
                if (!srcNode) return null;
                const start = getNodeCenter(srcNode, "out");
                const mouseCanvas = screenToCanvas(connectionDrag.mouseX, connectionDrag.mouseY);
                return (
                  <path
                    className="wf-edge-temp"
                    d={bezierPath(start.x, start.y, mouseCanvas.x, mouseCanvas.y)}
                  />
                );
              })()}
            </g>
          </svg>

          {/* Nodes layer */}
          <div
            className="wf-canvas-layer"
            style={{
              transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.scale})`,
            }}
          >
            {nodes.map((node) => (
              <CanvasNodeComponent
                key={node.id}
                node={node}
                selected={node.id === selectedNodeId}
                dragging={node.id === draggingNodeId}
                executionStatus={nodeStatuses[node.id]?.status}
                onMouseDown={handleNodeMouseDown}
                onClick={handleNodeClick}
                onPortMouseDown={handlePortMouseDown}
                onPortMouseUp={handlePortMouseUp}
              />
            ))}
          </div>
        </div>

        {/* Config panel */}
        {selectedNode && (
          <NodeConfigPanel
            node={selectedNode}
            nodes={nodes}
            edges={edges}
            onUpdate={handleNodeUpdate}
            onDelete={handleNodeDelete}
            onClose={() => setSelectedNodeId(null)}
            token={token}
          />
        )}

        {/* Execution output panel */}
        {selectedNodeId && nodeOutputs[selectedNodeId] && (
          <div className="wf-output-panel">
            <div className="wf-output-panel-header">
              <span>Execution Output</span>
              {nodeStatuses[selectedNodeId] && (
                <span
                  style={{
                    fontSize: 11,
                    color: nodeStatuses[selectedNodeId].status === "completed" ? "#22c55e" : "#ef4444",
                  }}
                >
                  {nodeStatuses[selectedNodeId].status} 
                  {nodeStatuses[selectedNodeId].durationMs != null && ` (${nodeStatuses[selectedNodeId].durationMs}ms)`}
                </span>
              )}
            </div>
            <div className="wf-output-panel-body">
              {renderNodeOutput(selectedNodeId, nodeOutputs[selectedNodeId])}
            </div>
            {nodeStatuses[selectedNodeId]?.error && (
              <div className="wf-output-panel-error">
                {nodeStatuses[selectedNodeId].error}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Chat Panel */}
      <ChatPanel
        token={token || ""}
        workflow={{ name, description, nodes, edges }}
        executionStatus={executionStatus || undefined}
        nodeStatuses={
          Object.keys(nodeStatuses).length > 0
            ? (() => {
                const mapped: Record<string, { status: string; error: string | null }> = {};
                for (const [k, v] of Object.entries(nodeStatuses)) {
                  mapped[k] = { status: (v as any).status, error: (v as any).error ?? null };
                }
                return mapped;
              })()
            : undefined
        }
      />
    </div>
  );
}
