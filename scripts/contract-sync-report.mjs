#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

const repoRoot = process.cwd();
const requiredDocs = [
  "docs/API_ENDPOINTS.md",
  "docs/PAYLOAD_REGISTRY.md",
  "docs/FEATURE_LIST.md",
];

function checksum(content) {
  return crypto.createHash("sha256").update(content).digest("hex");
}

function readDoc(relativePath) {
  const absolutePath = path.resolve(repoRoot, relativePath);
  if (!fs.existsSync(absolutePath)) {
    return {
      relativePath,
      ok: false,
      reason: "missing",
    };
  }

  const content = fs.readFileSync(absolutePath, "utf8");
  const stats = fs.statSync(absolutePath);
  const nonEmptyLines = content.split(/\r?\n/).filter((line) => line.trim().length > 0).length;

  return {
    relativePath,
    ok: true,
    bytes: Buffer.byteLength(content, "utf8"),
    nonEmptyLines,
    modifiedAt: stats.mtime.toISOString(),
    sha256: checksum(content),
  };
}

const report = {
  generatedAt: new Date().toISOString(),
  docs: requiredDocs.map(readDoc),
};

const hasMissing = report.docs.some((doc) => !doc.ok);

const reportDir = path.resolve(repoRoot, "artifacts");
if (!fs.existsSync(reportDir)) {
  fs.mkdirSync(reportDir, { recursive: true });
}

const reportFile = path.resolve(reportDir, "contract-sync-report.json");
fs.writeFileSync(reportFile, JSON.stringify(report, null, 2));

console.log("Contract sync report generated:", path.relative(repoRoot, reportFile));
for (const doc of report.docs) {
  if (!doc.ok) {
    console.log(`- ${doc.relativePath}: MISSING`);
    continue;
  }
  console.log(
    `- ${doc.relativePath}: ${doc.nonEmptyLines} non-empty lines, ${doc.bytes} bytes, mtime ${doc.modifiedAt}`,
  );
}

if (hasMissing) {
  console.error("Contract sync report failed: one or more required docs are missing.");
  process.exit(1);
}
