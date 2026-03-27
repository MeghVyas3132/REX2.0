#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";

function parseArg(name, defaultValue) {
  const prefixed = `--${name}=`;
  const match = process.argv.find((arg) => arg.startsWith(prefixed));
  if (!match) return defaultValue;
  return match.slice(prefixed.length);
}

function walkFiles(dir, acc = []) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walkFiles(fullPath, acc);
      continue;
    }
    if (entry.isFile() && fullPath.endsWith(".js")) {
      const bytes = fs.statSync(fullPath).size;
      acc.push({ file: fullPath, bytes });
    }
  }
  return acc;
}

function toKb(bytes) {
  return Math.round((bytes / 1024) * 100) / 100;
}

const reportOnly = process.argv.includes("--report-only");
const maxTotalKB = Number(parseArg("maxTotalKB", "1200"));
const maxChunkKB = Number(parseArg("maxChunkKB", "350"));
const chunksDir = path.resolve(process.cwd(), ".next", "static", "chunks");

if (!fs.existsSync(chunksDir)) {
  console.error("Bundle budget check failed: missing .next/static/chunks. Run build first.");
  process.exit(1);
}

const files = walkFiles(chunksDir);
if (files.length === 0) {
  console.error("Bundle budget check failed: no JS chunks found in .next/static/chunks.");
  process.exit(1);
}

const totalBytes = files.reduce((sum, f) => sum + f.bytes, 0);
const largest = files.reduce((max, f) => (f.bytes > max.bytes ? f : max), files[0]);
const sorted = [...files].sort((a, b) => b.bytes - a.bytes).slice(0, 10);

console.log("Frontend bundle report");
console.log(`Chunk directory: ${chunksDir}`);
console.log(`JS chunk files: ${files.length}`);
console.log(`Total JS size: ${toKb(totalBytes)} KB (budget ${maxTotalKB} KB)`);
console.log(`Largest chunk: ${path.basename(largest.file)} ${toKb(largest.bytes)} KB (budget ${maxChunkKB} KB)`);
console.log("Top 10 largest chunks:");
for (const [index, file] of sorted.entries()) {
  console.log(`${index + 1}. ${path.relative(chunksDir, file.file)} - ${toKb(file.bytes)} KB`);
}

if (reportOnly) {
  process.exit(0);
}

const failures = [];
if (toKb(totalBytes) > maxTotalKB) {
  failures.push(
    `Total JS size ${toKb(totalBytes)} KB exceeds budget ${maxTotalKB} KB.`,
  );
}
if (toKb(largest.bytes) > maxChunkKB) {
  failures.push(
    `Largest chunk ${toKb(largest.bytes)} KB exceeds budget ${maxChunkKB} KB.`,
  );
}

if (failures.length > 0) {
  console.error("Bundle budget check failed:");
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

console.log("Bundle budget check passed.");
