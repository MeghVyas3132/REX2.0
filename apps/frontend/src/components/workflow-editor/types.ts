// ──────────────────────────────────────────────
// REX - Workflow Editor Types
// ──────────────────────────────────────────────

export interface CanvasNode {
  id: string;
  type: string;
  label: string;
  position: { x: number; y: number };
  config: Record<string, unknown>;
}

export interface CanvasEdge {
  id: string;
  source: string;
  target: string;
}

export interface Point {
  x: number;
  y: number;
}

export interface ViewTransform {
  x: number;
  y: number;
  scale: number;
}

export interface DragState {
  type: "node" | "canvas" | "connection" | "none";
  nodeId?: string;
  startMouse?: Point;
  startNodePos?: Point;
  startTransform?: Point;
  sourceNodeId?: string;
  mousePos?: Point;
}

export interface NodeTypeDefinition {
  type: string;
  label: string;
  category: "trigger" | "action" | "logic" | "output";
  description: string;
  defaultConfig: Record<string, unknown>;
  configFields: ConfigField[];
}

export interface ConfigField {
  key: string;
  label: string;
  type: "text" | "textarea" | "select" | "number";
  placeholder?: string;
  options?: { value: string; label: string }[];
  required?: boolean;
}

export const NODE_TYPE_DEFS: NodeTypeDefinition[] = [
  {
    type: "manual-trigger",
    label: "Manual Trigger",
    category: "trigger",
    description: "Manually start the workflow",
    defaultConfig: {},
    configFields: [],
  },
  {
    type: "webhook-trigger",
    label: "Webhook Trigger",
    category: "trigger",
    description: "Start workflow via HTTP webhook",
    defaultConfig: { method: "POST" },
    configFields: [
      {
        key: "method",
        label: "HTTP Method",
        type: "select",
        options: [
          { value: "GET", label: "GET" },
          { value: "POST", label: "POST" },
          { value: "PUT", label: "PUT" },
        ],
      },
    ],
  },
  {
    type: "schedule-trigger",
    label: "Schedule Trigger",
    category: "trigger",
    description: "Run on a cron schedule",
    defaultConfig: { cron: "0 * * * *" },
    configFields: [
      {
        key: "cron",
        label: "Cron Expression",
        type: "text",
        placeholder: "0 * * * * (every hour)",
      },
      {
        key: "intervalMs",
        label: "Interval (ms, alt to cron)",
        type: "number",
        placeholder: "3600000",
      },
    ],
  },
  {
    type: "llm",
    label: "LLM",
    category: "action",
    description: "Call a language model",
    defaultConfig: { provider: "gemini", model: "gemini-2.0-flash", prompt: "" },
    configFields: [
      {
        key: "provider",
        label: "Provider",
        type: "select",
        options: [
          { value: "gemini", label: "Gemini" },
          { value: "groq", label: "Groq" },
        ],
      },
      { key: "model", label: "Model", type: "text", placeholder: "gemini-2.0-flash" },
      { key: "prompt", label: "Prompt", type: "textarea", placeholder: "Enter your prompt or use {{variable}} for interpolation" },
      { key: "systemPrompt", label: "System Prompt", type: "textarea", placeholder: "Optional system instructions" },
      { key: "temperature", label: "Temperature", type: "number", placeholder: "0.7" },
      { key: "maxTokens", label: "Max Tokens", type: "number", placeholder: "2048" },
    ],
  },
  {
    type: "http-request",
    label: "HTTP Request",
    category: "action",
    description: "Make an HTTP request to any API",
    defaultConfig: { method: "GET", url: "" },
    configFields: [
      {
        key: "method",
        label: "Method",
        type: "select",
        options: [
          { value: "GET", label: "GET" },
          { value: "POST", label: "POST" },
          { value: "PUT", label: "PUT" },
          { value: "PATCH", label: "PATCH" },
          { value: "DELETE", label: "DELETE" },
        ],
      },
      { key: "url", label: "URL", type: "text", placeholder: "https://api.example.com/data" },
      { key: "body", label: "Request Body (JSON)", type: "textarea", placeholder: '{"key": "value"}' },
      { key: "timeoutMs", label: "Timeout (ms)", type: "number", placeholder: "30000" },
    ],
  },
  {
    type: "code",
    label: "Code",
    category: "action",
    description: "Run custom JavaScript logic",
    defaultConfig: { code: "// Access data via `input` variable\nreturn input;" },
    configFields: [
      { key: "code", label: "JavaScript Code", type: "textarea", placeholder: "// input contains upstream data\nreturn { processed: input };" },
      { key: "timeoutMs", label: "Timeout (ms)", type: "number", placeholder: "10000" },
    ],
  },
  {
    type: "transformer",
    label: "Transformer",
    category: "action",
    description: "Transform data with an expression",
    defaultConfig: { expression: "" },
    configFields: [
      { key: "expression", label: "Expression", type: "textarea", placeholder: "({ name: data.user, count: data.items.length })" },
    ],
  },
  {
    type: "json-validator",
    label: "JSON Validator",
    category: "logic",
    description: "Validate data fields and types",
    defaultConfig: { requiredFields: [] },
    configFields: [
      { key: "requiredFields", label: "Required Fields (comma-separated)", type: "text", placeholder: "name, email, status" },
      { key: "strict", label: "Strict Mode (fail on invalid)", type: "select", options: [{ value: "true", label: "Yes" }, { value: "false", label: "No" }] },
    ],
  },
  {
    type: "condition",
    label: "Condition",
    category: "logic",
    description: "Branch based on a condition",
    defaultConfig: { field: "", operator: "equals", value: "" },
    configFields: [
      { key: "field", label: "Field Path", type: "text", placeholder: "status" },
      {
        key: "operator",
        label: "Operator",
        type: "select",
        options: [
          { value: "equals", label: "Equals" },
          { value: "not_equals", label: "Not Equals" },
          { value: "contains", label: "Contains" },
          { value: "greater_than", label: "Greater Than" },
          { value: "less_than", label: "Less Than" },
          { value: "exists", label: "Exists" },
          { value: "not_exists", label: "Does Not Exist" },
          { value: "is_empty", label: "Is Empty" },
          { value: "is_not_empty", label: "Is Not Empty" },
        ],
      },
      { key: "value", label: "Value", type: "text", placeholder: "Expected value" },
    ],
  },
  {
    type: "data-cleaner",
    label: "Data Cleaner",
    category: "logic",
    description: "Clean and sanitize data",
    defaultConfig: { operations: ["trim"] },
    configFields: [
      {
        key: "operations",
        label: "Operations (comma-separated)",
        type: "text",
        placeholder: "trim, normalize-case, remove-special-chars",
      },
    ],
  },
  {
    type: "log",
    label: "Log",
    category: "output",
    description: "Log data for debugging",
    defaultConfig: { level: "info", message: "Workflow log" },
    configFields: [
      {
        key: "level",
        label: "Level",
        type: "select",
        options: [
          { value: "info", label: "Info" },
          { value: "warn", label: "Warning" },
          { value: "error", label: "Error" },
          { value: "debug", label: "Debug" },
        ],
      },
      { key: "message", label: "Message", type: "text", placeholder: "Log message" },
    ],
  },
  {
    type: "output",
    label: "Output",
    category: "output",
    description: "Final workflow output",
    defaultConfig: {},
    configFields: [],
  },
];

export function getNodeTypeDef(type: string): NodeTypeDefinition | undefined {
  return NODE_TYPE_DEFS.find((d) => d.type === type);
}

export function getCategoryColor(category: string): string {
  switch (category) {
    case "trigger":
      return "#22c55e";
    case "action":
      return "#3b82f6";
    case "logic":
      return "#eab308";
    case "output":
      return "#a855f7";
    default:
      return "#666666";
  }
}
