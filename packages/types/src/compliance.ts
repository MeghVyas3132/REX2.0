// ──────────────────────────────────────────────
// REX - Compliance Types (GDPR, DPDP)
// ──────────────────────────────────────────────

// ─── GDPR Legal Basis ─────────────────────────────────────────────────────────

export type GdprLegalBasis =
  | "consent"
  | "legitimate_interest"
  | "contract"
  | "legal_obligation"
  | "vital_interests"
  | "public_task";

// ─── DPDP (India) Legal Basis ─────────────────────────────────────────────────

export type DpdpLegalBasis =
  | "consent"
  | "legitimate_use"
  | "legal_obligation"
  | "medical_emergency";

// ─── Workflow Legal Basis ─────────────────────────────────────────────────────

export interface WorkflowLegalBasis {
  id: string;
  workflowId: string;
  tenantId: string;
  gdprBasis: GdprLegalBasis | null;
  dpdpBasis: DpdpLegalBasis | null;
  purposeDescription: string;
  dataCategories: string[];
  crossBorderTransfer: boolean;
  transferSafeguards: string | null;
  retentionDays: number | null;
  lastReviewedAt: Date | null;
  reviewedBy: string | null;
  createdAt: Date;
}

// ─── Data Categories ──────────────────────────────────────────────────────────

export type DataCategory =
  | "personal_basic"
  | "personal_contact"
  | "personal_identity"
  | "personal_financial"
  | "personal_health"
  | "personal_biometric"
  | "personal_genetic"
  | "personal_location"
  | "personal_behavioral"
  | "sensitive_religious"
  | "sensitive_political"
  | "sensitive_sexual"
  | "sensitive_ethnic"
  | "sensitive_criminal"
  | "child_data"
  | "anonymous"
  | "pseudonymous";

// ─── User Consent ─────────────────────────────────────────────────────────────

export type ConsentType =
  | "terms"
  | "privacy"
  | "analytics"
  | "training"
  | "marketing"
  | "data_processing"
  | "cross_border_transfer";

export interface UserConsent {
  id: string;
  tenantId: string;
  userId: string;
  consentType: ConsentType;
  policyVersion: string;
  granted: boolean;
  metadata: ConsentMetadata;
  createdAt: Date;
  updatedAt: Date;
}

export interface ConsentMetadata {
  ipAddress?: string;
  userAgent?: string;
  collectionMethod?: "explicit" | "implicit" | "delegated";
  purpose?: string;
  scope?: string[];
  expiresAt?: string;
}

// ─── Retention Policy ─────────────────────────────────────────────────────────

export type RetentionResourceType =
  | "executions"
  | "knowledge_documents"
  | "guardrail_events"
  | "audit_logs"
  | "user_data"
  | "api_logs";

export interface RetentionPolicy {
  id: string;
  tenantId: string;
  userId: string | null;
  resourceType: RetentionResourceType;
  retentionDays: number;
  config: RetentionPolicyConfig;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface RetentionPolicyConfig {
  archiveBeforeDelete?: boolean;
  archiveLocation?: string;
  notifyBeforeDelete?: boolean;
  notifyDaysBefore?: number;
  excludePatterns?: string[];
}

// ─── Data Access Audit Log ────────────────────────────────────────────────────

export type DataAccessAction =
  | "view"
  | "export"
  | "delete"
  | "query"
  | "modify"
  | "share"
  | "download";

export interface DataAccessAuditLog {
  id: string;
  actorUserId: string;
  subjectUserId: string;
  action: DataAccessAction;
  resourceType: string;
  resourceId: string | null;
  metadata: DataAccessAuditMetadata;
  createdAt: Date;
}

export interface DataAccessAuditMetadata {
  ipAddress?: string;
  userAgent?: string;
  requestId?: string;
  dataFields?: string[];
  rowCount?: number;
  purpose?: string;
  legalBasis?: string;
}

// ─── Admin Audit Log ──────────────────────────────────────────────────────────

export interface AdminAuditLog {
  id: string;
  actorId: string | null;
  action: string;
  targetType: string;
  targetId: string | null;
  oldValue: unknown;
  newValue: unknown;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: Date;
}

// ─── Data Subject Rights ──────────────────────────────────────────────────────

export type DataSubjectRequestType =
  | "access"
  | "rectification"
  | "erasure"
  | "restriction"
  | "portability"
  | "objection";

export type DataSubjectRequestStatus =
  | "pending"
  | "in_progress"
  | "completed"
  | "rejected"
  | "expired";

export interface DataSubjectRequest {
  id: string;
  tenantId: string;
  subjectUserId: string;
  requestType: DataSubjectRequestType;
  status: DataSubjectRequestStatus;
  description: string;
  response: string | null;
  processedBy: string | null;
  processedAt: Date | null;
  dueDate: Date;
  createdAt: Date;
  updatedAt: Date;
}

// ─── Compliance Report ────────────────────────────────────────────────────────

export interface ComplianceReport {
  tenantId: string;
  generatedAt: Date;
  period: {
    start: Date;
    end: Date;
  };
  summary: ComplianceReportSummary;
  dataProcessingActivities: DataProcessingActivity[];
  dataSubjectRequests: DataSubjectRequestSummary;
  retentionCompliance: RetentionComplianceSummary;
  consentStatus: ConsentStatusSummary;
}

export interface ComplianceReportSummary {
  totalWorkflows: number;
  rexEnabledWorkflows: number;
  averageRexScore: number;
  legalBasisCoverage: number;
  retentionPolicyCompliance: number;
}

export interface DataProcessingActivity {
  workflowId: string;
  workflowName: string;
  purpose: string;
  legalBasis: GdprLegalBasis | DpdpLegalBasis | null;
  dataCategories: DataCategory[];
  executionCount: number;
  lastExecutedAt: Date | null;
}

export interface DataSubjectRequestSummary {
  total: number;
  byType: Record<DataSubjectRequestType, number>;
  byStatus: Record<DataSubjectRequestStatus, number>;
  averageResponseTimeDays: number;
}

export interface RetentionComplianceSummary {
  totalPolicies: number;
  activePolicies: number;
  pendingDeletions: number;
  overdueDeletions: number;
}

export interface ConsentStatusSummary {
  totalUsers: number;
  consentedUsers: number;
  pendingConsent: number;
  withdrawnConsent: number;
}

// ─── CRUD Input Types ─────────────────────────────────────────────────────────

export interface SetLegalBasisInput {
  workflowId: string;
  gdprBasis?: GdprLegalBasis;
  dpdpBasis?: DpdpLegalBasis;
  purposeDescription: string;
  dataCategories: DataCategory[];
  crossBorderTransfer?: boolean;
  transferSafeguards?: string;
  retentionDays?: number;
}

export interface RecordConsentInput {
  consentType: ConsentType;
  policyVersion: string;
  granted: boolean;
  metadata?: ConsentMetadata;
}

export interface CreateRetentionPolicyInput {
  resourceType: RetentionResourceType;
  retentionDays: number;
  config?: RetentionPolicyConfig;
}

export interface CreateDataSubjectRequestInput {
  requestType: DataSubjectRequestType;
  description: string;
}

export interface ProcessDataSubjectRequestInput {
  requestId: string;
  status: DataSubjectRequestStatus;
  response?: string;
}

export interface GenerateComplianceReportInput {
  startDate: Date;
  endDate: Date;
  includeDetails?: boolean;
}
