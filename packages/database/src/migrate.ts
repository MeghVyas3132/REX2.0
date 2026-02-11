// ──────────────────────────────────────────────
// REX - Database Migration Runner
// ──────────────────────────────────────────────

import { migrate } from "drizzle-orm/postgres-js/migrator";
import { getDatabase, closeConnection } from "./connection.js";

async function runMigrations() {
  const databaseUrl = process.env["DATABASE_URL"];
  if (!databaseUrl) {
    throw new Error("DATABASE_URL is required for migrations");
  }

  console.log("Running migrations...");
  const db = getDatabase(databaseUrl);
  await migrate(db, { migrationsFolder: "./drizzle" });
  console.log("Migrations completed successfully");
  await closeConnection();
  process.exit(0);
}

runMigrations().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
