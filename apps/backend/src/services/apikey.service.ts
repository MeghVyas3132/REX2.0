// ──────────────────────────────────────────────
// REX - API Key Service
// ──────────────────────────────────────────────

import { eq, and } from "drizzle-orm";
import type { Database } from "@rex/database";
import { apiKeys } from "@rex/database";
import { encrypt, decrypt, createLogger, loadConfig } from "@rex/utils";
import type { LLMProviderType } from "@rex/types";

const logger = createLogger("apikey-service");

export interface ApiKeyService {
  storeKey(userId: string, provider: LLMProviderType, key: string, label: string): Promise<{ id: string }>;
  getDecryptedKey(userId: string, provider: LLMProviderType): Promise<string>;
  listKeys(userId: string): Promise<Array<{ id: string; provider: string; label: string; createdAt: Date }>>;
  deleteKey(userId: string, keyId: string): Promise<void>;
}

export function createApiKeyService(db: Database): ApiKeyService {
  const config = loadConfig();

  return {
    async storeKey(userId, provider, key, label) {
      logger.info({ userId, provider, label }, "Storing API key");

      const encryptedKey = encrypt(key, config.encryption.masterKey);

      const [result] = await db
        .insert(apiKeys)
        .values({ userId, provider, encryptedKey, label })
        .returning({ id: apiKeys.id });

      if (!result) {
        throw new Error("Failed to store API key");
      }

      logger.info({ userId, provider, keyId: result.id }, "API key stored");
      return result;
    },

    async getDecryptedKey(userId, provider) {
      const [key] = await db
        .select()
        .from(apiKeys)
        .where(and(eq(apiKeys.userId, userId), eq(apiKeys.provider, provider)))
        .limit(1);

      if (!key) {
        throw new Error(
          `No ${provider} API key found. Please add your ${provider} API key in settings.`
        );
      }

      return decrypt(key.encryptedKey, config.encryption.masterKey);
    },

    async listKeys(userId) {
      const keys = await db
        .select({
          id: apiKeys.id,
          provider: apiKeys.provider,
          label: apiKeys.label,
          createdAt: apiKeys.createdAt,
        })
        .from(apiKeys)
        .where(eq(apiKeys.userId, userId));

      return keys;
    },

    async deleteKey(userId, keyId) {
      await db
        .delete(apiKeys)
        .where(and(eq(apiKeys.id, keyId), eq(apiKeys.userId, userId)));

      logger.info({ userId, keyId }, "API key deleted");
    },
  };
}
