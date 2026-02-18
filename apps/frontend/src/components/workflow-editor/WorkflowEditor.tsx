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

function areNodeSizeMapsEqual(
  a: Record<string, { width: number; height: number }>,
  b: Record<string, { width: number; height: number }>
): boolean {
  const aKeys = Object.keys(a);
  const bKeys = Object.keys(b);
  if (aKeys.length !== bKeys.length) return false;
  for (const key of aKeys) {
    const left = a[key];
    const right = b[key];
    if (!left || !right) return false;
    if (left.width !== right.width || left.height !== right.height) return false;
  }
  return true;
}

function buildEdgeFlowDelays(
  edges: CanvasEdge[],
  steps: ExecutionPollResult["steps"]
): Record<string, number> {
  const completionOrder = new Map<string, number>();
  let order = 0;
  for (const step of steps) {
    if (step.status !== "completed") continue;
    if (!completionOrder.has(step.nodeId)) {
      completionOrder.set(step.nodeId, order);
      order += 1;
    }
  }

  const delays: Record<string, number> = {};
  let flowIndex = 0;
  for (const edge of edges) {
    const sourceOrder = completionOrder.get(edge.source);
    const targetOrder = completionOrder.get(edge.target);
    if (
      sourceOrder === undefined ||
      targetOrder === undefined ||
      targetOrder <= sourceOrder
    ) {
      continue;
    }
    delays[edge.id] = flowIndex * 140;
    flowIndex += 1;
  }

  return delays;
}

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
  onStateChange?: (data: {
    name: string;
    description: string;
    nodes: CanvasNode[];
    edges: CanvasEdge[];
  }) => void;
  onExecute?: () => Promise<string | undefined>;
  onPollExecution?: (executionId: string) => Promise<ExecutionPollResult | null>;
  onStopExecution?: (executionId: string) => Promise<boolean>;
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
  onStateChange,
  onExecute,
  onPollExecution,
  onStopExecution,
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
  const [nodeSizes, setNodeSizes] = useState<Record<string, { width: number; height: number }>>({});

  // Execution state
  const [executionStatus, setExecutionStatus] = useState<string | null>(null);
  const [executionId, setExecutionId] = useState<string | null>(null);
  const [nodeStatuses, setNodeStatuses] = useState<Record<string, { status: string; durationMs: number | null; error: string | null }>>({});
  const [nodeOutputs, setNodeOutputs] = useState<Record<string, Record<string, unknown> | null>>({});
  const [executionError, setExecutionError] = useState<string | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [isStopping, setIsStopping] = useState(false);
  const [edgeFlowDelays, setEdgeFlowDelays] = useState<Record<string, number>>({});

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
  const executionPollRef = useRef<{ executionId: string | null; active: boolean }>({
    executionId: null,
    active: false,
  });

  useEffect(() => {
    return () => {
      executionPollRef.current = { executionId: null, active: false };
    };
  }, []);

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

  // ── Node size measurement (for accurate edge anchoring) ───────

  useEffect(() => {
    const measure = () => {
      const root = canvasRef.current;
      if (!root) return;
      const next: Record<string, { width: number; height: number }> = {};
      const elements = root.querySelectorAll<HTMLElement>(".wf-node[data-node-id]");
      elements.forEach((el) => {
        const nodeId = el.dataset["nodeId"];
        if (!nodeId) return;
        next[nodeId] = {
          width: el.offsetWidth > 0 ? el.offsetWidth : NODE_WIDTH,
          height: el.offsetHeight > 0 ? el.offsetHeight : NODE_HEIGHT,
        };
      });

      setNodeSizes((prev) => (areNodeSizeMapsEqual(prev, next) ? prev : next));
    };

    const frame = window.requestAnimationFrame(measure);
    window.addEventListener("resize", measure);
    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("resize", measure);
    };
  }, [nodes]);

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

  useEffect(() => {
    if (!onStateChange) return;
    onStateChange({ name, description, nodes, edges });
  }, [name, description, nodes, edges, onStateChange]);

  // ── Execute + Poll ────────────────────────────

  const handleExecute = useCallback(async () => {
    if (!onExecute || !onPollExecution) return;
    executionPollRef.current = { executionId: null, active: false };
    setIsRunning(true);
    setIsStopping(false);
    setExecutionError(null);
    setNodeStatuses({});
    setNodeOutputs({});
    setEdgeFlowDelays({});
    setExecutionStatus("pending");
    setExecutionId(null);

    try {
      const execId = await onExecute();
      if (!execId) {
        setIsRunning(false);
        setExecutionStatus(null);
        return;
      }

      executionPollRef.current = { executionId: execId, active: true };
      setExecutionId(execId);

      // Poll for status
      let attempts = 0;
      const maxAttempts = 120; // 2 minutes at 1s intervals
      const poll = async () => {
        if (
          !executionPollRef.current.active ||
          executionPollRef.current.executionId !== execId
        ) {
          return;
        }

        if (attempts >= maxAttempts) {
          executionPollRef.current = { executionId: execId, active: false };
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

          if (result.status === "completed") {
            executionPollRef.current = { executionId: execId, active: false };
            setEdgeFlowDelays(buildEdgeFlowDelays(edges, result.steps));
            setIsRunning(false);
            return;
          }

          if (result.status === "failed") {
            executionPollRef.current = { executionId: execId, active: false };
            setEdgeFlowDelays({});
            setIsRunning(false);
            return;
          }

          if (result.status === "canceled") {
            executionPollRef.current = { executionId: execId, active: false };
            setEdgeFlowDelays({});
            setIsRunning(false);
            return;
          }

          // Continue polling
          setTimeout(poll, 1000);
        } catch {
          if (
            !executionPollRef.current.active ||
            executionPollRef.current.executionId !== execId
          ) {
            return;
          }
          setTimeout(poll, 2000);
        }
      };

      // Start polling after a short delay
      setTimeout(poll, 500);
    } catch {
      executionPollRef.current = { executionId: null, active: false };
      setExecutionStatus("failed");
      setExecutionError("Failed to start execution");
      setIsRunning(false);
    }
  }, [onExecute, onPollExecution, edges]);

  const handleStopExecution = useCallback(async () => {
    if (!onStopExecution || !executionId || isStopping) return;

    setIsStopping(true);
    try {
      const stopped = await onStopExecution(executionId);
      if (!stopped) return;

      executionPollRef.current = { executionId, active: false };
      setExecutionStatus("canceled");
      setExecutionError(null);
      setIsRunning(false);
      setEdgeFlowDelays({});
    } finally {
      setIsStopping(false);
    }
  }, [executionId, isStopping, onStopExecution]);

  // ── Compute edge paths ────────────────────────

  function getNodeCenter(node: CanvasNode, side: "out" | "in") {
    const size = nodeSizes[node.id] ?? { width: NODE_WIDTH, height: NODE_HEIGHT };
    if (side === "out") {
      return {
        x: node.position.x + size.width,
        y: node.position.y + size.height / 2,
      };
    }
    return {
      x: node.position.x,
      y: node.position.y + size.height / 2,
    };
  }

  // ── Smart output renderer ──────────────────

  /** Parse plain-text LLM content into structured blocks */
  function parseLLMContent(text: string) {
    const lines = text.split("\n");
    const blocks: Array<{ type: "heading" | "list-item" | "paragraph" | "blank"; text: string }> = [];
    let paraBuffer: string[] = [];

    const flushPara = () => {
      if (paraBuffer.length > 0) {
        blocks.push({ type: "paragraph", text: paraBuffer.join("\n") });
        paraBuffer = [];
      }
    };

    for (const line of lines) {
      const trimmed = line.trim();

      // Blank line
      if (!trimmed) { flushPara(); blocks.push({ type: "blank", text: "" }); continue; }

      // Numbered list: "1. xxx" or "1) xxx"
      if (/^\d+[\.\)]\s+/.test(trimmed)) { flushPara(); blocks.push({ type: "list-item", text: trimmed }); continue; }

      // Bullet list: "- xxx" or "* xxx"
      if (/^[-*•]\s+/.test(trimmed)) { flushPara(); blocks.push({ type: "list-item", text: trimmed }); continue; }

      // Heading-like: short line ending with ":"
      if (trimmed.endsWith(":") && trimmed.length < 80) { flushPara(); blocks.push({ type: "heading", text: trimmed }); continue; }

      // Regular text
      paraBuffer.push(line);
    }
    flushPara();
    return blocks;
  }

  /** Render parsed LLM blocks into JSX */
  function renderLLMBlocks(blocks: ReturnType<typeof parseLLMContent>) {
    return blocks.map((block, i) => {
      if (block.type === "blank") return <div key={i} style={{ height: 6 }} />;
      if (block.type === "heading") return <div key={i} className="wf-out-heading">{block.text}</div>;
      if (block.type === "list-item") {
        const match = block.text.match(/^(\d+[\.\)]|-|\*|•)\s+(.*)$/);
        const bullet = match?.[1] ?? "•";
        const content = match?.[2] ?? block.text;
        return (
          <div key={i} className="wf-out-list-item">
            <span className="wf-out-bullet">{bullet}</span>
            <span>{content}</span>
          </div>
        );
      }
      return <div key={i} className="wf-out-paragraph">{block.text}</div>;
    });
  }

  /** Render LLM-style content card (used by llm node AND output node when content is present) */
  function renderLLMCard(output: Record<string, unknown>) {
    const content = String(output.content ?? "");
    const blocks = parseLLMContent(content);
    const model = output.model as string | undefined;
    const provider = output.provider as string | undefined;
    const usage = output.usage as Record<string, unknown> | undefined;
    const _output = output._output as Record<string, unknown> | undefined;

    return (
      <div className="wf-out-card">
        {/* Metadata badges row */}
        <div className="wf-out-badges">
          {provider ? <span className="wf-out-badge wf-out-badge-provider">Provider {provider}</span> : null}
          {model ? <span className="wf-out-badge wf-out-badge-model">Model {model}</span> : null}
          {usage?.totalTokens ? <span className="wf-out-badge wf-out-badge-tokens">Tokens {String(usage.totalTokens)}</span> : null}
        </div>

        {/* Content area */}
        <div className="wf-out-content">
          {renderLLMBlocks(blocks)}
        </div>

        {/* Footer metadata */}
        {_output ? (
          <div className="wf-out-footer">
            {_output.executionId ? <span>Execution: {String(_output.executionId).slice(0, 8)}…</span> : null}
            {_output.collectedAt ? <span>{new Date(String(_output.collectedAt)).toLocaleString()}</span> : null}
          </div>
        ) : null}
      </div>
    );
  }

  function renderNodeOutput(nodeId: string, output: Record<string, unknown> | null) {
    if (!output) return null;

    // Find the node type
    const node = nodes.find((n: CanvasNode) => n.id === nodeId);
    const nodeType = node?.type ?? "";

    // ── Output node: detect upstream LLM data ──
    if (nodeType === "output" || nodeType === "log") {
      // If the output node has LLM content (forwarded from upstream), render as LLM card
      if (typeof output.content === "string" && (output.model || output.provider)) {
        return renderLLMCard(output);
      }
      // Otherwise, render general data card
      const display = output.message ?? output.data ?? output;
      return (
        <div className="wf-out-card">
          <div className="wf-out-content">
            {typeof display === "string" ? (
              <div className="wf-out-paragraph">{display}</div>
            ) : (
              <pre className="wf-out-code">{JSON.stringify(display, null, 2)}</pre>
            )}
          </div>
        </div>
      );
    }

    // ── LLM nodes — rich card ──
    if (nodeType === "llm" && typeof output.content === "string") {
      return renderLLMCard(output);
    }

    // ── HTTP request nodes — status + body card ──
    if (nodeType === "http-request") {
      const status = output.statusCode ?? output.status;
      const body = output.body ?? output.data ?? output.response;
      return (
        <div className="wf-out-card">
          {status ? (
            <div className="wf-out-badges">
              <span className={`wf-out-badge ${Number(status) < 400 ? "wf-out-badge-success" : "wf-out-badge-error"}`}>
                Status {String(status)}
              </span>
            </div>
          ) : null}
          <div className="wf-out-content">
            <pre className="wf-out-code">{typeof body === "string" ? body : JSON.stringify(body, null, 2)}</pre>
          </div>
        </div>
      );
    }

    // ── Data cleaner / transformer — data card ──
    if ((nodeType === "data-cleaner" || nodeType === "transformer") && output.data) {
      return (
        <div className="wf-out-card">
          {output.summary ? (
            <div className="wf-out-badges"><span className="wf-out-badge wf-out-badge-model">Summary {String(output.summary)}</span></div>
          ) : null}
          <div className="wf-out-content">
            <pre className="wf-out-code">{typeof output.data === "string" ? output.data : JSON.stringify(output.data, null, 2)}</pre>
          </div>
        </div>
      );
    }

    // ── File Upload nodes — file info + data card ──
    if (nodeType === "file-upload") {
      const fname = output.fileName as string | undefined;
      const format = output.fileFormat as string | undefined;
      const data = output.data;
      const rowCount = output.rowCount as number | undefined;
      return (
        <div className="wf-out-card">
          <div className="wf-out-badges">
            {fname ? <span className="wf-out-badge wf-out-badge-provider">File {fname}</span> : null}
            {format ? <span className="wf-out-badge wf-out-badge-model">{format.toUpperCase()}</span> : null}
            {rowCount ? <span className="wf-out-badge wf-out-badge-tokens">{rowCount} rows</span> : null}
          </div>
          <div className="wf-out-content">
            {Array.isArray(data) ? (
              <pre className="wf-out-code">{JSON.stringify(data.slice(0, 10), null, 2)}{data.length > 10 ? `\n… and ${data.length - 10} more rows` : ""}</pre>
            ) : typeof data === "string" ? (
              <div className="wf-out-paragraph">{data.length > 2000 ? data.slice(0, 2000) + "\n… (truncated)" : data}</div>
            ) : (
              <pre className="wf-out-code">{JSON.stringify(data, null, 2)}</pre>
            )}
          </div>
        </div>
      );
    }

    // ── Fallback — generic card ──
    return (
      <div className="wf-out-card">
        <div className="wf-out-content">
          <pre className="wf-out-code">{JSON.stringify(output, null, 2)}</pre>
        </div>
      </div>
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
  const canStopExecution =
    Boolean(onStopExecution) &&
    Boolean(executionId) &&
    (executionStatus === "pending" || executionStatus === "running" || isRunning);

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
            disabled={isRunning || isStopping}
          >
            {isRunning ? "Running..." : "Run Workflow"}
          </button>
        )}

        {showExecute && onStopExecution && (
          <button
            className="wf-btn-stop"
            onClick={handleStopExecution}
            disabled={!canStopExecution || isStopping}
          >
            {isStopping ? "Stopping..." : "Stop"}
          </button>
        )}

        {executionStatus && (
          <span
            className={`wf-save-indicator ${
              executionStatus === "completed"
                ? "saved"
                : executionStatus === "failed" || executionStatus === "canceled"
                  ? "error"
                  : "saving"
            }`}
          >
            {executionStatus === "pending" ? "Pending..." :
             executionStatus === "running" ? "Executing..." :
             executionStatus === "completed" ? "Completed" :
             executionStatus === "canceled" ? "Stopped" :
             executionStatus === "failed" ? "Failed" :
             executionStatus}
          </span>
        )}

        {executionId && wfId && (executionStatus === "completed" || executionStatus === "failed" || executionStatus === "canceled") && (
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
                const flowDelay = edgeFlowDelays[edge.id];
                const hasFlow = typeof flowDelay === "number";
                return (
                  <g key={edge.id}>
                    <path
                      className={`wf-edge ${hasFlow ? "wf-edge-success" : ""}`}
                      d={bezierPath(start.x, start.y, end.x, end.y)}
                      onClick={() => handleEdgeClick(edge.id)}
                    />
                    {hasFlow && (
                      <path
                        className="wf-edge-flow"
                        d={bezierPath(start.x, start.y, end.x, end.y)}
                        style={{ "--wf-flow-delay": `${flowDelay}ms` } as React.CSSProperties}
                      />
                    )}
                  </g>
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
