// ──────────────────────────────────────────────
// REX - Database Seed: 10 Example Workflows
// Usage: npx tsx src/seed.ts
// ──────────────────────────────────────────────

import { getDatabase, closeConnection } from "./connection";
import { and, eq } from "drizzle-orm";
import {
  adminAuditLog,
  pluginCatalogue,
  tenantPlans,
  tenantPlugins,
  tenants,
  tenantUsers,
  users,
  workflows,
} from "./schema";

const DEFAULT_TENANT_ID = "00000000-0000-0000-0000-000000000001";

async function seed() {
  const databaseUrl = process.env["DATABASE_URL"];
  if (!databaseUrl) {
    throw new Error("DATABASE_URL env var is required");
  }

  const db = getDatabase(databaseUrl);

  console.log("[seed] seeding database...");

  // Pre-computed bcrypt hash for "demo1234" (10 rounds)
  // In production the auth service uses bcrypt.hash() at registration time.
  const bcryptHash =
    "$2b$10$4pqHG6k2KK22UYQUwNUSKObvQnoMJ0vAz4Sn4Et7DoCSNaMsVKv/S";

  await db
    .insert(tenants)
    .values({
      id: DEFAULT_TENANT_ID,
      name: "Default Tenant",
      slug: "default",
      planTier: "enterprise",
      settings: {},
      isActive: true,
    })
    .onConflictDoNothing();

  const seededUsers = [
    {
      email: "admin@rex.dev",
      name: "REX Super Admin",
      role: "admin",
      globalRole: "super_admin",
      tenantRole: "org_admin",
      interfaceAccess: "both",
    },
    {
      email: "studio@rex.dev",
      name: "Studio Builder",
      role: "editor",
      globalRole: "user",
      tenantRole: "org_editor",
      interfaceAccess: "studio",
    },
    {
      email: "business@rex.dev",
      name: "Business Operator",
      role: "viewer",
      globalRole: "user",
      tenantRole: "org_viewer",
      interfaceAccess: "business",
    },
    {
      email: "demo@rex.dev",
      name: "Demo User",
      role: "editor",
      globalRole: "user",
      tenantRole: "org_editor",
      interfaceAccess: "both",
    },
  ] as const;

  const userByEmail = new Map<string, { id: string }>();
  for (const seedUser of seededUsers) {
    const [insertedUser] = await db
      .insert(users)
      .values({
        email: seedUser.email,
        name: seedUser.name,
        passwordHash: bcryptHash,
        role: seedUser.role,
        globalRole: seedUser.globalRole,
      })
      .onConflictDoNothing()
      .returning({ id: users.id });

    const userRecord =
      insertedUser ??
      (await db
        .select({ id: users.id })
        .from(users)
        .where(eq(users.email, seedUser.email))
        .limit(1))[0];

    if (!userRecord) {
      throw new Error(`Failed to resolve user ${seedUser.email}`);
    }

    userByEmail.set(seedUser.email, userRecord);
  }

  const adminUserId = userByEmail.get("admin@rex.dev")?.id;
  if (!adminUserId) {
    throw new Error("Failed to resolve super admin user");
  }

  for (const seedUser of seededUsers) {
    const userId = userByEmail.get(seedUser.email)?.id;
    if (!userId) continue;

    await db
      .insert(tenantUsers)
      .values({
        tenantId: DEFAULT_TENANT_ID,
        userId,
        tenantRole: seedUser.tenantRole,
        interfaceAccess: seedUser.interfaceAccess,
        abacAttributes: {},
        isActive: true,
        invitedBy: userId === adminUserId ? null : adminUserId,
      })
      .onConflictDoUpdate({
        target: [tenantUsers.tenantId, tenantUsers.userId],
        set: {
          tenantRole: seedUser.tenantRole,
          interfaceAccess: seedUser.interfaceAccess,
          isActive: true,
        },
      });
  }

  await db
    .insert(tenantPlans)
    .values({
      tenantId: DEFAULT_TENANT_ID,
      planName: "enterprise",
      allowedNodeTypes: [],
      allowedPluginSlugs: ["http", "slack", "salesforce"],
      maxWorkflows: 200,
      maxExecutionsPerMonth: 200000,
      maxKnowledgeCorpora: 100,
      maxUsers: 200,
      maxApiKeys: 100,
      customLimits: {},
    })
    .onConflictDoUpdate({
      target: tenantPlans.tenantId,
      set: {
        planName: "enterprise",
        allowedPluginSlugs: ["http", "slack", "salesforce"],
        maxWorkflows: 200,
        maxExecutionsPerMonth: 200000,
        maxKnowledgeCorpora: 100,
        maxUsers: 200,
        maxApiKeys: 100,
      },
    });

  const catalogueSeed = [
    {
      slug: "http",
      name: "HTTP Node",
      description: "Generic HTTP request node",
      category: "developer",
      version: "1.0.0",
      isPublic: true,
      isBuiltin: true,
      manifest: { type: "developer", actions: ["request"] },
    },
    {
      slug: "slack",
      name: "Slack",
      description: "Send Slack notifications",
      category: "communication",
      version: "1.0.0",
      isPublic: true,
      isBuiltin: true,
      manifest: { type: "communication", actions: ["send_message"] },
    },
    {
      slug: "salesforce",
      name: "Salesforce",
      description: "Sync CRM records",
      category: "business_crm",
      version: "1.0.0",
      isPublic: false,
      isBuiltin: false,
      manifest: { type: "business_crm", actions: ["upsert_contact"] },
    },
  ] as const;

  for (const plugin of catalogueSeed) {
    await db
      .insert(pluginCatalogue)
      .values({
        slug: plugin.slug,
        name: plugin.name,
        description: plugin.description,
        category: plugin.category,
        version: plugin.version,
        manifest: plugin.manifest,
        isPublic: plugin.isPublic,
        isBuiltin: plugin.isBuiltin,
        isActive: true,
      })
      .onConflictDoUpdate({
        target: pluginCatalogue.slug,
        set: {
          name: plugin.name,
          description: plugin.description,
          category: plugin.category,
          version: plugin.version,
          manifest: plugin.manifest,
          isPublic: plugin.isPublic,
          isBuiltin: plugin.isBuiltin,
          isActive: true,
          updatedAt: new Date(),
        },
      });

    await db
      .insert(tenantPlugins)
      .values({
        tenantId: DEFAULT_TENANT_ID,
        pluginSlug: plugin.slug,
        isEnabled: true,
        byokConfig: {},
        configOverrides: {},
        enabledBy: adminUserId,
      })
      .onConflictDoUpdate({
        target: [tenantPlugins.tenantId, tenantPlugins.pluginSlug],
        set: { isEnabled: true },
      });
  }

  await db.insert(adminAuditLog).values({
    actorId: adminUserId,
    action: "seed.completed",
    targetType: "tenant",
    targetId: DEFAULT_TENANT_ID,
    oldValue: null,
    newValue: { seededUsers: seededUsers.map((u) => u.email) },
  });

  const workflowOwnerId = userByEmail.get("studio@rex.dev")?.id ?? userByEmail.get("demo@rex.dev")?.id;
  if (!workflowOwnerId) {
    throw new Error("Failed to resolve workflow owner user");
  }

  // ─── Workflow Definitions ──────────────────────────

  const workflowDefs = [
    // 1. Smart Form Cleaner
    {
      name: "Smart Form Cleaner",
      description: "Cleans and normalizes incoming form submissions",
      nodes: [
        { id: "trigger", type: "webhook_trigger", label: "Form Webhook", position: { x: 100, y: 80 }, config: {} },
        { id: "clean", type: "data_cleaner", label: "Normalize Fields", position: { x: 100, y: 200 }, config: { operations: ["trim", "normalizeCase"], caseType: "lower" } },
        { id: "validate", type: "json_validator", label: "Validate Schema", position: { x: 100, y: 320 }, config: { requiredFields: ["name", "email"], strict: false } },
        { id: "store", type: "storage", label: "Save Submission", position: { x: 100, y: 440 }, config: { operation: "write", key: "form_{{trigger.id}}" } },
        { id: "done", type: "log", label: "Log Result", position: { x: 100, y: 560 }, config: { level: "info", message: "Form processed" } },
      ],
      edges: [
        { id: "e1", source: "trigger", target: "clean" },
        { id: "e2", source: "clean", target: "validate" },
        { id: "e3", source: "validate", target: "store" },
        { id: "e4", source: "store", target: "done" },
      ],
    },
    // 2. Resume Bullet Enhancer
    {
      name: "Resume Bullet Enhancer",
      description: "Rewrites resume bullet points using LLM",
      nodes: [
        { id: "trigger", type: "manual_trigger", label: "Start", position: { x: 100, y: 80 }, config: {} },
        { id: "clean", type: "data_cleaner", label: "Clean Input", position: { x: 100, y: 200 }, config: { operations: ["trim"] } },
        { id: "llm", type: "llm", label: "Enhance Bullets", position: { x: 100, y: 320 }, config: { provider: "gemini", prompt: "Rewrite the following resume bullet points to be more impactful and quantified:\n\n{{clean.data}}", systemPrompt: "You are a professional resume writer." } },
        { id: "log", type: "log", label: "Audit Log", position: { x: 100, y: 440 }, config: { level: "info", message: "Enhanced bullets generated" } },
      ],
      edges: [
        { id: "e1", source: "trigger", target: "clean" },
        { id: "e2", source: "clean", target: "llm" },
        { id: "e3", source: "llm", target: "log" },
      ],
    },
    // 3. CSV Data Cleaner
    {
      name: "CSV Data Cleaner",
      description: "Cleans CSV data via webhook, removes duplicates and special chars",
      nodes: [
        { id: "trigger", type: "webhook_trigger", label: "CSV Webhook", position: { x: 100, y: 80 }, config: {} },
        { id: "clean", type: "data_cleaner", label: "Clean CSV", position: { x: 100, y: 200 }, config: { operations: ["trim", "removeSpecialChars", "removeDuplicates"] } },
        { id: "validate", type: "json_validator", label: "Validate Output", position: { x: 100, y: 320 }, config: { requiredFields: ["rows"], strict: false } },
        { id: "log", type: "log", label: "Done", position: { x: 100, y: 440 }, config: { level: "info", message: "CSV cleaned" } },
      ],
      edges: [
        { id: "e1", source: "trigger", target: "clean" },
        { id: "e2", source: "clean", target: "validate" },
        { id: "e3", source: "validate", target: "log" },
      ],
    },
    // 4. Log Severity Classifier
    {
      name: "Log Severity Classifier",
      description: "Classifies log entries by severity using LLM",
      nodes: [
        { id: "trigger", type: "webhook_trigger", label: "Log Intake", position: { x: 100, y: 80 }, config: {} },
        { id: "clean", type: "data_cleaner", label: "Normalize", position: { x: 100, y: 200 }, config: { operations: ["trim", "normalizeCase"], caseType: "lower" } },
        { id: "llm", type: "llm", label: "Classify Severity", position: { x: 100, y: 320 }, config: { provider: "groq", prompt: "Classify the severity of this log entry as one of: critical, error, warning, info, debug.\n\nLog: {{clean.data}}\n\nRespond with only the severity level.", systemPrompt: "You are a log analysis system." } },
        { id: "store", type: "storage", label: "Store Classification", position: { x: 100, y: 440 }, config: { operation: "write", key: "log_class_{{trigger.id}}" } },
        { id: "log", type: "log", label: "Done", position: { x: 100, y: 560 }, config: { level: "info", message: "Log classified" } },
      ],
      edges: [
        { id: "e1", source: "trigger", target: "clean" },
        { id: "e2", source: "clean", target: "llm" },
        { id: "e3", source: "llm", target: "store" },
        { id: "e4", source: "store", target: "log" },
      ],
    },
    // 5. PII Scrubber
    {
      name: "PII Scrubber",
      description: "Detects and masks PII from incoming data",
      nodes: [
        { id: "trigger", type: "webhook_trigger", label: "Data Intake", position: { x: 100, y: 80 }, config: {} },
        { id: "scrub", type: "data_cleaner", label: "Mask PII", position: { x: 100, y: 200 }, config: { operations: ["maskPII"] } },
        { id: "validate", type: "json_validator", label: "Validate Clean", position: { x: 100, y: 320 }, config: { requiredFields: ["data"], strict: false } },
        { id: "store", type: "storage", label: "Store Cleaned", position: { x: 100, y: 440 }, config: { operation: "write", key: "clean_{{trigger.id}}" } },
        { id: "log", type: "log", label: "Done", position: { x: 100, y: 560 }, config: { level: "info", message: "PII scrubbed" } },
      ],
      edges: [
        { id: "e1", source: "trigger", target: "scrub" },
        { id: "e2", source: "scrub", target: "validate" },
        { id: "e3", source: "validate", target: "store" },
        { id: "e4", source: "store", target: "log" },
      ],
    },
    // 6. Customer Feedback Analyzer
    {
      name: "Customer Feedback Analyzer",
      description: "Analyzes customer feedback sentiment and topics via LLM",
      nodes: [
        { id: "trigger", type: "manual_trigger", label: "Start", position: { x: 100, y: 80 }, config: {} },
        { id: "clean", type: "data_cleaner", label: "Clean Feedback", position: { x: 100, y: 200 }, config: { operations: ["trim", "normalizeCase"], caseType: "lower" } },
        { id: "llm", type: "llm", label: "Analyze Sentiment", position: { x: 100, y: 320 }, config: { provider: "gemini", prompt: "Analyze the following customer feedback. Return a JSON object with fields: sentiment (positive/neutral/negative), confidence (0-1), key_topics (array), summary (one sentence).\n\nFeedback: {{clean.data}}", systemPrompt: "You are a customer feedback analyst. Always respond with valid JSON." } },
        { id: "validate", type: "json_validator", label: "Validate JSON", position: { x: 100, y: 440 }, config: { requiredFields: ["sentiment", "confidence", "key_topics", "summary"], fieldTypes: { sentiment: "string", confidence: "number" }, strict: false } },
        { id: "store", type: "storage", label: "Store Analysis", position: { x: 100, y: 560 }, config: { operation: "write", key: "feedback_analysis_{{trigger.id}}" } },
      ],
      edges: [
        { id: "e1", source: "trigger", target: "clean" },
        { id: "e2", source: "clean", target: "llm" },
        { id: "e3", source: "llm", target: "validate" },
        { id: "e4", source: "validate", target: "store" },
      ],
    },
    // 7. Email Content Standardizer
    {
      name: "Email Content Standardizer",
      description: "Cleans and standardizes email content, validates structure",
      nodes: [
        { id: "trigger", type: "webhook_trigger", label: "Email Webhook", position: { x: 100, y: 80 }, config: {} },
        { id: "clean", type: "data_cleaner", label: "Clean Body", position: { x: 100, y: 200 }, config: { operations: ["trim", "removeSpecialChars"] } },
        { id: "validate", type: "json_validator", label: "Validate Fields", position: { x: 100, y: 320 }, config: { requiredFields: ["subject", "body", "from"], strict: true } },
        { id: "store", type: "storage", label: "Archive", position: { x: 100, y: 440 }, config: { operation: "write", key: "email_{{trigger.id}}" } },
        { id: "log", type: "log", label: "Audit Log", position: { x: 100, y: 560 }, config: { level: "info", message: "Email standardized" } },
      ],
      edges: [
        { id: "e1", source: "trigger", target: "clean" },
        { id: "e2", source: "clean", target: "validate" },
        { id: "e3", source: "validate", target: "store" },
        { id: "e4", source: "store", target: "log" },
      ],
    },
    // 8. API Payload Sanitizer
    {
      name: "API Payload Sanitizer",
      description: "Sanitizes incoming API payloads, validates JSON, masks sensitive data",
      nodes: [
        { id: "trigger", type: "webhook_trigger", label: "API Endpoint", position: { x: 100, y: 80 }, config: {} },
        { id: "validate_in", type: "json_validator", label: "Validate Input", position: { x: 100, y: 200 }, config: { requiredFields: ["action", "data"], strict: false } },
        { id: "clean", type: "data_cleaner", label: "Sanitize", position: { x: 100, y: 320 }, config: { operations: ["trim", "maskPII", "validateJson"] } },
        { id: "validate_out", type: "json_validator", label: "Validate Output", position: { x: 100, y: 440 }, config: { requiredFields: ["action", "data"], strict: true } },
        { id: "log", type: "log", label: "Audit Log", position: { x: 100, y: 560 }, config: { level: "info", message: "Payload sanitized" } },
      ],
      edges: [
        { id: "e1", source: "trigger", target: "validate_in" },
        { id: "e2", source: "validate_in", target: "clean" },
        { id: "e3", source: "clean", target: "validate_out" },
        { id: "e4", source: "validate_out", target: "log" },
      ],
    },
    // 9. AI Data Enrichment Pipeline
    {
      name: "AI Data Enrichment Pipeline",
      description: "Enriches sparse data records using LLM inference",
      nodes: [
        { id: "trigger", type: "manual_trigger", label: "Start", position: { x: 100, y: 80 }, config: {} },
        { id: "clean", type: "data_cleaner", label: "Normalize Input", position: { x: 100, y: 200 }, config: { operations: ["trim", "normalizeCase"], caseType: "lower" } },
        { id: "llm", type: "llm", label: "Enrich Data", position: { x: 100, y: 320 }, config: { provider: "gemini", prompt: "Given the following partial record, infer and fill in missing fields. Return a complete JSON object.\n\nPartial record: {{clean.data}}", systemPrompt: "You are a data enrichment system. Always return valid JSON." } },
        { id: "validate", type: "json_validator", label: "Validate Enriched", position: { x: 100, y: 440 }, config: { requiredFields: [], strict: false } },
        { id: "store", type: "storage", label: "Store Enriched", position: { x: 100, y: 560 }, config: { operation: "write", key: "enriched_{{trigger.id}}" } },
        { id: "log", type: "log", label: "Done", position: { x: 100, y: 680 }, config: { level: "info", message: "Data enriched" } },
      ],
      edges: [
        { id: "e1", source: "trigger", target: "clean" },
        { id: "e2", source: "clean", target: "llm" },
        { id: "e3", source: "llm", target: "validate" },
        { id: "e4", source: "validate", target: "store" },
        { id: "e5", source: "store", target: "log" },
      ],
    },
    // 10. Incident Report Processor
    {
      name: "Incident Report Processor",
      description: "Processes incident reports: cleans, classifies priority, stores",
      nodes: [
        { id: "trigger", type: "webhook_trigger", label: "Incident Intake", position: { x: 100, y: 80 }, config: {} },
        { id: "clean", type: "data_cleaner", label: "Clean Report", position: { x: 100, y: 200 }, config: { operations: ["trim", "removeSpecialChars"] } },
        { id: "llm", type: "llm", label: "Classify Priority", position: { x: 100, y: 320 }, config: { provider: "groq", prompt: "Classify the priority of this incident report as: P0 (critical), P1 (high), P2 (medium), P3 (low). Also provide a one-line summary.\n\nReport: {{clean.data}}\n\nRespond as JSON: {\"priority\": \"P0\", \"summary\": \"...\"}", systemPrompt: "You are an incident management system." } },
        { id: "validate", type: "json_validator", label: "Validate Classification", position: { x: 100, y: 440 }, config: { requiredFields: ["priority", "summary"], fieldTypes: { priority: "string", summary: "string" }, strict: true } },
        { id: "store", type: "storage", label: "Store Incident", position: { x: 100, y: 560 }, config: { operation: "write", key: "incident_{{trigger.id}}" } },
        { id: "log", type: "log", label: "Notify", position: { x: 100, y: 680 }, config: { level: "warn", message: "Incident processed and classified" } },
      ],
      edges: [
        { id: "e1", source: "trigger", target: "clean" },
        { id: "e2", source: "clean", target: "llm" },
        { id: "e3", source: "llm", target: "validate" },
        { id: "e4", source: "validate", target: "store" },
        { id: "e5", source: "store", target: "log" },
      ],
    },
  ];

  for (const wf of workflowDefs) {
    const [existing] = await db
      .select({ id: workflows.id })
      .from(workflows)
      .where(
        and(
          eq(workflows.tenantId, DEFAULT_TENANT_ID),
          eq(workflows.userId, workflowOwnerId),
          eq(workflows.name, wf.name)
        )
      )
      .limit(1);

    if (existing) {
      console.log(`[seed] workflow already exists: ${wf.name}`);
      continue;
    }

    await db.insert(workflows).values({
      tenantId: DEFAULT_TENANT_ID,
      userId: workflowOwnerId,
      name: wf.name,
      description: wf.description,
      status: "active",
      nodes: wf.nodes,
      edges: wf.edges,
      version: 1,
    });
    console.log(`[seed] created workflow: ${wf.name}`);
  }

  console.log("[seed] done. Seeded role users with password demo1234:");
  console.log("[seed] - admin@rex.dev (super_admin)");
  console.log("[seed] - studio@rex.dev (org_editor / studio)");
  console.log("[seed] - business@rex.dev (org_viewer / business)");
  console.log("[seed] - demo@rex.dev (org_editor / both)");
  await closeConnection();
  process.exit(0);
}

seed().catch((err) => {
  console.error("[seed] failed:", err);
  process.exit(1);
});
