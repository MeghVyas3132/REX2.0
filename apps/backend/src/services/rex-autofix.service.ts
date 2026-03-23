import { and, eq } from "drizzle-orm";
import type { Database } from "@rex/database";
import {
  pluginCatalogue,
  retentionPolicies,
  workflowNodeRexScores,
  workflows,
} from "@rex/database";
import { computeRexScore, type WorkflowGraph } from "@rex/engine";
import { randomUUID } from "node:crypto";
import { DEFAULT_TENANT_ID } from "./tenant-default.js";

type FixAction =
  | "INSERT_CONSENT_GATE_UPSTREAM"
  | "INSERT_PII_ANONYMISER_DOWNSTREAM"
  | "INSERT_GUARDRAIL_UPSTREAM"
  | "INSERT_HUMAN_LOOP_DOWNSTREAM"
  | "INSERT_BIAS_CHECKER_DOWNSTREAM"
  | "ENABLE_AUDIT_LOGGING"
  | "ENABLE_OUTPUT_JUSTIFICATION";

interface WorkflowNode {
  id: string;
  type: string;
  config?: Record<string, unknown>;
}

interface WorkflowEdge {
  source: string;
  target: string;
}

export interface RexAutofixService {
  computeAndPersistScores(tenantId: string, workflowId: string): Promise<Array<{
    nodeId: string;
    rScore: number;
    eScore: number;
    xScore: number;
    totalScore: number;
    isRexEnabled: boolean;
    gaps: string[];
    autoFixesAvailable: string[];
  }>>;
  listScores(tenantId: string, workflowId: string): Promise<Array<{
    id: string;
    nodeId: string;
    rScore: number;
    eScore: number;
    xScore: number;
    totalScore: number;
    isRexEnabled: boolean;
    gaps: string[];
    autoFixesAvailable: string[];
    computedAt: Date;
  }>>;
  previewFixes(tenantId: string, workflowId: string, nodeId: string): Promise<{ nodeId: string; fixes: string[] }>;
  applyFixes(input: {
    tenantId: string;
    workflowId: string;
    nodeId: string;
    actions: string[];
    actorUserId: string;
  }): Promise<{ workflowId: string; nodeId: string; applied: string[] }>;
}

const actionNodeTypeMap: Record<
  Exclude<FixAction, "ENABLE_AUDIT_LOGGING" | "ENABLE_OUTPUT_JUSTIFICATION">,
  string
> = {
  INSERT_CONSENT_GATE_UPSTREAM: "consent-gate",
  INSERT_PII_ANONYMISER_DOWNSTREAM: "pii-anonymiser",
  INSERT_GUARDRAIL_UPSTREAM: "guardrail",
  INSERT_HUMAN_LOOP_DOWNSTREAM: "human-in-the-loop",
  INSERT_BIAS_CHECKER_DOWNSTREAM: "bias-checker",
};

function asNodes(value: unknown): WorkflowNode[] {
  if (!Array.isArray(value)) return [];
  const nodes: WorkflowNode[] = [];
  for (const item of value) {
    if (!item || typeof item !== "object") continue;
    const id = (item as { id?: unknown }).id;
    const type = (item as { type?: unknown }).type;
    if (typeof id !== "string" || typeof type !== "string") continue;
    const config = (item as { config?: unknown }).config;
    nodes.push({
      id,
      type,
      config: config && typeof config === "object" && !Array.isArray(config) ? (config as Record<string, unknown>) : {},
    });
  }
  return nodes;
}

function asEdges(value: unknown): WorkflowEdge[] {
  if (!Array.isArray(value)) return [];
  const edges: WorkflowEdge[] = [];
  for (const item of value) {
    if (!item || typeof item !== "object") continue;
    const source = (item as { source?: unknown }).source;
    const target = (item as { target?: unknown }).target;
    if (typeof source !== "string" || typeof target !== "string") continue;
    edges.push({ source, target });
  }
  return edges;
}

function toGraph(nodes: WorkflowNode[], edges: WorkflowEdge[]): WorkflowGraph {
  return {
    nodes: nodes.map((node) => ({ id: node.id, type: node.type, pluginSlug: node.type })),
    edges: edges.map((edge) => ({ source: edge.source, target: edge.target })),
  };
}

function normalizeAction(action: string): FixAction | null {
  const value = action as FixAction;
  if (
    value === "INSERT_CONSENT_GATE_UPSTREAM" ||
    value === "INSERT_PII_ANONYMISER_DOWNSTREAM" ||
    value === "INSERT_GUARDRAIL_UPSTREAM" ||
    value === "INSERT_HUMAN_LOOP_DOWNSTREAM" ||
    value === "INSERT_BIAS_CHECKER_DOWNSTREAM" ||
    value === "ENABLE_AUDIT_LOGGING" ||
    value === "ENABLE_OUTPUT_JUSTIFICATION"
  ) {
    return value;
  }
  return null;
}

export function applyRexFixesToGraph(
  nodes: WorkflowNode[],
  edges: WorkflowEdge[],
  targetNodeId: string,
  actions: string[],
  actorUserId: string
): { nodes: WorkflowNode[]; edges: WorkflowEdge[]; applied: string[] } {
  const targetNode = nodes.find((node) => node.id === targetNodeId);
  if (!targetNode) throw new Error("Node not found");

  const normalizedActions = Array.from(
    new Set(
      actions
        .map((action) => normalizeAction(action))
        .filter((action): action is FixAction => Boolean(action))
    )
  );

  for (const action of normalizedActions) {
    if (action === "ENABLE_AUDIT_LOGGING") {
      targetNode.config = { ...(targetNode.config ?? {}), auditEnabled: true };
      continue;
    }
    if (action === "ENABLE_OUTPUT_JUSTIFICATION") {
      targetNode.config = { ...(targetNode.config ?? {}), emitJustification: true };
      continue;
    }

    const helperNodeType = actionNodeTypeMap[action];
    const helperNodeId = randomUUID();
    nodes.push({
      id: helperNodeId,
      type: helperNodeType,
      config: {
        generatedBy: "rex-autofix",
        generatedAt: new Date().toISOString(),
        generatedForNodeId: targetNodeId,
        generatedByUserId: actorUserId,
      },
    });

    if (action.endsWith("_UPSTREAM")) {
      edges.push({ source: helperNodeId, target: targetNodeId });
    } else {
      edges.push({ source: targetNodeId, target: helperNodeId });
    }
  }

  return {
    nodes,
    edges,
    applied: normalizedActions,
  };
}

export function createRexAutofixService(db: Database): RexAutofixService {
  return {
    async computeAndPersistScores(tenantId, workflowId) {
      const [workflow] = await db
        .select({ id: workflows.id, nodes: workflows.nodes, edges: workflows.edges })
        .from(workflows)
        .where(and(eq(workflows.id, workflowId), eq(workflows.tenantId, tenantId)))
        .limit(1);

      if (!workflow) throw new Error("Workflow not found");

      const nodes = asNodes(workflow.nodes);
      const edges = asEdges(workflow.edges);
      const graph = toGraph(nodes, edges);

      const [retention] = await db
        .select({ retentionDays: retentionPolicies.retentionDays })
        .from(retentionPolicies)
        .where(
          and(
            eq(retentionPolicies.tenantId, tenantId),
            eq(retentionPolicies.resourceType, "executions"),
            eq(retentionPolicies.isActive, true)
          )
        )
        .limit(1);

      const manifests = await db
        .select({ slug: pluginCatalogue.slug, rexHints: pluginCatalogue.rexHints })
        .from(pluginCatalogue)
        .where(eq(pluginCatalogue.isActive, true));
      const manifestMap = new Map(manifests.map((row) => [row.slug, row.rexHints]));

      const results: Array<{
        nodeId: string;
        rScore: number;
        eScore: number;
        xScore: number;
        totalScore: number;
        isRexEnabled: boolean;
        gaps: string[];
        autoFixesAvailable: string[];
      }> = [];

      for (const node of nodes) {
        const rexHints = (manifestMap.get(node.type) as Record<string, unknown> | undefined) ?? {};
        const score = computeRexScore({
          nodeId: node.id,
          nodeConfig: node.config ?? {},
          pluginManifest: {
            slug: node.type,
            name: node.type,
            description: `${node.type} plugin`,
            category: "logic_control",
            version: "1.0.0",
            inputSchema: { type: "object", properties: {}, required: [] },
            outputSchema: { type: "object", properties: {}, required: [] },
            rexHints: {
              responsibleScore: 50,
              ethicalScore: 50,
              explainableScore: 50,
              dataCategories: [],
              gdprLawfulBasisRequired: Boolean(rexHints["gdprLawfulBasisRequired"]),
              piiRisk: (rexHints["piiRisk"] as "none" | "low" | "medium" | "high") ?? "low",
              crossBorderRisk: Boolean(rexHints["crossBorderRisk"]),
              auditRequired: Boolean(rexHints["auditRequired"]),
            },
            isAllowedInBusinessMode: true,
          },
          workflowGraph: graph,
          tenantConfig: { dataRetentionDays: retention?.retentionDays },
        });

        await db
          .insert(workflowNodeRexScores)
          .values({
            workflowId,
            nodeId: node.id,
            rScore: score.rScore,
            eScore: score.eScore,
            xScore: score.xScore,
            totalScore: score.totalScore,
            isRexEnabled: score.isRexEnabled,
            breakdown: score.breakdown,
            gaps: score.gaps,
            autoFixesAvailable: score.autoFixesAvailable,
            computedAt: new Date(score.computedAt),
          })
          .onConflictDoUpdate({
            target: [workflowNodeRexScores.workflowId, workflowNodeRexScores.nodeId],
            set: {
              rScore: score.rScore,
              eScore: score.eScore,
              xScore: score.xScore,
              totalScore: score.totalScore,
              isRexEnabled: score.isRexEnabled,
              breakdown: score.breakdown,
              gaps: score.gaps,
              autoFixesAvailable: score.autoFixesAvailable,
              computedAt: new Date(score.computedAt),
            },
          });

        results.push({
          nodeId: node.id,
          rScore: score.rScore,
          eScore: score.eScore,
          xScore: score.xScore,
          totalScore: score.totalScore,
          isRexEnabled: score.isRexEnabled,
          gaps: score.gaps,
          autoFixesAvailable: score.autoFixesAvailable,
        });
      }

      return results;
    },

    async listScores(tenantId, workflowId) {
      const rows = await db
        .select({
          id: workflowNodeRexScores.id,
          nodeId: workflowNodeRexScores.nodeId,
          rScore: workflowNodeRexScores.rScore,
          eScore: workflowNodeRexScores.eScore,
          xScore: workflowNodeRexScores.xScore,
          totalScore: workflowNodeRexScores.totalScore,
          isRexEnabled: workflowNodeRexScores.isRexEnabled,
          gaps: workflowNodeRexScores.gaps,
          autoFixesAvailable: workflowNodeRexScores.autoFixesAvailable,
          computedAt: workflowNodeRexScores.computedAt,
        })
        .from(workflowNodeRexScores)
        .innerJoin(workflows, eq(workflows.id, workflowNodeRexScores.workflowId))
        .where(and(eq(workflowNodeRexScores.workflowId, workflowId), eq(workflows.tenantId, tenantId)));

      return rows;
    },

    async previewFixes(tenantId, workflowId, nodeId) {
      const rows = await this.computeAndPersistScores(tenantId, workflowId);
      const node = rows.find((row) => row.nodeId === nodeId);
      if (!node) throw new Error("Node not found");
      return { nodeId, fixes: node.autoFixesAvailable };
    },

    async applyFixes(input) {
      const [workflow] = await db
        .select({ id: workflows.id, nodes: workflows.nodes, edges: workflows.edges, version: workflows.version })
        .from(workflows)
        .where(and(eq(workflows.id, input.workflowId), eq(workflows.tenantId, input.tenantId)))
        .limit(1);
      if (!workflow) throw new Error("Workflow not found");

      const nodes = asNodes(workflow.nodes);
      const edges = asEdges(workflow.edges);
      const updated = applyRexFixesToGraph(
        nodes,
        edges,
        input.nodeId,
        input.actions,
        input.actorUserId
      );

      await db
        .update(workflows)
        .set({
          nodes: updated.nodes,
          edges: updated.edges,
          version: (workflow.version ?? 1) + 1,
          updatedAt: new Date(),
        })
        .where(eq(workflows.id, workflow.id));

      await this.computeAndPersistScores(input.tenantId || DEFAULT_TENANT_ID, input.workflowId);

      return {
        workflowId: input.workflowId,
        nodeId: input.nodeId,
        applied: updated.applied,
      };
    },
  };
}
