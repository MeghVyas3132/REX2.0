import type { PluginManifest } from "@rex/types";

export interface AuditEvent {
  type: string;
  message: string;
  metadata?: Record<string, unknown>;
  createdAt?: string;
}

export interface ExecutionContext {
  workflowId: string;
  executionId: string;
  nodeId: string;

  tenantId: string;
  tenantConfig: {
    dataResidencyRegion?: string;
    allowedProviderEndpoints?: string[];
    blockedProviderEndpoints?: string[];
    dataRetentionDays?: number;
  };

  resolveByok: (envKey: string) => Promise<string>;

  rex: {
    logDataAccess: (dataCategory: string, piiFields?: string[]) => void;
    assertConsentPresent: () => Promise<void>;
    emitExplanation: (explanation: string) => void;
  };

  auditLog: (event: AuditEvent) => Promise<void>;

  // Backward-compatible fields used by existing built-in nodes.
  userId?: string;
  correlationId?: string;
  logger?: {
    info: (message: string, data?: Record<string, unknown>) => void;
    warn: (message: string, data?: Record<string, unknown>) => void;
    error: (message: string, data?: Record<string, unknown>) => void;
    debug: (message: string, data?: Record<string, unknown>) => void;
  };
  getApiKey?: (provider: "gemini" | "groq") => Promise<string>;
}

export type NodeExecutorFn = (
  input: Record<string, unknown>,
  context: ExecutionContext
) => Promise<Record<string, unknown>>;

export interface RegisteredPlugin {
  manifest: PluginManifest;
  executor: NodeExecutorFn;
}

export class PluginRegistry {
  private readonly plugins = new Map<string, RegisteredPlugin>();

  register(manifest: PluginManifest, executor: NodeExecutorFn): void {
    this.plugins.set(manifest.slug, { manifest, executor });
  }

  get(slug: string): RegisteredPlugin | undefined {
    return this.plugins.get(slug);
  }

  list(): RegisteredPlugin[] {
    return Array.from(this.plugins.values());
  }

  listForTenant(allowedSlugs: string[]): RegisteredPlugin[] {
    if (allowedSlugs.length === 0) return this.list();
    return allowedSlugs
      .map((slug) => this.plugins.get(slug))
      .filter((item): item is RegisteredPlugin => Boolean(item));
  }

  clear(): void {
    this.plugins.clear();
  }
}

export const globalRegistry = new PluginRegistry();