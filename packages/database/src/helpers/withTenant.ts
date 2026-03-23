// ──────────────────────────────────────────────
// REX - Tenant Query Helper
// CRITICAL: All tenant-scoped queries MUST use this helper
// ──────────────────────────────────────────────

import { eq, and, SQL } from "drizzle-orm";
import type { PgColumn, PgTable } from "drizzle-orm/pg-core";

/**
 * withTenant - Creates a tenant-scoped WHERE clause
 *
 * USAGE:
 *   db.select().from(workflows).where(withTenant(workflows, tenantId))
 *   db.select().from(workflows).where(withTenant(workflows, tenantId, eq(workflows.status, 'active')))
 *
 * This helper MUST be used for ALL queries to tenant-scoped tables.
 * Failure to use this helper is a security violation.
 */
export function withTenant<T extends { tenantId: PgColumn<any> }>(
  table: T,
  tenantId: string,
  additionalWhere?: SQL
): SQL {
  const tenantFilter = eq(table.tenantId, tenantId);
  return additionalWhere ? and(tenantFilter, additionalWhere)! : tenantFilter;
}

/**
 * Type guard to check if a table has tenantId column
 */
export function hasTenantId<T extends PgTable>(
  table: T
): table is T & { tenantId: PgColumn<any> } {
  return "tenantId" in table;
}

/**
 * Tenant-scoped table type helper
 */
export type TenantScopedTable = PgTable & { tenantId: PgColumn<any> };

/**
 * assertTenantMatch - Validates that a resource belongs to the expected tenant
 * Throws an error if the tenant IDs don't match
 */
export function assertTenantMatch(
  resourceTenantId: string,
  expectedTenantId: string,
  resourceType: string
): void {
  if (resourceTenantId !== expectedTenantId) {
    throw new TenantIsolationError(
      `${resourceType} does not belong to the current tenant`
    );
  }
}

/**
 * TenantIsolationError - Thrown when tenant isolation is violated
 */
export class TenantIsolationError extends Error {
  readonly code = "TENANT_ISOLATION_VIOLATION";
  readonly statusCode = 403;

  constructor(message: string) {
    super(message);
    this.name = "TenantIsolationError";
  }
}
