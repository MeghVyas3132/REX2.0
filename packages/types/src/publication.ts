// ──────────────────────────────────────────────
// REX - Workflow Publication Types (Business Mode)
// ──────────────────────────────────────────────

// ─── Publication Types ────────────────────────────────────────────────────────

export interface WorkflowPublication {
  id: string;
  workflowId: string;
  tenantId: string;
  title: string;
  description: string | null;
  icon: string | null;
  inputSchema: PublicationInputSchema;
  outputDisplay: PublicationOutputDisplay;
  isPublished: boolean;
  publishedAt: Date | null;
  publishedBy: string | null;
  category: string | null;
  tags: string[];
  createdAt: Date;
}

// ─── Input Schema Types ───────────────────────────────────────────────────────

export interface PublicationInputSchema {
  fields: PublicationInputField[];
  layout?: PublicationFormLayout;
}

export interface PublicationInputField {
  id: string;
  name: string;
  label: string;
  type: PublicationFieldType;
  required: boolean;
  placeholder?: string;
  helpText?: string;
  defaultValue?: unknown;
  validation?: PublicationFieldValidation;
  options?: PublicationFieldOption[];
  conditionalDisplay?: PublicationConditionalDisplay;
}

export type PublicationFieldType =
  | "text"
  | "textarea"
  | "number"
  | "email"
  | "url"
  | "date"
  | "datetime"
  | "time"
  | "select"
  | "multiselect"
  | "checkbox"
  | "radio"
  | "file"
  | "image"
  | "json"
  | "hidden";

export interface PublicationFieldValidation {
  pattern?: string;
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
  customValidator?: string;
  errorMessage?: string;
}

export interface PublicationFieldOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface PublicationConditionalDisplay {
  dependsOn: string;
  condition: "equals" | "notEquals" | "contains" | "greaterThan" | "lessThan";
  value: unknown;
}

export interface PublicationFormLayout {
  columns?: number;
  sections?: PublicationFormSection[];
}

export interface PublicationFormSection {
  id: string;
  title: string;
  description?: string;
  fields: string[];
  collapsible?: boolean;
  defaultCollapsed?: boolean;
}

// ─── Output Display Types ─────────────────────────────────────────────────────

export interface PublicationOutputDisplay {
  type: OutputDisplayType;
  config: OutputDisplayConfig;
}

export type OutputDisplayType =
  | "text"
  | "markdown"
  | "html"
  | "json"
  | "table"
  | "chart"
  | "download"
  | "redirect"
  | "custom";

export interface OutputDisplayConfig {
  template?: string;
  columns?: OutputTableColumn[];
  chartType?: "bar" | "line" | "pie" | "area";
  downloadFileName?: string;
  downloadMimeType?: string;
  redirectUrl?: string;
  customComponent?: string;
}

export interface OutputTableColumn {
  key: string;
  header: string;
  type?: "text" | "number" | "date" | "link" | "badge";
  sortable?: boolean;
  filterable?: boolean;
  width?: string;
}

// ─── Published Workflow Catalog ───────────────────────────────────────────────

export interface PublishedWorkflowCatalogEntry {
  id: string;
  workflowId: string;
  title: string;
  description: string | null;
  icon: string | null;
  category: string | null;
  tags: string[];
  publishedAt: Date;
  publishedBy: {
    id: string;
    name: string;
  };
  usageCount: number;
  averageExecutionTime: number | null;
  lastExecutedAt: Date | null;
}

// ─── Business Mode Execution ──────────────────────────────────────────────────

export interface BusinessModeExecutionInput {
  workflowId: string;
  inputs: Record<string, unknown>;
}

export interface BusinessModeExecutionResult {
  executionId: string;
  status: "pending" | "running" | "completed" | "failed";
  output: unknown;
  outputDisplay: PublicationOutputDisplay;
  executionTimeMs: number;
  rexCompliance?: {
    humanReviewRequired: boolean;
    humanReviewCompleted: boolean;
    consentVerified: boolean;
  };
}

// ─── CRUD Input Types ─────────────────────────────────────────────────────────

export interface CreatePublicationInput {
  workflowId: string;
  title: string;
  description?: string;
  icon?: string;
  inputSchema: PublicationInputSchema;
  outputDisplay: PublicationOutputDisplay;
  category?: string;
  tags?: string[];
}

export interface UpdatePublicationInput {
  title?: string;
  description?: string;
  icon?: string;
  inputSchema?: PublicationInputSchema;
  outputDisplay?: PublicationOutputDisplay;
  category?: string;
  tags?: string[];
}

export interface PublishWorkflowInput {
  workflowId: string;
}

export interface UnpublishWorkflowInput {
  workflowId: string;
}
