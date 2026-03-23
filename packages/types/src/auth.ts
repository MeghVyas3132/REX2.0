// ──────────────────────────────────────────────
// REX - User & Auth Types
// ──────────────────────────────────────────────

export interface User {
  id: string;
  email: string;
  name: string;
  passwordHash: string;
  role: UserRole;
  globalRole: GlobalRole;
  consentGivenAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export type UserRole = "admin" | "editor" | "viewer";
export type GlobalRole = "super_admin" | "user";
export type TenantRole = "org_admin" | "org_editor" | "org_viewer";
export type InterfaceAccess = "business" | "studio" | "both";
export type ApiProviderType = "gemini" | "groq" | "openai" | "cohere" | "anthropic";

export interface ApiKey {
  id: string;
  tenantId: string;
  userId: string;
  provider: ApiProviderType;
  encryptedKey: string;
  label: string;
  createdAt: Date;
}

export interface JWTPayload {
  sub: string;
  email: string;
  role?: UserRole;
  globalRole?: GlobalRole;
  tenantId?: string;
  tenantRole?: TenantRole;
  interfaceAccess?: InterfaceAccess;
  iat: number;
  exp: number;
}

export interface RexJWTPayload {
  sub: string;
  email: string;
  globalRole: GlobalRole;
  currentTenantId: string;
  tenantRole: TenantRole;
  interfaceAccess: InterfaceAccess;
  abacAttributes: Record<string, unknown>;
  iat: number;
  exp: number;
}

export interface AuthTokens {
  accessToken: string;
  expiresIn: string;
}

export interface RegisterInput {
  email: string;
  name: string;
  password: string;
}

export interface LoginInput {
  email: string;
  password: string;
  tenantSlug?: string;
}

export interface CreateApiKeyInput {
  provider: ApiProviderType;
  key: string;
  label: string;
}

export interface TenantContext {
  tenantId: string;
  tenantSlug: string;
  tenantRole: TenantRole;
  interfaceAccess: InterfaceAccess;
  planTier: string;
  abacAttributes: Record<string, unknown>;
}
