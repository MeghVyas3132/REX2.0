import { and, eq } from "drizzle-orm";
import type { Database } from "@rex/database";
import { createLogger } from "@rex/utils";
import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";
import { pgTable, uuid, varchar, boolean, jsonb } from "drizzle-orm/pg-core";

const logger = createLogger("byok-service");

const pluginCatalogue = pgTable("plugin_catalogue", {
  slug: varchar("slug", { length: 100 }).notNull(),
  manifest: jsonb("manifest").notNull(),
});

const tenantPlugins = pgTable("tenant_plugins", {
  id: uuid("id").defaultRandom().primaryKey(),
  tenantId: uuid("tenant_id").notNull(),
  pluginSlug: varchar("plugin_slug", { length: 100 }).notNull(),
  isEnabled: boolean("is_enabled").default(true).notNull(),
  byokConfig: jsonb("byok_config").notNull(),
});

interface EncryptedByokValue {
  ciphertext: string;
  iv: string;
  tag: string;
  keyVersion: number;
}

type ByokConfigRecord = Record<string, EncryptedByokValue>;

function getMasterKeyBuffer(): Buffer {
  const hex = process.env.REX_MASTER_KEY ?? process.env.ENCRYPTION_MASTER_KEY;
  if (!hex) {
    throw new Error("Missing REX_MASTER_KEY (or ENCRYPTION_MASTER_KEY fallback)");
  }

  const key = Buffer.from(hex, "hex");
  if (key.length !== 32) {
    throw new Error("REX_MASTER_KEY must be 64 hex chars (32 bytes)");
  }
  return key;
}

function encryptByokValue(rawValue: string): EncryptedByokValue {
  const key = getMasterKeyBuffer();
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const encrypted = Buffer.concat([cipher.update(rawValue, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();

  return {
    ciphertext: encrypted.toString("base64"),
    iv: iv.toString("base64"),
    tag: tag.toString("base64"),
    keyVersion: 1,
  };
}

function decryptByokValue(value: EncryptedByokValue): string {
  const key = getMasterKeyBuffer();
  const decipher = createDecipheriv(
    "aes-256-gcm",
    key,
    Buffer.from(value.iv, "base64")
  );
  decipher.setAuthTag(Buffer.from(value.tag, "base64"));

  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(value.ciphertext, "base64")),
    decipher.final(),
  ]);

  return decrypted.toString("utf8");
}

async function resolvePluginSlugByEnvKey(
  db: Database,
  envKey: string
): Promise<string> {
  const rows = await db.select().from(pluginCatalogue);
  const found = rows.find((row) => {
    const manifest = row.manifest as { byok?: { envKey?: string } };
    return manifest.byok?.envKey === envKey;
  });

  if (!found) {
    throw new Error(`No plugin manifest found for env key ${envKey}`);
  }

  return found.slug;
}

function asByokConfig(value: unknown): ByokConfigRecord {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }
  return value as ByokConfigRecord;
}

export class ByokService {
  constructor(private readonly db: Database) {}

  async storeKey(tenantId: string, envKey: string, rawValue: string): Promise<void> {
    const pluginSlug = await resolvePluginSlugByEnvKey(this.db, envKey);
    const encrypted = encryptByokValue(rawValue);

    const [existing] = await this.db
      .select()
      .from(tenantPlugins)
      .where(and(eq(tenantPlugins.tenantId, tenantId), eq(tenantPlugins.pluginSlug, pluginSlug)))
      .limit(1);

    if (!existing) {
      await this.db.insert(tenantPlugins).values({
        tenantId,
        pluginSlug,
        isEnabled: true,
        byokConfig: {
          [envKey]: encrypted,
        },
      });
      return;
    }

    const current = asByokConfig(existing.byokConfig);
    await this.db
      .update(tenantPlugins)
      .set({
        byokConfig: {
          ...current,
          [envKey]: encrypted,
        },
      })
      .where(eq(tenantPlugins.id, existing.id));

    logger.info({ tenantId, pluginSlug, envKey }, "Stored BYOK key");
  }

  async resolveKey(tenantId: string, envKey: string): Promise<string> {
    const pluginSlug = await resolvePluginSlugByEnvKey(this.db, envKey);
    const [row] = await this.db
      .select()
      .from(tenantPlugins)
      .where(and(eq(tenantPlugins.tenantId, tenantId), eq(tenantPlugins.pluginSlug, pluginSlug)))
      .limit(1);

    if (!row) {
      throw new Error(`No tenant plugin configuration found for ${pluginSlug}`);
    }

    const config = asByokConfig(row.byokConfig);
    const encrypted = config[envKey];
    if (!encrypted) {
      throw new Error(`BYOK key ${envKey} is not configured for tenant`);
    }

    return decryptByokValue(encrypted);
  }

  async deleteKey(tenantId: string, envKey: string): Promise<void> {
    const pluginSlug = await resolvePluginSlugByEnvKey(this.db, envKey);
    const [row] = await this.db
      .select()
      .from(tenantPlugins)
      .where(and(eq(tenantPlugins.tenantId, tenantId), eq(tenantPlugins.pluginSlug, pluginSlug)))
      .limit(1);

    if (!row) return;

    const config = asByokConfig(row.byokConfig);
    delete config[envKey];

    await this.db
      .update(tenantPlugins)
      .set({ byokConfig: config })
      .where(eq(tenantPlugins.id, row.id));
  }

  async rotateKey(tenantId: string, envKey: string, newValue: string): Promise<void> {
    await this.storeKey(tenantId, envKey, newValue);
  }

  async testKey(
    tenantId: string,
    pluginSlug: string
  ): Promise<{ valid: boolean; error?: string }> {
    const [plugin] = await this.db
      .select()
      .from(pluginCatalogue)
      .where(eq(pluginCatalogue.slug, pluginSlug))
      .limit(1);

    if (!plugin) {
      return { valid: false, error: "Plugin not found" };
    }

    const manifest = plugin.manifest as { byok?: { envKey?: string } };
    const envKey = manifest.byok?.envKey;
    if (!envKey) {
      return { valid: true };
    }

    try {
      const resolved = await this.resolveKey(tenantId, envKey);
      if (!resolved || resolved.length < 8) {
        return { valid: false, error: "Key format appears invalid" };
      }
      return { valid: true };
    } catch (error) {
      return {
        valid: false,
        error: error instanceof Error ? error.message : "Unable to verify key",
      };
    }
  }
}

export function createByokService(db: Database): ByokService {
  return new ByokService(db);
}