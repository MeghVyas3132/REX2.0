// ──────────────────────────────────────────────
// REX - Security & Guardrail Helpers
// ──────────────────────────────────────────────

export interface PatternMatch {
  pattern: string;
  match: string;
}

const PROMPT_INJECTION_PATTERNS: RegExp[] = [
  /\bignore (all|previous|prior) instructions\b/i,
  /\b(disregard|bypass) (safety|guardrails|policy)\b/i,
  /\b(reveal|show) (system prompt|hidden prompt)\b/i,
  /\bdeveloper mode\b/i,
  /\bdo anything now\b/i,
];

const TOXICITY_PATTERNS: RegExp[] = [
  /\bkill yourself\b/i,
  /\bI hate (you|them)\b/i,
  /\b(?:racial slur|nazi)\b/i,
];

const PII_PATTERNS: Array<{ name: string; regex: RegExp }> = [
  { name: "email", regex: /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi },
  { name: "phone", regex: /\b(?:\+?\d{1,2}\s?)?(?:\(?\d{3}\)?[-.\s]?){2}\d{4}\b/g },
  { name: "ssn", regex: /\b\d{3}-\d{2}-\d{4}\b/g },
  { name: "api_key", regex: /\b(?:sk|gsk|AIza)[A-Za-z0-9_\-]{16,}\b/g },
];

export function detectPromptInjection(text: string): PatternMatch[] {
  const matches: PatternMatch[] = [];
  for (const regex of PROMPT_INJECTION_PATTERNS) {
    const found = text.match(regex);
    if (!found) continue;
    matches.push({ pattern: regex.source, match: found[0] ?? "" });
  }
  return matches;
}

export function detectToxicity(text: string): PatternMatch[] {
  const matches: PatternMatch[] = [];
  for (const regex of TOXICITY_PATTERNS) {
    const found = text.match(regex);
    if (!found) continue;
    matches.push({ pattern: regex.source, match: found[0] ?? "" });
  }
  return matches;
}

export function detectPII(text: string): PatternMatch[] {
  const matches: PatternMatch[] = [];
  for (const { name, regex } of PII_PATTERNS) {
    const found = text.match(regex);
    if (!found) continue;
    for (const value of found) {
      matches.push({ pattern: name, match: value });
    }
  }
  return matches;
}

export function redactPII(text: string): string {
  let redacted = text;
  for (const { name, regex } of PII_PATTERNS) {
    redacted = redacted.replace(regex, `[REDACTED_${name.toUpperCase()}]`);
  }
  return redacted;
}

export function flattenJson(
  value: unknown,
  options?: {
    maxDepth?: number;
    includeArrays?: boolean;
  }
): Record<string, unknown> {
  const maxDepth = Math.max(1, options?.maxDepth ?? 6);
  const includeArrays = options?.includeArrays ?? true;
  const out: Record<string, unknown> = {};

  const walk = (current: unknown, prefix: string, depth: number): void => {
    if (depth > maxDepth) return;
    if (current === null || current === undefined) {
      out[prefix] = current;
      return;
    }
    if (typeof current !== "object") {
      out[prefix] = current;
      return;
    }
    if (Array.isArray(current)) {
      if (!includeArrays) {
        out[prefix] = `[array:${current.length}]`;
        return;
      }
      current.forEach((item, index) => {
        walk(item, prefix ? `${prefix}[${index}]` : `[${index}]`, depth + 1);
      });
      return;
    }
    const entries = Object.entries(current as Record<string, unknown>);
    if (entries.length === 0) {
      out[prefix] = {};
      return;
    }
    for (const [key, nested] of entries) {
      const next = prefix ? `${prefix}.${key}` : key;
      walk(nested, next, depth + 1);
    }
  };

  walk(value, "", 0);
  if (Object.keys(out).length === 0 && value && typeof value === "object") {
    return value as Record<string, unknown>;
  }
  return out;
}

export function lexicalRelevanceScore(query: string, content: string): number {
  const tokenize = (text: string): string[] =>
    text
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, " ")
      .split(/\s+/)
      .filter((token) => token.length > 1);

  const qTokens = tokenize(query);
  const cTokens = new Set(tokenize(content));

  if (qTokens.length === 0 || cTokens.size === 0) return 0;
  let hits = 0;
  for (const token of qTokens) {
    if (cTokens.has(token)) hits += 1;
  }
  return hits / qTokens.length;
}
