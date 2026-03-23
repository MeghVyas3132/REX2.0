// ──────────────────────────────────────────────
// REX - API Key Service
// ──────────────────────────────────────────────

import { eq, and } from "drizzle-orm";
import type { Database } from "@rex/database";
import { apiKeys } from "@rex/database";
import { encrypt, decrypt, createLogger, loadConfig } from "@rex/utils";
import type { ApiProviderType } from "@rex/types";
import { DEFAULT_TENANT_ID } from "./tenant-default.js";

const logger = createLogger("apikey-service");

export interface ApiKeyService {
  storeKey(userId: string, provider: ApiProviderType, key: string, label: string, tenantId?: string): Promise<{ id: string }>;
  getDecryptedKey(userId: string, provider: ApiProviderType, tenantId?: string): Promise<string>;
  listKeys(userId: string, tenantId?: string): Promise<Array<{ id: string; provider: string; label: string; createdAt: Date }>>;
  deleteKey(userId: string, keyId: string, tenantId?: string): Promise<void>;
}

export function createApiKeyService(db: Database): ApiKeyService {
  const config = loadConfig();

  return {
    async storeKey(userId, provider, key, label, tenantId = DEFAULT_TENANT_ID) {
      logger.info({ userId, provider, label }, "Storing API key");

      const encryptedKey = encrypt(key, config.encryption.masterKey);

      const [result] = await db
        .insert(apiKeys)
        .values({ tenantId, userId, provider, encryptedKey, label })
        .returning({ id: apiKeys.id });

      if (!result) {
        throw new Error("Failed to store API key");
      }

      logger.info({ userId, provider, keyId: result.id }, "API key stored");
      return result;
    },

    async getDecryptedKey(userId, provider, tenantId = DEFAULT_TENANT_ID) {
      const [key] = await db
        .select()
        .from(apiKeys)
        .where(and(eq(apiKeys.userId, userId), eq(apiKeys.provider, provider), eq(apiKeys.tenantId, tenantId)))
        .limit(1);

      if (!key) {
        throw new Error(
          `No ${provider} API key found. Please add your ${provider} API key in settings.`
        );
      }

      return decrypt(key.encryptedKey, config.encryption.masterKey);
    },

    async listKeys(userId, tenantId = DEFAULT_TENANT_ID) {
      const keys = await db
        .select({
          id: apiKeys.id,
          provider: apiKeys.provider,
          label: apiKeys.label,
          createdAt: apiKeys.createdAt,
        })
        .from(apiKeys)
        .where(and(eq(apiKeys.userId, userId), eq(apiKeys.tenantId, tenantId)));

      return keys;
    },

    async deleteKey(userId, keyId, tenantId = DEFAULT_TENANT_ID) {
      await db
        .delete(apiKeys)
        .where(and(eq(apiKeys.id, keyId), eq(apiKeys.userId, userId), eq(apiKeys.tenantId, tenantId)));

      logger.info({ userId, keyId }, "API key deleted");
    },
  };
}
