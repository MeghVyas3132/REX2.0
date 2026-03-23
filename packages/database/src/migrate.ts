// ──────────────────────────────────────────────
// REX - Database Migration Runner
// ──────────────────────────────────────────────

import { migrate } from "drizzle-orm/postgres-js/migrator";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { getDatabase, closeConnection } from "./connection.js";

async function runMigrations() {
  const databaseUrl = process.env["DATABASE_URL"];
  if (!databaseUrl) {
    throw new Error("DATABASE_URL is required for migrations");
  }

  const migrationsFolder = resolve(
    dirname(fileURLToPath(import.meta.url)),
    "../drizzle"
  );

  console.log("Running migrations...");
  const db = getDatabase(databaseUrl);
  await migrate(db, { migrationsFolder });
  console.log("Migrations completed successfully");
  await closeConnection();
  process.exit(0);
}

runMigrations().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
