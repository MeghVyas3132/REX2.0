import type { PluginManifest } from "@rex/types";

export interface PluginValidationResult {
  valid: boolean;
  errors: string[];
}

function hasValue(value: unknown): boolean {
  return value !== null && value !== undefined;
}

function matchesType(value: unknown, expectedType: string): boolean {
  if (expectedType === "array") return Array.isArray(value);
  if (expectedType === "number") return typeof value === "number" && Number.isFinite(value);
  if (expectedType === "boolean") return typeof value === "boolean";
  if (expectedType === "object") return typeof value === "object" && !Array.isArray(value) && value !== null;
  if (expectedType === "string") return typeof value === "string";
  return true;
}

export function validateNodeConfigAgainstManifest(
  manifest: PluginManifest,
  input: Record<string, unknown>
): PluginValidationResult {
  const errors: string[] = [];
  const required = new Set(manifest.inputSchema.required ?? []);

  for (const field of required) {
    if (!hasValue(input[field])) {
      errors.push(`Missing required field: ${field}`);
    }
  }

  for (const [field, schema] of Object.entries(manifest.inputSchema.properties)) {
    if (!hasValue(input[field])) continue;
    if (!matchesType(input[field], schema.type)) {
      errors.push(`Invalid type for ${field}. Expected ${schema.type}`);
    }
    if (schema.enum && !schema.enum.includes(input[field])) {
      errors.push(`Invalid enum value for ${field}`);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

export function maskSensitiveInput(
  manifest: PluginManifest,
  input: Record<string, unknown>
): Record<string, unknown> {
  const masked: Record<string, unknown> = { ...input };
  for (const [field, schema] of Object.entries(manifest.inputSchema.properties)) {
    if (schema.sensitive && field in masked) {
      masked[field] = "***";
    }
  }
  return masked;
}