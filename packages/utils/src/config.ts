// ──────────────────────────────────────────────
// REX - Environment Configuration Helper
// ──────────────────────────────────────────────

import { readFileSync } from "fs";
import { resolve } from "path";
import { fileURLToPath } from "url";

// Load .env file if it exists
function loadDotenvFile(): void {
  try {
    // Find the workspace root (.env file is at the root)
    const __dirname = fileURLToPath(new URL(".", import.meta.url));
    let envPath = resolve(__dirname, "../../.env");
    
    // Try different paths (development vs built)
    const possiblePaths = [
      envPath,
      resolve(__dirname, "../.env"),
      resolve(__dirname, "../../.env"),
      resolve(__dirname, "../../../.env"),
      ".env",
    ];
    
    let envContent: string | null = null;
    for (const path of possiblePaths) {
      try {
        envContent = readFileSync(path, "utf-8");
        break;
      } catch {}
    }
    
    if (!envContent) return;
    
    envContent.split("\n").forEach((line) => {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith("#")) {
        const [key, ...valueParts] = trimmed.split("=");
        const value = valueParts.join("=").trim();
        if (key && !process.env[key]) {
          process.env[key] = value;
        }
      }
    });
  } catch {
    // Silently fail if .env doesn't exist or can't be read
  }
}

// Load .env file on module initialization
loadDotenvFile();

export function getEnvOrThrow(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

export function getEnvOrDefault(key: string, defaultValue: string): string {
  return process.env[key] ?? defaultValue;
}

export function getEnvAsNumber(key: string, defaultValue: number): number {
  const value = process.env[key];
  if (!value) return defaultValue;
  const parsed = parseInt(value, 10);
  if (isNaN(parsed)) {
    throw new Error(`Environment variable ${key} must be a number, got: ${value}`);
  }
  return parsed;
}

export interface AppConfig {
  nodeEnv: string;
  logLevel: string;

  postgres: {
    host: string;
    port: number;
    user: string;
    password: string;
    database: string;
    url: string;
  };

  redis: {
    host: string;
    port: number;
  };

  backend: {
    port: number;
    host: string;
  };

  jwt: {
    secret: string;
    expiry: string;
  };

  encryption: {
    masterKey: string;
  };

  worker: {
    concurrency: number;
    queueName: string;
    retrievalMaxRequestsPerExecution: number;
    retrievalMaxFailuresPerExecution: number;
    retrievalMaxDurationMsPerExecution: number;
  };

  rateLimit: {
    max: number;
    windowMs: number;
  };

  webhookRateLimit: {
    max: number;
    windowMs: number;
  };
}

export function loadConfig(): AppConfig {
  return {
    nodeEnv: getEnvOrDefault("NODE_ENV", "development"),
    logLevel: getEnvOrDefault("LOG_LEVEL", "info"),

    postgres: {
      host: getEnvOrThrow("POSTGRES_HOST"),
      port: getEnvAsNumber("POSTGRES_PORT", 5432),
      user: getEnvOrThrow("POSTGRES_USER"),
      password: getEnvOrThrow("POSTGRES_PASSWORD"),
      database: getEnvOrThrow("POSTGRES_DB"),
      url: getEnvOrThrow("DATABASE_URL"),
    },

    redis: {
      host: getEnvOrThrow("REDIS_HOST"),
      port: getEnvAsNumber("REDIS_PORT", 6379),
    },

    backend: {
      port: getEnvAsNumber("BACKEND_PORT", 4000),
      host: getEnvOrDefault("BACKEND_HOST", "0.0.0.0"),
    },

    jwt: {
      secret: getEnvOrThrow("JWT_SECRET"),
      expiry: getEnvOrDefault("JWT_EXPIRY", "7d"),
    },

    encryption: {
      masterKey: getEnvOrThrow("ENCRYPTION_MASTER_KEY"),
    },

    worker: {
      concurrency: getEnvAsNumber("WORKER_CONCURRENCY", 5),
      queueName: getEnvOrDefault("QUEUE_NAME", "workflow-execution"),
      retrievalMaxRequestsPerExecution: getEnvAsNumber(
        "RETRIEVAL_MAX_REQUESTS_PER_EXECUTION",
        64
      ),
      retrievalMaxFailuresPerExecution: getEnvAsNumber(
        "RETRIEVAL_MAX_FAILURES_PER_EXECUTION",
        32
      ),
      retrievalMaxDurationMsPerExecution: getEnvAsNumber(
        "RETRIEVAL_MAX_DURATION_MS_PER_EXECUTION",
        120000
      ),
    },

    rateLimit: {
      max: getEnvAsNumber("RATE_LIMIT_MAX", 100),
      windowMs: getEnvAsNumber("RATE_LIMIT_WINDOW_MS", 60000),
    },

    webhookRateLimit: {
      max: getEnvAsNumber("WEBHOOK_RATE_LIMIT_MAX", 30),
      windowMs: getEnvAsNumber("WEBHOOK_RATE_LIMIT_WINDOW_MS", 60000),
    },
  };
}
