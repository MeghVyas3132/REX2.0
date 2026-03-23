import type { PluginManifest, RexScore, RexScoreBreakdown } from "@rex/types";

interface WorkflowGraphNode {
  id: string;
  type?: string;
  pluginSlug?: string;
}

interface WorkflowGraphEdge {
  source: string;
  target: string;
}

export interface WorkflowGraph {
  nodes: WorkflowGraphNode[];
  edges: WorkflowGraphEdge[];
}

export interface TenantConfig {
  dataRetentionDays?: number;
}

interface ScoringInput {
  nodeId: string;
  nodeConfig: Record<string, unknown>;
  pluginManifest: PluginManifest;
  workflowGraph: WorkflowGraph;
  tenantConfig: TenantConfig;
}

export function computeRexScore(input: ScoringInput): RexScore {
  const responsible = computeResponsibleScore(input);
  const ethical = computeEthicalScore(input);
  const explainable = computeExplainableScore(input);

  const total = Math.round(
    responsible.score * 0.4 + ethical.score * 0.3 + explainable.score * 0.3
  );

  const gaps = collectGaps(responsible, ethical, explainable);
  const autoFixes = collectAutoFixes(responsible, ethical, explainable);

  return {
    nodeId: input.nodeId,
    rScore: responsible.score,
    eScore: ethical.score,
    xScore: explainable.score,
    totalScore: total,
    isRexEnabled: total >= 70,
    breakdown: {
      responsible,
      ethical,
      explainable,
    },
    gaps,
    autoFixesAvailable: autoFixes,
    computedAt: new Date().toISOString(),
  };
}

function computeResponsibleScore(input: ScoringInput): RexScoreBreakdown {
  const checks = [
    {
      name: "data_minimisation",
      passed: checkDataMinimisation(input.nodeConfig),
      weight: 25,
      description: "Node only accesses data fields necessary for its purpose",
      autoFixable: false,
    },
    {
      name: "consent_gate_present",
      passed: input.pluginManifest.rexHints.gdprLawfulBasisRequired
        ? checkUpstreamNodeBySlug(input.nodeId, input.workflowGraph, "consent-gate")
        : true,
      weight: 25,
      description:
        "A consent gate node exists upstream before personal data is processed",
      autoFixable: true,
      fixAction: "INSERT_CONSENT_GATE_UPSTREAM",
    },
    {
      name: "pii_handling_configured",
      passed:
        input.pluginManifest.rexHints.piiRisk === "none" ||
        input.pluginManifest.rexHints.piiRisk === "low"
          ? true
          : checkPiiHandlingConfig(input.nodeConfig),
      weight: 25,
      description: "PII anonymisation or masking is configured for sensitive fields",
      autoFixable: true,
      fixAction: "INSERT_PII_ANONYMISER_DOWNSTREAM",
    },
    {
      name: "retention_policy",
      passed: checkRetentionPolicy(input.tenantConfig),
      weight: 25,
      description: "Tenant has a data retention policy configured",
      autoFixable: false,
    },
  ];

  const score = checks.reduce((sum, check) => sum + (check.passed ? check.weight : 0), 0);
  return { score, checks };
}

function computeEthicalScore(input: ScoringInput): RexScoreBreakdown {
  const checks = [
    {
      name: "guardrail_present",
      passed: checkUpstreamNodeBySlug(input.nodeId, input.workflowGraph, "guardrail"),
      weight: 34,
      description: "A guardrail or input-guard node exists upstream",
      autoFixable: true,
      fixAction: "INSERT_GUARDRAIL_UPSTREAM",
    },
    {
      name: "human_loop_for_high_impact",
      passed: checkHumanLoopForHighImpact(input.nodeConfig, input.workflowGraph),
      weight: 33,
      description: "High-impact decisions have a human-in-the-loop or approval gate",
      autoFixable: true,
      fixAction: "INSERT_HUMAN_LOOP_DOWNSTREAM",
    },
    {
      name: "bias_check_configured",
      passed: checkAnyNodeBySlug(input.workflowGraph, "bias-checker"),
      weight: 33,
      description: "A bias checker node is present in the workflow",
      autoFixable: true,
      fixAction: "INSERT_BIAS_CHECKER_DOWNSTREAM",
    },
  ];

  const score = checks.reduce((sum, check) => sum + (check.passed ? check.weight : 0), 0);
  return { score, checks };
}

function computeExplainableScore(input: ScoringInput): RexScoreBreakdown {
  const checks = [
    {
      name: "audit_logging_enabled",
      passed: input.nodeConfig.auditEnabled === true,
      weight: 34,
      description: "Audit logging is enabled for this node",
      autoFixable: true,
      fixAction: "ENABLE_AUDIT_LOGGING",
    },
    {
      name: "node_description_set",
      passed:
        typeof input.nodeConfig.description === "string" &&
        input.nodeConfig.description.length > 10,
      weight: 33,
      description: "Node has a meaningful description explaining its purpose",
      autoFixable: false,
    },
    {
      name: "output_justification",
      passed: input.nodeConfig.emitJustification === true,
      weight: 33,
      description: "Node is configured to emit justification or explanation with its output",
      autoFixable: true,
      fixAction: "ENABLE_OUTPUT_JUSTIFICATION",
    },
  ];

  const score = checks.reduce((sum, check) => sum + (check.passed ? check.weight : 0), 0);
  return { score, checks };
}

function checkDataMinimisation(nodeConfig: Record<string, unknown>): boolean {
  const requestedFields = nodeConfig.requestedFields;
  if (!Array.isArray(requestedFields)) return true;
  return requestedFields.length <= 20;
}

function checkPiiHandlingConfig(nodeConfig: Record<string, unknown>): boolean {
  return Boolean(nodeConfig.piiHandlingConfig);
}

function checkRetentionPolicy(tenantConfig: TenantConfig): boolean {
  return typeof tenantConfig.dataRetentionDays === "number";
}

function checkHumanLoopForHighImpact(
  nodeConfig: Record<string, unknown>,
  workflowGraph: WorkflowGraph
): boolean {
  if (nodeConfig.highImpactDecision !== true) return true;
  return (
    checkAnyNodeBySlug(workflowGraph, "human-in-the-loop") ||
    checkAnyNodeBySlug(workflowGraph, "approval-gate")
  );
}

function checkAnyNodeBySlug(workflowGraph: WorkflowGraph, slug: string): boolean {
  return workflowGraph.nodes.some((node) => node.pluginSlug === slug || node.type === slug);
}

function checkUpstreamNodeBySlug(
  nodeId: string,
  workflowGraph: WorkflowGraph,
  slug: string
): boolean {
  const reverseEdges = new Map<string, string[]>();
  for (const edge of workflowGraph.edges) {
    const existing = reverseEdges.get(edge.target) ?? [];
    existing.push(edge.source);
    reverseEdges.set(edge.target, existing);
  }

  const visited = new Set<string>();
  const queue: string[] = [nodeId];

  while (queue.length > 0) {
    const current = queue.shift();
    if (!current || visited.has(current)) continue;
    visited.add(current);

    const parents = reverseEdges.get(current) ?? [];
    for (const parentId of parents) {
      const parentNode = workflowGraph.nodes.find((node) => node.id === parentId);
      if (parentNode && (parentNode.pluginSlug === slug || parentNode.type === slug)) {
        return true;
      }
      queue.push(parentId);
    }
  }

  return false;
}

function collectGaps(
  responsible: RexScoreBreakdown,
  ethical: RexScoreBreakdown,
  explainable: RexScoreBreakdown
): string[] {
  return [...responsible.checks, ...ethical.checks, ...explainable.checks]
    .filter((check) => !check.passed)
    .map((check) => check.description);
}

function collectAutoFixes(
  responsible: RexScoreBreakdown,
  ethical: RexScoreBreakdown,
  explainable: RexScoreBreakdown
): string[] {
  return [...responsible.checks, ...ethical.checks, ...explainable.checks]
    .filter((check) => !check.passed && check.autoFixable && check.fixAction)
    .map((check) => check.fixAction as string);
}