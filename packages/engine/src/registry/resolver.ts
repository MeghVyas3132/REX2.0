export interface ByokKeyStore {
  resolveKey: (tenantId: string, envKey: string) => Promise<string>;
}

export function createTenantByokResolver(
  tenantId: string,
  keyStore: ByokKeyStore
): (envKey: string) => Promise<string> {
  return async (envKey: string): Promise<string> => {
    const value = await keyStore.resolveKey(tenantId, envKey);
    if (!value) {
      throw new Error(`Missing BYOK credential for ${envKey}`);
    }
    return value;
  };
}