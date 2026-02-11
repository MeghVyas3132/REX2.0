// ──────────────────────────────────────────────
// REX - Environment Configuration Helper
// ──────────────────────────────────────────────

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
