// ──────────────────────────────────────────────
// REX - REX Scoring Types (Responsible, Ethical, Explainable)
// ──────────────────────────────────────────────

// ─── REX Score Ranges ─────────────────────────────────────────────────────────

export type RexScoreValue = number; // 0-100

export interface RexScores {
  rScore: RexScoreValue; // Responsible: data handling, consent, retention
  eScore: RexScoreValue; // Ethical: bias mitigation, human oversight, fairness
  xScore: RexScoreValue; // Explainable: transparency, audit trail, reasoning
  totalScore: RexScoreValue; // Weighted average
}

// ─── REX Score Breakdown ──────────────────────────────────────────────────────

export interface RexCategoryBreakdown {
  responsible: RexResponsibleBreakdown;
  ethical: RexEthicalBreakdown;
  explainable: RexExplainableBreakdown;
}

export interface RexScoreBreakdown {
  score: number;
  checks: Array<{
    name: string;
    passed: boolean;
    weight: number;
    description: string;
    autoFixable: boolean;
    fixAction?: string;
  }>;
}

export interface RexScore {
  nodeId: string;
  rScore: number;
  eScore: number;
  xScore: number;
  totalScore: number;
  isRexEnabled: boolean;
  breakdown: {
    responsible: RexScoreBreakdown;
    ethical: RexScoreBreakdown;
    explainable: RexScoreBreakdown;
  };
  gaps: string[];
  autoFixesAvailable: string[];
  computedAt: string;
}

export type RexBadgeStatus = "rex_full" | "rex_partial" | "rex_none" | "rex_disabled";

export interface RexResponsibleBreakdown {
  dataHandling: number;
  consentManagement: number;
  retentionCompliance: number;
  dataMinimization: number;
  purposeLimitation: number;
}

export interface RexEthicalBreakdown {
  biasMitigation: number;
  humanOversight: number;
  fairnessCheck: number;
  harmPrevention: number;
  stakeholderImpact: number;
}

export interface RexExplainableBreakdown {
  auditTrail: number;
  reasoningTransparency: number;
  decisionDocumentation: number;
  outputAttribution: number;
  modelCardPresence: number;
}

// ─── Workflow Node REX Score ──────────────────────────────────────────────────

export interface WorkflowNodeRexScore {
  id: string;
  workflowId: string;
  nodeId: string;
  rScore: RexScoreValue;
  eScore: RexScoreValue;
  xScore: RexScoreValue;
  totalScore: RexScoreValue;
  isRexEnabled: boolean;
  breakdown: RexCategoryBreakdown;
  gaps: string[];
  autoFixesAvailable: string[];
  computedAt: Date;
}

// ─── REX Gap & Fix Types ──────────────────────────────────────────────────────

export type RexGapCategory =
  | "consent_missing"
  | "retention_undefined"
  | "human_review_missing"
  | "audit_incomplete"
  | "explanation_missing"
  | "bias_unchecked"
  | "data_sensitivity_high";

export interface RexGap {
  category: RexGapCategory;
  nodeId: string;
  description: string;
  severity: "low" | "medium" | "high" | "critical";
  recommendation: string;
  autoFixAvailable: boolean;
}

export interface RexAutoFix {
  id: string;
  gapCategory: RexGapCategory;
  description: string;
  configPatch: Record<string, unknown>;
  estimatedScoreImprovement: RexScores;
}

// ─── REX Wizard Types ─────────────────────────────────────────────────────────

export interface RexWizardState {
  currentStep: number;
  totalSteps: number;
  nodeId: string;
  nodeType: string;
  currentScores: RexScores;
  targetScores: RexScores;
  pendingChanges: RexWizardChange[];
  completedChanges: RexWizardChange[];
}

export interface RexWizardChange {
  field: string;
  oldValue: unknown;
  newValue: unknown;
  category: "responsible" | "ethical" | "explainable";
  scoreImpact: Partial<RexScores>;
}

export interface RexWizardStep {
  id: string;
  title: string;
  description: string;
  category: "responsible" | "ethical" | "explainable";
  questions: RexWizardQuestion[];
}

export interface RexWizardQuestion {
  id: string;
  prompt: string;
  type: "boolean" | "select" | "multiselect" | "text";
  options?: { value: string; label: string; scoreImpact: Partial<RexScores> }[];
  required: boolean;
  helpText?: string;
}

// ─── REX Configuration Types ──────────────────────────────────────────────────

export interface NodeRexConfiguration {
  humanReviewRequired: boolean;
  humanReviewThreshold?: number;
  retentionDays?: number;
  consentRequired: boolean;
  consentType?: string;
  dataCategories: string[];
  sensitivityLevel: "low" | "medium" | "high" | "critical";
  explanationTemplate?: string;
  auditLevel: "minimal" | "standard" | "detailed" | "comprehensive";
  biasCheckEnabled: boolean;
  outputFiltering: boolean;
}

// ─── Workflow REX Summary ─────────────────────────────────────────────────────

export interface WorkflowRexSummary {
  workflowId: string;
  aggregateScores: RexScores;
  nodeScores: WorkflowNodeRexScore[];
  overallGaps: RexGap[];
  rexEnabled: boolean;
  lastComputedAt: Date;
  recommendations: string[];
}

// ─── REX Computation Input ────────────────────────────────────────────────────

export interface ComputeRexScoresInput {
  workflowId: string;
  nodeId?: string; // If provided, only compute for this node
  force?: boolean; // Force recomputation even if cached
}

export interface ApplyRexAutoFixInput {
  workflowId: string;
  nodeId: string;
  fixId: string;
}
