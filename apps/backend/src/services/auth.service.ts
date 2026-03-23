// ──────────────────────────────────────────────
// REX - Auth Service
// ──────────────────────────────────────────────

import bcrypt from "bcrypt";
import { eq } from "drizzle-orm";
import type { Database } from "@rex/database";
import { tenantUsers, tenants, users } from "@rex/database";
import { createLogger } from "@rex/utils";
import { DEFAULT_TENANT_ID } from "./tenant-default.js";

const logger = createLogger("auth-service");
const SALT_ROUNDS = 12;

export interface AuthService {
  register(email: string, name: string, password: string): Promise<AuthUserWithTenant>;
  login(email: string, password: string): Promise<AuthUserWithTenant>;
  getUserById(userId: string): Promise<AuthUserWithTenant | null>;
}

interface AuthUserWithTenant {
  id: string;
  email: string;
  name: string;
  role: string;
  globalRole: string;
  tenantId: string;
  tenantRole: string;
  interfaceAccess: string;
  abacAttributes: Record<string, unknown>;
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
        .values({
          email,
          name,
          passwordHash,
          role: "editor",
          globalRole: "user",
          consentGivenAt: new Date(),
        })
        .returning({
          id: users.id,
          email: users.email,
          name: users.name,
          role: users.role,
          globalRole: users.globalRole,
        });

      if (!user) {
        throw new ServiceError("Failed to create user", "CREATE_FAILED", 500);
      }

      const [existingMembership] = await db
        .select({ id: tenantUsers.id })
        .from(tenantUsers)
        .where(eq(tenantUsers.userId, user.id))
        .limit(1);

      if (!existingMembership) {
        await db.insert(tenantUsers).values({
          tenantId: DEFAULT_TENANT_ID,
          userId: user.id,
          tenantRole: "org_editor",
          interfaceAccess: "both",
          abacAttributes: {},
          isActive: true,
        });
      }

      logger.info({ userId: user.id }, "User registered");
      return {
        ...user,
        tenantId: DEFAULT_TENANT_ID,
        tenantRole: "org_editor",
        interfaceAccess: "both",
        abacAttributes: {},
      };
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

      const [membership] = await db
        .select({
          tenantId: tenantUsers.tenantId,
          tenantRole: tenantUsers.tenantRole,
          interfaceAccess: tenantUsers.interfaceAccess,
          abacAttributes: tenantUsers.abacAttributes,
        })
        .from(tenantUsers)
        .innerJoin(tenants, eq(tenants.id, tenantUsers.tenantId))
        .where(eq(tenantUsers.userId, user.id))
        .limit(1);

      logger.info({ userId: user.id }, "User logged in");
      return {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        globalRole: user.globalRole,
        tenantId: membership?.tenantId ?? DEFAULT_TENANT_ID,
        tenantRole: membership?.tenantRole ?? "org_editor",
        interfaceAccess: membership?.interfaceAccess ?? "both",
        abacAttributes: (membership?.abacAttributes as Record<string, unknown> | null) ?? {},
      };
    },

    async getUserById(userId) {
      const [user] = await db
        .select({ id: users.id, email: users.email, name: users.name, role: users.role, globalRole: users.globalRole })
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);
      if (!user) return null;

      const [membership] = await db
        .select({
          tenantId: tenantUsers.tenantId,
          tenantRole: tenantUsers.tenantRole,
          interfaceAccess: tenantUsers.interfaceAccess,
          abacAttributes: tenantUsers.abacAttributes,
        })
        .from(tenantUsers)
        .where(eq(tenantUsers.userId, userId))
        .limit(1);

      return {
        ...user,
        tenantId: membership?.tenantId ?? DEFAULT_TENANT_ID,
        tenantRole: membership?.tenantRole ?? "org_editor",
        interfaceAccess: membership?.interfaceAccess ?? "both",
        abacAttributes: (membership?.abacAttributes as Record<string, unknown> | null) ?? {},
      };
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
