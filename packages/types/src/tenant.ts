// ──────────────────────────────────────────────
// REX - Multi-tenancy Types
// ──────────────────────────────────────────────

import type { TenantRole, InterfaceAccess } from "./auth.js";

// ─── Plan Tiers ───────────────────────────────────────────────────────────────

export type PlanTier = "starter" | "pro" | "enterprise" | "custom";

// ─── Tenant Types ─────────────────────────────────────────────────────────────

export interface Tenant {
  id: string;
  name: string;
  slug: string;
  planTier: PlanTier;
  isActive: boolean;
  settings: TenantSettings;
  dataResidencyCountry: string | null;
  dataResidencyRegion: string | null;
  gdprDpaContact: string | null;
  dpdpDataFiduciaryName: string | null;
  createdBy: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface TenantSettings {
  branding?: {
    primaryColor?: string;
    logo?: string;
    favicon?: string;
  };
  features?: {
    enableRexScoring?: boolean;
    enableBusinessMode?: boolean;
    enableExternalIntegrations?: boolean;
  };
  defaults?: {
    defaultInterface?: InterfaceAccess;
    defaultLlmProvider?: string;
  };
}

export interface TenantUser {
  id: string;
  tenantId: string;
  userId: string;
  tenantRole: TenantRole;
  interfaceAccess: InterfaceAccess;
  abacAttributes: Record<string, unknown>;
  isActive: boolean;
  invitedBy: string | null;
  createdAt: Date;
}

export interface TenantPlan {
  id: string;
  tenantId: string;
  planName: string;
  allowedNodeTypes: string[];
  allowedPluginSlugs: string[];
  maxWorkflows: number;
  maxExecutionsPerMonth: number;
  maxKnowledgeCorpora: number;
  maxUsers: number;
  maxApiKeys: number;
  customLimits: Record<string, number>;
  validFrom: Date;
  validUntil: Date | null;
  createdAt: Date;
}

// ─── Plugin Types ─────────────────────────────────────────────────────────────

export type PluginCategory =
  | "ai_llm"
  | "data_storage"
  | "communication"
  | "business_crm"
  | "logic_control"
  | "trigger"
  | "compliance_rex"
  | "developer";

export interface PluginByokConfig {
  required: boolean;
  scope: "org" | "user" | "system";
  label: string;
  envKey: string;
  description?: string;
}

export interface PluginIOSchema {
  type: "object";
  properties: Record<
    string,
    {
      type: string;
      title: string;
      description?: string;
      required?: boolean;
      enum?: unknown[];
      default?: unknown;
      sensitive?: boolean;
    }
  >;
  required?: string[];
}

export interface PluginManifest {
  slug: string;
  name: string;
  description: string;
  category: PluginCategory;
  version: string;
  icon?: string;
  byok?: PluginByokConfig;
  inputSchema: PluginIOSchema;
  outputSchema: PluginIOSchema;
  rexHints: PluginRexHints;
  businessLabel?: string;
  businessDescription?: string;
  isAllowedInBusinessMode: boolean;

  // Legacy shape retained for compatibility with existing callers.
  nodeType?: string;
  inputs?: PluginPortDefinition[];
  outputs?: PluginPortDefinition[];
  configSchema?: Record<string, unknown>;
}

export interface PluginPortDefinition {
  name: string;
  type: string;
  required: boolean;
  description?: string;
}

export interface PluginRexHints {
  responsibleScore: number;
  ethicalScore: number;
  explainableScore: number;
  dataCategories: string[];
  gdprLawfulBasisRequired: boolean;
  piiRisk: "none" | "low" | "medium" | "high";
  crossBorderRisk: boolean;
  auditRequired: boolean;

  // Legacy fields retained for compatibility.
  defaultRScore?: number;
  defaultEScore?: number;
  defaultXScore?: number;
  requiresHumanReview?: boolean;
  sensitiveDataCategories?: string[];
  retentionCategory?: string;
}

export interface PluginCatalogue {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  category: PluginCategory;
  version: string;
  manifest: PluginManifest;
  isPublic: boolean;
  isBuiltin: boolean;
  isActive: boolean;
  rexHints: PluginRexHints;
  createdAt: Date;
  updatedAt: Date;
}

export interface TenantPlugin {
  id: string;
  tenantId: string;
  pluginSlug: string;
  isEnabled: boolean;
  byokConfig: ByokConfig;
  configOverrides: Record<string, unknown>;
  enabledBy: string | null;
  createdAt: Date;
}

export interface ByokConfig {
  apiKeyId?: string;
  customEndpoint?: string;
  customHeaders?: Record<string, string>;
}

// ─── Data Residency Types ─────────────────────────────────────────────────────

export type DataResidencyEnforcement = "warn" | "block";

export interface TenantDataResidency {
  id: string;
  tenantId: string;
  countryCode: string;
  allowedRegions: string[];
  blockedProviderEndpoints: string[];
  enforcement: DataResidencyEnforcement;
  appliesTo: string[];
  createdAt: Date;
}

// ─── CRUD Input Types ─────────────────────────────────────────────────────────

export interface CreateTenantInput {
  name: string;
  slug: string;
  planTier?: PlanTier;
  settings?: Partial<TenantSettings>;
  dataResidencyCountry?: string;
}

export interface UpdateTenantInput {
  name?: string;
  planTier?: PlanTier;
  isActive?: boolean;
  settings?: Partial<TenantSettings>;
  dataResidencyCountry?: string;
  dataResidencyRegion?: string;
  gdprDpaContact?: string;
  dpdpDataFiduciaryName?: string;
}

export interface InviteTenantUserInput {
  email: string;
  tenantRole: TenantRole;
  interfaceAccess?: InterfaceAccess;
  abacAttributes?: Record<string, unknown>;
}

export interface UpdateTenantUserInput {
  tenantRole?: TenantRole;
  interfaceAccess?: InterfaceAccess;
  abacAttributes?: Record<string, unknown>;
  isActive?: boolean;
}

export interface EnablePluginInput {
  pluginSlug: string;
  byokConfig?: ByokConfig;
  configOverrides?: Record<string, unknown>;
}

export interface SetDataResidencyInput {
  countryCode: string;
  allowedRegions?: string[];
  blockedProviderEndpoints?: string[];
  enforcement?: DataResidencyEnforcement;
  appliesTo?: string[];
}
