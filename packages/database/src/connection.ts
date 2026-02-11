// ──────────────────────────────────────────────
// REX - Database Connection
// ──────────────────────────────────────────────

import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema/index.js";

let connectionInstance: ReturnType<typeof postgres> | null = null;
let dbInstance: ReturnType<typeof drizzle<typeof schema>> | null = null;

export function createConnection(databaseUrl: string) {
  if (connectionInstance) return connectionInstance;
  connectionInstance = postgres(databaseUrl, {
    max: 20,
    idle_timeout: 20,
    connect_timeout: 10,
  });
  return connectionInstance;
}

export function getDatabase(databaseUrl: string) {
  if (dbInstance) return dbInstance;
  const connection = createConnection(databaseUrl);
  dbInstance = drizzle(connection, { schema });
  return dbInstance;
}

export type Database = ReturnType<typeof getDatabase>;

export async function closeConnection(): Promise<void> {
  if (connectionInstance) {
    await connectionInstance.end();
    connectionInstance = null;
    dbInstance = null;
  }
}
