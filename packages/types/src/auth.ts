// ──────────────────────────────────────────────
// REX - User & Auth Types
// ──────────────────────────────────────────────

export interface User {
  id: string;
  email: string;
  name: string;
  passwordHash: string;
  role: UserRole;
  consentGivenAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export type UserRole = "admin" | "editor" | "viewer";
export type ApiProviderType = "gemini" | "groq" | "openai" | "cohere";

export interface ApiKey {
  id: string;
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
}

export interface CreateApiKeyInput {
  provider: ApiProviderType;
  key: string;
  label: string;
}
