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
    type: "manual_trigger",
    label: "Manual Trigger",
    category: "trigger",
    description: "Manually start the workflow",
    defaultConfig: {},
    configFields: [],
  },
  {
    type: "webhook_trigger",
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
    type: "llm",
    label: "LLM",
    category: "action",
    description: "Call a language model",
    defaultConfig: { provider: "gemini", model: "gemini-pro", prompt: "" },
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
      { key: "model", label: "Model", type: "text", placeholder: "gemini-pro" },
      { key: "prompt", label: "Prompt", type: "textarea", placeholder: "Enter your prompt..." },
    ],
  },
  {
    type: "http_request",
    label: "HTTP Request",
    category: "action",
    description: "Make an HTTP request",
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
          { value: "DELETE", label: "DELETE" },
        ],
      },
      { key: "url", label: "URL", type: "text", placeholder: "https://api.example.com" },
      { key: "body", label: "Body", type: "textarea", placeholder: '{"key": "value"}' },
    ],
  },
  {
    type: "condition",
    label: "Condition",
    category: "logic",
    description: "Branch based on a condition",
    defaultConfig: { field: "", operator: "equals", value: "" },
    configFields: [
      { key: "field", label: "Field", type: "text", placeholder: "data.status" },
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
        ],
      },
      { key: "value", label: "Value", type: "text", placeholder: "Expected value" },
    ],
  },
  {
    type: "code",
    label: "Code",
    category: "action",
    description: "Run custom JavaScript code",
    defaultConfig: { code: "// Access input via `input` variable\nreturn input;" },
    configFields: [
      { key: "code", label: "Code", type: "textarea", placeholder: "return input;" },
    ],
  },
  {
    type: "transformer",
    label: "Transformer",
    category: "action",
    description: "Transform data with an expression",
    defaultConfig: { expression: "" },
    configFields: [
      { key: "expression", label: "Expression", type: "textarea", placeholder: "data.map(item => item.name)" },
    ],
  },
  {
    type: "output",
    label: "Output",
    category: "output",
    description: "Final output of the workflow",
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
