// ──────────────────────────────────────────────
// REX - Auth Service
// ──────────────────────────────────────────────

import bcrypt from "bcrypt";
import { eq } from "drizzle-orm";
import type { Database } from "@rex/database";
import { users } from "@rex/database";
import { createLogger } from "@rex/utils";

const logger = createLogger("auth-service");
const SALT_ROUNDS = 12;

export interface AuthService {
  register(email: string, name: string, password: string): Promise<{ id: string; email: string; name: string }>;
  login(email: string, password: string): Promise<{ id: string; email: string; name: string }>;
  getUserById(userId: string): Promise<{ id: string; email: string; name: string } | null>;
}

export function createAuthService(db: Database): AuthService {
  return {
    async register(email, name, password) {
      logger.info({ email }, "Registering user");

      // Check if user exists
      const existing = await db.select().from(users).where(eq(users.email, email)).limit(1);
      if (existing.length > 0) {
        throw new ServiceError("User with this email already exists", "USER_EXISTS", 409);
      }

      const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

      const [user] = await db
        .insert(users)
        .values({ email, name, passwordHash })
        .returning({ id: users.id, email: users.email, name: users.name });

      if (!user) {
        throw new ServiceError("Failed to create user", "CREATE_FAILED", 500);
      }

      logger.info({ userId: user.id }, "User registered");
      return user;
    },

    async login(email, password) {
      logger.info({ email }, "Login attempt");

      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.email, email))
        .limit(1);

      if (!user) {
        throw new ServiceError("Invalid email or password", "INVALID_CREDENTIALS", 401);
      }

      const valid = await bcrypt.compare(password, user.passwordHash);
      if (!valid) {
        throw new ServiceError("Invalid email or password", "INVALID_CREDENTIALS", 401);
      }

      logger.info({ userId: user.id }, "User logged in");
      return { id: user.id, email: user.email, name: user.name };
    },

    async getUserById(userId) {
      const [user] = await db
        .select({ id: users.id, email: users.email, name: users.name })
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);

      return user ?? null;
    },
  };
}

export class ServiceError extends Error {
  readonly code: string;
  readonly statusCode: number;

  constructor(message: string, code: string, statusCode: number) {
    super(message);
    this.name = "ServiceError";
    this.code = code;
    this.statusCode = statusCode;
  }
}
