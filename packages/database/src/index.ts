// ──────────────────────────────────────────────
// REX - Database Package
// ──────────────────────────────────────────────

export * from "./schema/index.js";
export { getDatabase, createConnection, closeConnection } from "./connection.js";
export type { Database } from "./connection.js";
