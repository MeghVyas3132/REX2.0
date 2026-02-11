// ──────────────────────────────────────────────
// REX - File Upload Routes
// Receives files as base64, parses them, returns
// structured data for the file-upload node
// ──────────────────────────────────────────────

import type { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";

interface UploadBody {
  fileContent: string; // base64-encoded file content
  fileName: string;
  fileFormat: string; // csv | json | txt | pdf
}

export function registerFileUploadRoutes(app: FastifyInstance): void {
  app.register(async function scopedRoutes(scoped: FastifyInstance) {
    scoped.addHook("onRequest", app.authenticate);

    // Parse uploaded file content
    scoped.post(
      "/api/files/parse",
      async (request: FastifyRequest, reply: FastifyReply) => {
        const body = request.body as UploadBody;

        if (!body.fileContent || !body.fileName || !body.fileFormat) {
          return reply.status(400).send({
            success: false,
            error: {
              code: "VALIDATION_ERROR",
              message: "Missing fileContent, fileName, or fileFormat",
            },
          });
        }

        const { fileContent, fileName, fileFormat } = body;
        const supportedFormats = ["csv", "json", "txt", "pdf"];

        if (!supportedFormats.includes(fileFormat)) {
          return reply.status(400).send({
            success: false,
            error: {
              code: "VALIDATION_ERROR",
              message: `Unsupported format "${fileFormat}". Supported: ${supportedFormats.join(", ")}`,
            },
          });
        }

        try {
          // Decode base64 to string
          const content = Buffer.from(fileContent, "base64").toString("utf-8");

          let parsedData: unknown;
          let preview: string;
          let rowCount: number | undefined;

          switch (fileFormat) {
            case "csv": {
              const result = parseCSV(content);
              parsedData = result.data;
              rowCount = result.rowCount;
              const colCount = result.data[0]
                ? Object.keys(result.data[0]).length
                : 0;
              const headers = result.data[0]
                ? Object.keys(result.data[0])
                : [];
              preview = `${rowCount} rows, ${colCount} columns (${headers.join(", ")})`;
              break;
            }
            case "json": {
              parsedData = JSON.parse(content);
              if (Array.isArray(parsedData)) {
                rowCount = parsedData.length;
                preview = `JSON array with ${rowCount} items`;
              } else {
                preview = `JSON object with ${Object.keys(parsedData as Record<string, unknown>).length} keys`;
              }
              break;
            }
            case "txt": {
              parsedData = content;
              const lineCount = content.split(/\r?\n/).length;
              preview = `${lineCount} lines, ${content.length} characters`;
              break;
            }
            case "pdf": {
              // For PDF, we do basic text extraction — strip binary headers
              // and extract readable text content
              const text = extractPDFText(content);
              parsedData = text;
              const pdfLines = text.split(/\r?\n/).length;
              preview = `PDF text extracted: ${pdfLines} lines, ${text.length} characters`;
              break;
            }
            default:
              parsedData = content;
              preview = `${content.length} characters`;
          }

          return reply.send({
            success: true,
            data: {
              fileName,
              fileFormat,
              parsedData,
              rowCount,
              preview,
            },
          });
        } catch (err) {
          const message =
            err instanceof Error ? err.message : "Failed to parse file";
          return reply.status(400).send({
            success: false,
            error: { code: "PARSE_ERROR", message },
          });
        }
      }
    );
  });
}

// ── CSV parser (same logic as engine) ─────────

function parseCSV(
  content: string
): { data: Record<string, string>[]; rowCount: number } {
  const lines = content
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  if (lines.length === 0) {
    return { data: [], rowCount: 0 };
  }

  const firstLine = lines[0]!;
  let delimiter = ",";
  if (firstLine.includes("\t")) {
    delimiter = "\t";
  } else if (
    firstLine.split(";").length > firstLine.split(",").length
  ) {
    delimiter = ";";
  }

  const headers = parseCsvLine(firstLine, delimiter).map((h) =>
    h.trim()
  );
  const rows: Record<string, string>[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = parseCsvLine(lines[i]!, delimiter);
    const row: Record<string, string> = {};
    headers.forEach((header, idx) => {
      row[header] = (values[idx] ?? "").trim();
    });
    rows.push(row);
  }

  return { data: rows, rowCount: rows.length };
}

function parseCsvLine(line: string, delimiter: string): string[] {
  const fields: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i]!;
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === delimiter && !inQuotes) {
      fields.push(current);
      current = "";
    } else {
      current += char;
    }
  }
  fields.push(current);
  return fields;
}

// ── Basic PDF text extraction ─────────────────
// Extracts readable ASCII/UTF-8 text from PDF binary content
// This is a lightweight extraction — for production, use pdf-parse

function extractPDFText(content: string): string {
  // Try to extract text between BT (begin text) and ET (end text) markers
  const textBlocks: string[] = [];
  const btEtRegex = /BT\s*([\s\S]*?)\s*ET/g;
  let match: RegExpExecArray | null;

  while ((match = btEtRegex.exec(content)) !== null) {
    const block = match[1] ?? "";
    // Extract strings in parentheses (PDF literal strings)
    const strRegex = /\(([^)]*)\)/g;
    let strMatch: RegExpExecArray | null;
    while ((strMatch = strRegex.exec(block)) !== null) {
      if (strMatch[1]) {
        textBlocks.push(strMatch[1]);
      }
    }
  }

  if (textBlocks.length > 0) {
    return textBlocks.join(" ").replace(/\\n/g, "\n").trim();
  }

  // Fallback: extract any printable text sequences from the content
  const printable = content
    .replace(/[^\x20-\x7E\n\r\t]/g, " ")
    .replace(/\s{3,}/g, "\n")
    .trim();

  return printable || "Could not extract text from PDF. Try converting to TXT first.";
}
