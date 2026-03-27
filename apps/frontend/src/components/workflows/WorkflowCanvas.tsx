"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  addEdge,
  useNodesState,
  useEdgesState,
  type Node,
  type Edge,
  type Connection,
  type NodeTypes,
  type ReactFlowInstance,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import type { Plugin } from "@rex/types";

// Custom node component for workflow nodes
function WorkflowNode({ data }: { data: { label: string; type: string; config: Record<string, unknown>; icon?: string; description?: string } }) {
  return (
    <div className="workflow-node" style={{
      padding: "12px 16px",
      borderRadius: "8px",
      border: "2px solid #ddd",
      background: "white",
      minWidth: "180px",
      boxShadow: "0 2px 8px rgba(0,0,0,0.1)"
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
        {data.icon && <span style={{ fontSize: "18px" }}>{data.icon}</span>}
        <strong style={{ fontSize: "14px" }}>{data.label || data.type}</strong>
      </div>
      {data.description && (
        <div style={{ fontSize: "11px", color: "#666", marginTop: "4px" }}>
          {data.description}
        </div>
      )}
    </div>
  );
}

const nodeTypes: NodeTypes = {
  workflowNode: WorkflowNode,
};

export type WorkflowCanvasProps = {
  nodes: Array<{ id: string; type: string; data: Record<string, unknown>; position?: { x: number; y: number } }>;
  edges: Array<{ id: string; source: string; target: string; sourceHandle?: string; targetHandle?: string }>;
  readOnly?: boolean;
  onNodesChange?: (nodes: any[]) => void;
  onEdgesChange?: (edges: any[]) => void;
  onNodeClick?: (nodeId: string) => void;
  onDropNode?: (plugin: Plugin, position: { x: number; y: number }) => void;
};

let draggedPluginData: Plugin | null = null;

export function setDraggedPlugin(plugin: Plugin | null) {
  draggedPluginData = plugin;
}

export function getDraggedPlugin(): Plugin | null {
  return draggedPluginData;
}

export function WorkflowCanvas({
  nodes: initialNodes,
  edges: initialEdges,
  readOnly = false,
  onNodesChange,
  onEdgesChange,
  onNodeClick,
  onDropNode,
}: WorkflowCanvasProps) {
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const [reactFlowInstance, setReactFlowInstance] = useState<ReactFlowInstance | null>(null);

  // Convert workflow nodes to React Flow nodes
  const convertedNodes: Node[] = useMemo(
    () =>
      initialNodes.map((node) => ({
        id: node.id,
        type: "workflowNode",
        data: {
          label: (node.data as any).label || node.id,
          type: node.type,
          config: node.data,
        },
        position: node.position || { x: 100, y: 100 },
      })),
    [initialNodes]
  );

  // Convert workflow edges to React Flow edges
  const convertedEdges: Edge[] = useMemo(
    () =>
      initialEdges.map((edge, idx) => ({
        id: edge.id || `edge-${idx}`,
        source: edge.source,
        target: edge.target,
        sourceHandle: edge.sourceHandle,
        targetHandle: edge.targetHandle,
        animated: !readOnly,
      })),
    [initialEdges, readOnly]
  );

  const [nodes, setNodes, onNodesChangeInternal] = useNodesState(convertedNodes);
  const [edges, setEdges, onEdgesChangeInternal] = useEdgesState(convertedEdges);

  // Update nodes when initialNodes changes
  useEffect(() => {
    setNodes(convertedNodes);
  }, [convertedNodes, setNodes]);

  // Update edges when initialEdges changes
  useEffect(() => {
    setEdges(convertedEdges);
  }, [convertedEdges, setEdges]);

  // Handle connection (creating new edges)
  const onConnect = useCallback(
    (connection: Connection) => {
      if (readOnly) return;
      
      const newEdges = addEdge(connection, edges);
      setEdges(newEdges);
      
      if (onEdgesChange) {
        // Convert back to workflow format
        const workflowEdges = newEdges.map((edge) => ({
          id: edge.id,
          source: edge.source,
          target: edge.target,
          sourceHandle: edge.sourceHandle || undefined,
          targetHandle: edge.targetHandle || undefined,
        }));
        onEdgesChange(workflowEdges);
      }
    },
    [edges, setEdges, readOnly, onEdgesChange]
  );

  // Handle node click
  const handleNodeClick = useCallback(
    (_event: React.MouseEvent, node: Node) => {
      if (onNodeClick) {
        onNodeClick(node.id);
      }
    },
    [onNodeClick]
  );

  // Notify parent of node changes
  const handleNodesChange = useCallback(
    (changes: any) => {
      onNodesChangeInternal(changes);
      
      if (onNodesChange && !readOnly) {
        // Get updated nodes after changes
        setTimeout(() => {
          setNodes((currentNodes) => {
            const workflowNodes = currentNodes.map((node) => ({
              id: node.id,
              type: (node.data as any).type || "unknown",
              data: (node.data as any).config || {},
              position: node.position,
            }));
            onNodesChange(workflowNodes);
            return currentNodes;
          });
        }, 0);
      }
    },
    [onNodesChangeInternal, onNodesChange, readOnly, setNodes]
  );

  // Handle drag over
  const onDragOver = useCallback((event: React.DragEvent) => {
    if (readOnly) return;
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
  }, [readOnly]);

  // Handle drop
  const onDrop = useCallback(
    (event: React.DragEvent) => {
      if (readOnly || !reactFlowInstance) return;
      event.preventDefault();

      const plugin = getDraggedPlugin();
      if (!plugin) return;

      const bounds = reactFlowWrapper.current?.getBoundingClientRect();
      if (!bounds) return;

      const position = reactFlowInstance.screenToFlowPosition({
        x: event.clientX - bounds.left,
        y: event.clientY - bounds.top,
      });

      if (onDropNode) {
        onDropNode(plugin, position);
      } else {
        // Create node directly
        const nodeId = `${plugin.slug}-${Date.now()}`;
        const newNode: Node = {
          id: nodeId,
          type: "workflowNode",
          position,
          data: {
            label: plugin.name,
            type: plugin.slug,
            config: {},
            icon: plugin.icon,
            description: plugin.description,
          },
        };

        setNodes((nds) => nds.concat(newNode));

        if (onNodesChange) {
          const workflowNodes = [...nodes, newNode].map((node) => ({
            id: node.id,
            type: (node.data as any).type || "unknown",
            data: (node.data as any).config || {},
            position: node.position,
          }));
          onNodesChange(workflowNodes);
        }
      }

      setDraggedPlugin(null);
    },
    [readOnly, reactFlowInstance, onDropNode, setNodes, onNodesChange, nodes]
  );

  return (
    <div 
      ref={reactFlowWrapper}
      style={{ width: "100%", height: "600px", border: "1px solid #ddd", borderRadius: "8px" }}
      onDragOver={onDragOver}
      onDrop={onDrop}
    >
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={handleNodesChange}
        onEdgesChange={readOnly ? undefined : onEdgesChangeInternal}
        onConnect={onConnect}
        onNodeClick={handleNodeClick}
        onInit={setReactFlowInstance}
        nodeTypes={nodeTypes}
        fitView
        attributionPosition="bottom-left"
        nodesDraggable={!readOnly}
        nodesConnectable={!readOnly}
        elementsSelectable={true}
        deleteKeyCode={readOnly ? null : "Delete"}
      >
        <Background />
        <Controls />
        <MiniMap />
      </ReactFlow>
    </div>
  );
}
