// ──────────────────────────────────────────────
// REX - FileUploadNode
// Parses uploaded file content (CSV, JSON, TXT, PDF)
// and passes it downstream as structured data
// ──────────────────────────────────────────────

import type {
  BaseNodeDefinition,
  NodeInput,
  NodeOutput,
  NodeExecutionContext,
  ValidationResult,
} from "@rex/types";

export const FileUploadNode: BaseNodeDefinition = {
  type: "file-upload",

  validate(config: Record<string, unknown>): ValidationResult {
    const errors: string[] = [];

    if (!config["fileContent"] && !config["parsedData"]) {
      errors.push(
        "FileUploadNode: no file uploaded. Please upload a file in the node config panel."
      );
    }

    const format = config["fileFormat"] as string | undefined;
    if (format && !["csv", "json", "txt", "pdf"].includes(format)) {
      errors.push(
        `FileUploadNode: unsupported format "${format}". Supported: csv, json, txt, pdf`
      );
    }

    return { valid: errors.length === 0, errors };
  },

  async execute(
    input: NodeInput,
    context: NodeExecutionContext
  ): Promise<NodeOutput> {
    const nodeConfig = input.metadata?.["nodeConfig"] as
      | Record<string, unknown>
      | undefined;
    if (!nodeConfig) {
      throw new Error("FileUploadNode: missing nodeConfig in metadata");
    }

    const fileName = (nodeConfig["fileName"] as string) ?? "unknown";
    const fileFormat = (nodeConfig["fileFormat"] as string) ?? "txt";

    context.logger.info("Processing uploaded file", {
      nodeId: context.nodeId,
      fileName,
      fileFormat,
    });

    // If data was already parsed on upload (by the backend), use it directly
    if (nodeConfig["parsedData"]) {
      const parsedData = nodeConfig["parsedData"];

      context.logger.info("Using pre-parsed file data", {
        nodeId: context.nodeId,
        fileName,
        format: fileFormat,
        dataType: typeof parsedData,
      });

      return {
        data: {
          fileName,
          fileFormat,
          data: parsedData,
          rowCount:
            Array.isArray(parsedData) ? parsedData.length : undefined,
          preview: buildPreview(parsedData, fileFormat),
        },
      };
    }

    // Fallback — parse raw content (base64 or string)
    const rawContent = nodeConfig["fileContent"] as string;
    if (!rawContent) {
      throw new Error(
        "FileUploadNode: no fileContent or parsedData found in config"
      );
    }

    const parsed = parseFileContent(rawContent, fileFormat, fileName);

    return {
      data: {
        fileName,
        fileFormat,
        data: parsed.data,
        rowCount: parsed.rowCount,
        preview: parsed.preview,
      },
    };
  },
};

// ── CSV parser ────────────────────────────────

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

  // Detect delimiter (comma, semicolon, tab)
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

/** Handle quoted CSV fields */
function parseCsvLine(line: string, delimiter: string): string[] {
  const fields: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i]!;
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++; // skip escaped quote
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

// ── JSON parser ───────────────────────────────

function parseJSON(content: string): unknown {
  try {
    return JSON.parse(content);
  } catch {
    throw new Error("FileUploadNode: invalid JSON content");
  }
}

// ── Main parser ───────────────────────────────

function parseFileContent(
  rawContent: string,
  format: string,
  _fileName: string
): { data: unknown; rowCount?: number; preview: string } {
  // Decode base64 if needed
  let content = rawContent;
  if (isBase64(rawContent)) {
    content = Buffer.from(rawContent, "base64").toString("utf-8");
  }

  switch (format) {
    case "csv": {
      const { data, rowCount } = parseCSV(content);
      return {
        data,
        rowCount,
        preview: `${rowCount} rows, ${data[0] ? Object.keys(data[0]).length : 0} columns`,
      };
    }
    case "json": {
      const parsed = parseJSON(content);
      const isArray = Array.isArray(parsed);
      return {
        data: parsed,
        rowCount: isArray ? parsed.length : undefined,
        preview: isArray
          ? `JSON array with ${parsed.length} items`
          : "JSON object",
      };
    }
    case "txt": {
      const lineCount = content.split(/\r?\n/).length;
      return {
        data: content,
        preview: `${lineCount} lines, ${content.length} characters`,
      };
    }
    case "pdf": {
      // PDF text content is extracted on the backend during upload
      // If we get here, it's raw text already
      const lineCount = content.split(/\r?\n/).length;
      return {
        data: content,
        preview: `PDF text: ${lineCount} lines, ${content.length} characters`,
      };
    }
    default:
      return {
        data: content,
        preview: `${content.length} characters`,
      };
  }
}

function buildPreview(data: unknown, format: string): string {
  if (Array.isArray(data)) {
    const cols = data[0] ? Object.keys(data[0] as Record<string, unknown>).length : 0;
    return `${data.length} rows${cols ? `, ${cols} columns` : ""}`;
  }
  if (typeof data === "string") {
    const lines = data.split(/\r?\n/).length;
    return format === "pdf"
      ? `PDF text: ${lines} lines`
      : `${lines} lines, ${data.length} characters`;
  }
  if (typeof data === "object" && data !== null) {
    return `JSON object with ${Object.keys(data).length} keys`;
  }
  return "File data loaded";
}

function isBase64(str: string): boolean {
  if (str.length < 20) return false;
  return /^[A-Za-z0-9+/\n]+=*$/.test(str.slice(0, 100));
}
