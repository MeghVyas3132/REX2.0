// ──────────────────────────────────────────────
// REX - Knowledge Utilities
// Shared chunking/embedding/similarity helpers
// ──────────────────────────────────────────────

import { createHash } from "node:crypto";

export interface TextChunk {
  index: number;
  start: number;
  end: number;
  content: string;
}

export interface ChunkingOptions {
  chunkSizeChars?: number;
  chunkOverlapChars?: number;
}

export function chunkText(
  contentText: string,
  options: ChunkingOptions = {}
): TextChunk[] {
  const chunkSizeChars = options.chunkSizeChars ?? 1200;
  const chunkOverlapChars = options.chunkOverlapChars ?? 200;
  const normalized = contentText.replace(/\s+/g, " ").trim();

  if (!normalized) return [];

  const chunks: TextChunk[] = [];
  let start = 0;
  let index = 0;

  while (start < normalized.length) {
    const end = Math.min(normalized.length, start + chunkSizeChars);
    const content = normalized.slice(start, end).trim();

    if (content.length > 0) {
      chunks.push({ index, start, end, content });
      index += 1;
    }

    if (end >= normalized.length) {
      break;
    }

    start = Math.max(0, end - chunkOverlapChars);
  }

  return chunks;
}

export function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

export function buildDeterministicEmbedding(text: string, dimensions = 64): number[] {
  const values: number[] = [];
  let iteration = 0;

  while (values.length < dimensions) {
    const digest = createHash("sha256").update(`${iteration}:${text}`).digest();
    for (const byte of digest) {
      values.push(byte / 127.5 - 1);
      if (values.length >= dimensions) {
        break;
      }
    }
    iteration += 1;
  }

  return values;
}

export function cosineSimilarity(left: number[], right: number[]): number {
  if (left.length === 0 || right.length === 0 || left.length !== right.length) {
    return 0;
  }

  let dot = 0;
  let leftNorm = 0;
  let rightNorm = 0;

  for (let i = 0; i < left.length; i++) {
    const l = left[i]!;
    const r = right[i]!;
    dot += l * r;
    leftNorm += l * l;
    rightNorm += r * r;
  }

  const denom = Math.sqrt(leftNorm) * Math.sqrt(rightNorm);
  if (denom === 0) {
    return 0;
  }

  return dot / denom;
}

export function parseEmbedding(value: unknown): number[] {
  if (!Array.isArray(value)) return [];
  const out: number[] = [];

  for (const item of value) {
    if (typeof item === "number" && Number.isFinite(item)) {
      out.push(item);
    }
  }

  return out;
}
