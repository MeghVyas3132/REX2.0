// ──────────────────────────────────────────────
// REX - User & Auth Types
// ──────────────────────────────────────────────

export interface User {
  id: string;
  email: string;
  name: string;
  passwordHash: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ApiKey {
  id: string;
  userId: string;
  provider: "gemini" | "groq";
  encryptedKey: string;
  label: string;
  createdAt: Date;
}

export interface JWTPayload {
  sub: string;
  email: string;
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
  provider: "gemini" | "groq";
  key: string;
  label: string;
}
