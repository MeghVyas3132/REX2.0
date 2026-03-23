// ──────────────────────────────────────────────
// REX - Database Package
// ──────────────────────────────────────────────

export * from "./schema/index.js";
export { getDatabase, createConnection, closeConnection } from "./connection.js";
export type { Database } from "./connection.js";

// Tenant isolation helpers
export {
  withTenant,
  hasTenantId,
  assertTenantMatch,
  TenantIsolationError,
  type TenantScopedTable,
} from "./helpers/withTenant.js";
