"use client";

import React, { useState, useCallback } from "react";
import { Card } from "@/components/ui/Card";
import { WorkflowCanvas } from "./WorkflowCanvas";
import { NodeConfigPanel } from "./NodeConfigPanel";

export type WorkflowGraphEditorProps = {
  nodes: Array<{ id: string; type: string; data: Record<string, unknown>; position?: { x: number; y: number } }>;
  edges: Array<{ id: string; source: string; target: string; sourceHandle?: string; targetHandle?: string }>;
  readOnly?: boolean;
  onSave?: (nodes: any[], edges: any[]) => void;
  className?: string;
};

export function WorkflowGraphEditor({ 
  nodes: initialNodes, 
  edges: initialEdges,
  readOnly = false,
  onSave,
  className 
}: WorkflowGraphEditorProps) {
  const [nodes, setNodes] = useState(initialNodes);
  const [edges, setEdges] = useState(initialEdges);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [hasChanges, setHasChanges] = useState(false);

  const handleNodesChange = useCallback((updatedNodes: any[]) => {
    setNodes(updatedNodes);
    setHasChanges(true);
  }, []);

  const handleEdgesChange = useCallback((updatedEdges: any[]) => {
    setEdges(updatedEdges);
    setHasChanges(true);
  }, []);

  const handleNodeClick = useCallback((nodeId: string) => {
    setSelectedNodeId(nodeId);
  }, []);

  const handleSave = useCallback(() => {
    if (onSave) {
      onSave(nodes, edges);
      setHasChanges(false);
    }
  }, [nodes, edges, onSave]);

  const handleNodeConfigSave = useCallback((config: Record<string, unknown>) => {
    if (!selectedNodeId) return;
    
    setNodes((prevNodes) =>
      prevNodes.map((node) =>
        node.id === selectedNodeId
          ? { ...node, data: { ...node.data, ...config } }
          : node
      )
    );
    setHasChanges(true);
    setSelectedNodeId(null);
  }, [selectedNodeId]);

  const selectedNode = selectedNodeId ? nodes.find((n) => n.id === selectedNodeId) : null;

  return (
    <section className={className}>
      <Card title={readOnly ? "Workflow Viewer" : "Workflow Editor"}>
        {!readOnly && hasChanges && (
          <div style={{ marginBottom: "12px", padding: "8px", background: "#fff3cd", borderRadius: "4px" }}>
            <span>You have unsaved changes. </span>
            <button 
              onClick={handleSave}
              style={{ 
                marginLeft: "8px", 
                padding: "4px 12px", 
                background: "#007bff", 
                color: "white", 
                border: "none", 
                borderRadius: "4px",
                cursor: "pointer"
              }}
            >
              Save Workflow
            </button>
          </div>
        )}
        
        <WorkflowCanvas
          nodes={nodes}
          edges={edges}
          readOnly={readOnly}
          onNodesChange={handleNodesChange}
          onEdgesChange={handleEdgesChange}
          onNodeClick={handleNodeClick}
        />

        {selectedNode && !readOnly && (
          <NodeConfigPanel
            nodeId={selectedNode.id}
            nodeType={selectedNode.type}
            config={selectedNode.data}
            manifest={selectedNode.data.manifest as any}
            onSave={handleNodeConfigSave}
            onClose={() => setSelectedNodeId(null)}
          />
        )}
      </Card>
    </section>
  );
}
