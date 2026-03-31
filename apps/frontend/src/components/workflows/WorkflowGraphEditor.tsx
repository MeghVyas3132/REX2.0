"use client";

import React, { useState, useCallback } from "react";
import { motion } from "framer-motion";
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
          <div className="workflow-unsaved-banner">
            <span>You have unsaved changes. </span>
            <button 
              onClick={handleSave}
              className="workflow-unsaved-save"
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
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
          >
            <NodeConfigPanel
              nodeId={selectedNode.id}
              nodeType={selectedNode.type}
              config={selectedNode.data}
              manifest={selectedNode.data.manifest as any}
              onSave={handleNodeConfigSave}
              onClose={() => setSelectedNodeId(null)}
            />
          </motion.div>
        )}
      </Card>
    </section>
  );
}
