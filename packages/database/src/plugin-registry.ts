export type RegistryCategory =
  | "ai_llm"
  | "data_storage"
  | "communication"
  | "business_crm"
  | "logic_control"
  | "trigger"
  | "compliance_rex"
  | "developer"
  | "india_stack";

export type ByokTier = "required" | "optional" | "system";

export interface PluginRegistryEntry {
  slug: string;
  name: string;
  description: string;
  category: RegistryCategory;
  byokTier: ByokTier;
  provider: string;
  isPublic?: boolean;
  isBuiltin?: boolean;
  actions: string[];
  tags?: string[];
  piiRisk?: "low" | "medium" | "high";
  crossBorder?: boolean;
  requiresConsentGate?: boolean;
}

const P = (
  entry: PluginRegistryEntry
): PluginRegistryEntry => ({
  isPublic: true,
  isBuiltin: false,
  tags: [],
  piiRisk: "low",
  crossBorder: false,
  requiresConsentGate: false,
  ...entry,
});

export const PLUGIN_REGISTRY_VERSION = "2026.03.24";

export const pluginRegistryCatalogue: PluginRegistryEntry[] = [
  // ai_llm (9)
  P({ slug: "openai", name: "OpenAI", description: "Run GPT models for generation and reasoning", category: "ai_llm", byokTier: "required", provider: "openai", actions: ["chat", "embeddings"], tags: ["llm", "cross-border"], piiRisk: "high", crossBorder: true }),
  P({ slug: "anthropic", name: "Anthropic Claude", description: "Use Claude models for structured and long-context tasks", category: "ai_llm", byokTier: "required", provider: "anthropic", actions: ["chat"], tags: ["llm", "cross-border"], piiRisk: "high", crossBorder: true }),
  P({ slug: "gemini", name: "Google Gemini", description: "Google multimodal and text models", category: "ai_llm", byokTier: "required", provider: "google", actions: ["chat", "vision"], tags: ["llm", "cross-border"], piiRisk: "high", crossBorder: true }),
  P({ slug: "groq", name: "Groq", description: "Low-latency LLM inference", category: "ai_llm", byokTier: "required", provider: "groq", actions: ["chat"], tags: ["llm", "cross-border"], piiRisk: "high", crossBorder: true }),
  P({ slug: "mistral", name: "Mistral", description: "Mistral text and reasoning models", category: "ai_llm", byokTier: "required", provider: "mistral", actions: ["chat"], tags: ["llm", "cross-border"], piiRisk: "high", crossBorder: true }),
  P({ slug: "cohere", name: "Cohere", description: "Embeddings and rerank APIs", category: "ai_llm", byokTier: "required", provider: "cohere", actions: ["embeddings", "rerank"], tags: ["llm", "cross-border"], piiRisk: "medium", crossBorder: true }),
  P({ slug: "perplexity", name: "Perplexity", description: "Search-grounded response APIs", category: "ai_llm", byokTier: "required", provider: "perplexity", actions: ["chat", "web-search"], tags: ["llm", "cross-border"], piiRisk: "medium", crossBorder: true }),
  P({ slug: "azure-openai", name: "Azure OpenAI", description: "Azure-hosted OpenAI deployments", category: "ai_llm", byokTier: "optional", provider: "azure", actions: ["chat", "embeddings"], tags: ["llm"], piiRisk: "high" }),
  P({ slug: "sarvam-ai", name: "Sarvam AI", description: "India-first multilingual AI models", category: "ai_llm", byokTier: "required", provider: "sarvam", actions: ["chat", "transliteration"], tags: ["india", "dpdp"], piiRisk: "high", requiresConsentGate: true }),

  // communication (9)
  P({ slug: "slack", name: "Slack", description: "Send workflow alerts to Slack channels", category: "communication", byokTier: "optional", provider: "slack", actions: ["send-message"], tags: ["chat"], piiRisk: "medium", isBuiltin: true }),
  P({ slug: "teams", name: "Microsoft Teams", description: "Notify Teams channels and users", category: "communication", byokTier: "required", provider: "microsoft", actions: ["send-message"], tags: ["chat"], piiRisk: "medium", crossBorder: true }),
  P({ slug: "twilio", name: "Twilio", description: "SMS and voice notifications", category: "communication", byokTier: "required", provider: "twilio", actions: ["sms", "voice"], tags: ["telephony"], piiRisk: "high", crossBorder: true }),
  P({ slug: "sendgrid", name: "SendGrid", description: "Transactional email delivery", category: "communication", byokTier: "required", provider: "sendgrid", actions: ["send-email"], tags: ["email", "cross-border"], piiRisk: "medium", crossBorder: true }),
  P({ slug: "smtp", name: "SMTP Relay", description: "Send emails via custom SMTP", category: "communication", byokTier: "optional", provider: "smtp", actions: ["send-email"], tags: ["email"], piiRisk: "medium" }),
  P({ slug: "whatsapp-business", name: "WhatsApp Business", description: "Send WhatsApp template and session messages", category: "communication", byokTier: "required", provider: "meta", actions: ["send-message"], tags: ["chat"], piiRisk: "high", crossBorder: true }),
  P({ slug: "msg91", name: "MSG91", description: "DLT-compliant India messaging", category: "communication", byokTier: "required", provider: "msg91", actions: ["sms", "whatsapp"], tags: ["india", "dlt", "dpdp"], piiRisk: "high", requiresConsentGate: true }),
  P({ slug: "sns", name: "Amazon SNS", description: "Publish notifications to SNS topics", category: "communication", byokTier: "required", provider: "aws", actions: ["publish"], tags: ["cloud", "cross-border"], piiRisk: "medium", crossBorder: true }),
  P({ slug: "firebase-fcm", name: "Firebase FCM", description: "Push notifications to mobile apps", category: "communication", byokTier: "required", provider: "google", actions: ["push"], tags: ["mobile", "cross-border"], piiRisk: "medium", crossBorder: true }),

  // business_crm (9)
  P({ slug: "salesforce", name: "Salesforce", description: "Sync contacts, opportunities, and accounts", category: "business_crm", byokTier: "required", provider: "salesforce", actions: ["upsert-contact", "upsert-opportunity"], tags: ["crm", "cross-border"], piiRisk: "high", crossBorder: true }),
  P({ slug: "hubspot", name: "HubSpot", description: "Create and update CRM entities", category: "business_crm", byokTier: "required", provider: "hubspot", actions: ["upsert-contact", "upsert-deal"], tags: ["crm", "cross-border"], piiRisk: "high", crossBorder: true }),
  P({ slug: "zoho-crm", name: "Zoho CRM", description: "Integrate with Zoho CRM modules", category: "business_crm", byokTier: "required", provider: "zoho", actions: ["upsert-lead", "upsert-contact"], tags: ["crm"], piiRisk: "high" }),
  P({ slug: "dynamics-365", name: "Dynamics 365", description: "Sync Dynamics CRM records", category: "business_crm", byokTier: "required", provider: "microsoft", actions: ["upsert-contact"], tags: ["crm", "cross-border"], piiRisk: "high", crossBorder: true }),
  P({ slug: "freshsales", name: "Freshsales", description: "Create and update Freshsales records", category: "business_crm", byokTier: "required", provider: "freshworks", actions: ["upsert-contact"], tags: ["crm"], piiRisk: "high" }),
  P({ slug: "pipedrive", name: "Pipedrive", description: "Manage Pipedrive deals and contacts", category: "business_crm", byokTier: "required", provider: "pipedrive", actions: ["upsert-person", "upsert-deal"], tags: ["crm", "cross-border"], piiRisk: "high", crossBorder: true }),
  P({ slug: "shopify", name: "Shopify", description: "Ecommerce data sync with Shopify", category: "business_crm", byokTier: "required", provider: "shopify", actions: ["read-order", "update-customer"], tags: ["commerce", "cross-border"], piiRisk: "high", crossBorder: true }),
  P({ slug: "stripe", name: "Stripe", description: "Payments and subscription actions", category: "business_crm", byokTier: "required", provider: "stripe", actions: ["create-payment", "create-customer"], tags: ["payments", "cross-border"], piiRisk: "high", crossBorder: true }),
  P({ slug: "razorpay", name: "Razorpay", description: "India payment collection and subscription flows", category: "business_crm", byokTier: "required", provider: "razorpay", actions: ["create-order", "capture-payment"], tags: ["payments", "india", "dpdp"], piiRisk: "high", requiresConsentGate: true }),

  // developer (9)
  P({ slug: "http-request", name: "HTTP Request", description: "Generic REST API caller", category: "developer", byokTier: "optional", provider: "rex", actions: ["request"], tags: ["integration"], piiRisk: "medium", isBuiltin: true }),
  P({ slug: "graphql", name: "GraphQL", description: "GraphQL query and mutation node", category: "developer", byokTier: "optional", provider: "rex", actions: ["query", "mutation"], tags: ["integration"], piiRisk: "medium" }),
  P({ slug: "webhook", name: "Webhook Client", description: "POST workflow output to webhook endpoints", category: "developer", byokTier: "optional", provider: "rex", actions: ["post"], tags: ["integration"], piiRisk: "medium" }),
  P({ slug: "github", name: "GitHub", description: "Read/write GitHub issues and PR metadata", category: "developer", byokTier: "optional", provider: "github", actions: ["create-issue", "comment-pr"], tags: ["devops", "cross-border"], piiRisk: "medium", crossBorder: true }),
  P({ slug: "gitlab", name: "GitLab", description: "Integrate with GitLab merge requests and pipelines", category: "developer", byokTier: "required", provider: "gitlab", actions: ["create-issue", "pipeline-trigger"], tags: ["devops", "cross-border"], piiRisk: "medium", crossBorder: true }),
  P({ slug: "postman-monitor", name: "Postman Monitor", description: "Trigger and inspect Postman monitors", category: "developer", byokTier: "required", provider: "postman", actions: ["trigger-monitor"], tags: ["testing", "cross-border"], piiRisk: "low", crossBorder: true }),
  P({ slug: "aws-lambda", name: "AWS Lambda", description: "Invoke Lambda functions", category: "developer", byokTier: "required", provider: "aws", actions: ["invoke"], tags: ["cloud"], piiRisk: "medium", crossBorder: true }),
  P({ slug: "gcp-functions", name: "Google Cloud Functions", description: "Invoke GCP function endpoints", category: "developer", byokTier: "required", provider: "google", actions: ["invoke"], tags: ["cloud", "cross-border"], piiRisk: "medium", crossBorder: true }),
  P({ slug: "azure-functions", name: "Azure Functions", description: "Invoke Azure function apps", category: "developer", byokTier: "required", provider: "azure", actions: ["invoke"], tags: ["cloud"], piiRisk: "medium" }),

  // data_storage (8)
  P({ slug: "postgres", name: "PostgreSQL", description: "Run SQL against PostgreSQL", category: "data_storage", byokTier: "optional", provider: "postgres", actions: ["select", "insert", "update"], tags: ["database"], piiRisk: "high" }),
  P({ slug: "mysql", name: "MySQL", description: "Run SQL against MySQL", category: "data_storage", byokTier: "optional", provider: "mysql", actions: ["select", "insert", "update"], tags: ["database"], piiRisk: "high" }),
  P({ slug: "mongodb", name: "MongoDB", description: "Query and update MongoDB collections", category: "data_storage", byokTier: "optional", provider: "mongodb", actions: ["find", "update"], tags: ["database"], piiRisk: "high" }),
  P({ slug: "redis", name: "Redis", description: "Read and write Redis keys", category: "data_storage", byokTier: "optional", provider: "redis", actions: ["get", "set"], tags: ["cache"], piiRisk: "medium" }),
  P({ slug: "s3", name: "Amazon S3", description: "Upload and retrieve objects from S3", category: "data_storage", byokTier: "required", provider: "aws", actions: ["put-object", "get-object"], tags: ["storage", "cross-border"], piiRisk: "high", crossBorder: true }),
  P({ slug: "gcs", name: "Google Cloud Storage", description: "Upload and retrieve objects from GCS", category: "data_storage", byokTier: "required", provider: "google", actions: ["put-object", "get-object"], tags: ["storage", "cross-border"], piiRisk: "high", crossBorder: true }),
  P({ slug: "bigquery", name: "BigQuery", description: "Query BigQuery datasets", category: "data_storage", byokTier: "required", provider: "google", actions: ["query"], tags: ["analytics", "cross-border"], piiRisk: "high", crossBorder: true }),
  P({ slug: "snowflake", name: "Snowflake", description: "Execute Snowflake warehouse queries", category: "data_storage", byokTier: "required", provider: "snowflake", actions: ["query"], tags: ["analytics", "cross-border"], piiRisk: "high", crossBorder: true }),

  // trigger (9)
  P({ slug: "manual-trigger", name: "Manual Trigger", description: "Start workflow from the UI", category: "trigger", byokTier: "system", provider: "rex", actions: ["start"], tags: ["core"], isBuiltin: true }),
  P({ slug: "webhook-trigger", name: "Webhook Trigger", description: "Start workflow from HTTP events", category: "trigger", byokTier: "system", provider: "rex", actions: ["listen"], tags: ["core"], isBuiltin: true }),
  P({ slug: "cron-trigger", name: "Cron Trigger", description: "Run workflows on schedules", category: "trigger", byokTier: "system", provider: "rex", actions: ["schedule"], tags: ["core"], isBuiltin: true }),
  P({ slug: "email-inbound-trigger", name: "Email Inbound Trigger", description: "Trigger on inbound mailbox events", category: "trigger", byokTier: "optional", provider: "imap", actions: ["listen"], tags: ["email"], piiRisk: "high" }),
  P({ slug: "queue-trigger", name: "Queue Trigger", description: "Trigger from queue messages", category: "trigger", byokTier: "optional", provider: "rex", actions: ["listen"], tags: ["queue"], piiRisk: "medium" }),
  P({ slug: "file-upload-trigger", name: "File Upload Trigger", description: "Start flows when files are uploaded", category: "trigger", byokTier: "system", provider: "rex", actions: ["listen"], tags: ["files"], piiRisk: "high" }),
  P({ slug: "eventbridge-trigger", name: "AWS EventBridge Trigger", description: "Trigger from EventBridge events", category: "trigger", byokTier: "required", provider: "aws", actions: ["listen"], tags: ["cloud", "cross-border"], piiRisk: "medium", crossBorder: true }),
  P({ slug: "pubsub-trigger", name: "Google Pub/Sub Trigger", description: "Trigger from Pub/Sub topics", category: "trigger", byokTier: "required", provider: "google", actions: ["listen"], tags: ["cloud", "cross-border"], piiRisk: "medium", crossBorder: true }),
  P({ slug: "bbps-webhook-trigger", name: "BBPS Webhook Trigger", description: "Trigger from BBPS billing status callbacks", category: "trigger", byokTier: "required", provider: "bbps", actions: ["listen"], tags: ["india", "payments"], piiRisk: "high", requiresConsentGate: true }),

  // logic_control (9)
  P({ slug: "if-else", name: "If/Else Branch", description: "Route execution based on condition", category: "logic_control", byokTier: "system", provider: "rex", actions: ["branch"], tags: ["core"], isBuiltin: true }),
  P({ slug: "switch", name: "Switch", description: "Multi-branch decision node", category: "logic_control", byokTier: "system", provider: "rex", actions: ["branch"], tags: ["core"], isBuiltin: true }),
  P({ slug: "loop", name: "Loop", description: "Iterate over arrays and batches", category: "logic_control", byokTier: "system", provider: "rex", actions: ["iterate"], tags: ["core"], isBuiltin: true }),
  P({ slug: "retry", name: "Retry", description: "Retry failed operations with backoff", category: "logic_control", byokTier: "system", provider: "rex", actions: ["retry"], tags: ["resilience"], isBuiltin: true }),
  P({ slug: "rate-limit", name: "Rate Limit", description: "Throttle downstream operations", category: "logic_control", byokTier: "system", provider: "rex", actions: ["throttle"], tags: ["resilience"], isBuiltin: true }),
  P({ slug: "dedupe", name: "Deduplicate", description: "Drop duplicate events in processing window", category: "logic_control", byokTier: "system", provider: "rex", actions: ["dedupe"], tags: ["core"], isBuiltin: true }),
  P({ slug: "transformer", name: "Transformer", description: "Transform payload shape with mapping rules", category: "logic_control", byokTier: "system", provider: "rex", actions: ["transform"], tags: ["core"], isBuiltin: true }),
  P({ slug: "mapper", name: "Mapper", description: "Map fields between schemas", category: "logic_control", byokTier: "system", provider: "rex", actions: ["map"], tags: ["core"], isBuiltin: true }),
  P({ slug: "splitter", name: "Splitter", description: "Split records into parallel streams", category: "logic_control", byokTier: "system", provider: "rex", actions: ["split"], tags: ["core"], isBuiltin: true }),

  // compliance_rex (8)
  P({ slug: "consent-gate", name: "Consent Gate", description: "Block processing without valid user consent", category: "compliance_rex", byokTier: "system", provider: "rex", actions: ["enforce-consent"], tags: ["compliance", "dpdp", "gdpr"], piiRisk: "high", requiresConsentGate: true, isBuiltin: true }),
  P({ slug: "pii-anonymiser", name: "PII Anonymiser", description: "Mask or tokenize personal identifiers", category: "compliance_rex", byokTier: "system", provider: "rex", actions: ["anonymise"], tags: ["compliance"], piiRisk: "high", isBuiltin: true }),
  P({ slug: "policy-guardrail", name: "Policy Guardrail", description: "Apply policy checks before external calls", category: "compliance_rex", byokTier: "system", provider: "rex", actions: ["enforce-policy"], tags: ["compliance"], piiRisk: "medium", isBuiltin: true }),
  P({ slug: "dpdp-check", name: "DPDP Check", description: "Evaluate DPDP policy requirements", category: "compliance_rex", byokTier: "system", provider: "rex", actions: ["evaluate"], tags: ["india", "dpdp"], piiRisk: "high", isBuiltin: true }),
  P({ slug: "gdpr-check", name: "GDPR Check", description: "Evaluate GDPR lawful basis and controls", category: "compliance_rex", byokTier: "system", provider: "rex", actions: ["evaluate"], tags: ["gdpr"], piiRisk: "high", isBuiltin: true }),
  P({ slug: "data-residency-check", name: "Data Residency Check", description: "Block cross-region calls based on tenant policy", category: "compliance_rex", byokTier: "system", provider: "rex", actions: ["enforce-residency"], tags: ["compliance", "cross-border"], piiRisk: "medium", crossBorder: true, isBuiltin: true }),
  P({ slug: "audit-log", name: "Audit Log Node", description: "Emit immutable audit events for critical actions", category: "compliance_rex", byokTier: "system", provider: "rex", actions: ["emit-audit"], tags: ["compliance"], piiRisk: "low", isBuiltin: true }),
  P({ slug: "risk-scorer", name: "REX Risk Scorer", description: "Compute workflow trust and compliance score", category: "compliance_rex", byokTier: "system", provider: "rex", actions: ["score"], tags: ["compliance"], piiRisk: "low", isBuiltin: true }),

  // india_stack (8)
  P({ slug: "aadhaar-ekyc", name: "Aadhaar eKYC", description: "Perform Aadhaar identity verification", category: "india_stack", byokTier: "required", provider: "uidai", actions: ["verify-identity"], tags: ["india", "identity", "dpdp"], piiRisk: "high", requiresConsentGate: true }),
  P({ slug: "digilocker", name: "DigiLocker", description: "Fetch user-authorized documents from DigiLocker", category: "india_stack", byokTier: "required", provider: "digilocker", actions: ["fetch-document"], tags: ["india", "identity", "dpdp"], piiRisk: "high", requiresConsentGate: true }),
  P({ slug: "gstin-verify", name: "GSTIN Verify", description: "Verify GSTIN records", category: "india_stack", byokTier: "required", provider: "gst", actions: ["verify-gstin"], tags: ["india", "tax"], piiRisk: "medium" }),
  P({ slug: "gstr-filing", name: "GSTR Filing", description: "Submit GSTR workflows to filing APIs", category: "india_stack", byokTier: "required", provider: "gst", actions: ["file-gstr"], tags: ["india", "tax"], piiRisk: "high", requiresConsentGate: true }),
  P({ slug: "upi", name: "UPI", description: "UPI collect and payment status workflows", category: "india_stack", byokTier: "required", provider: "upi", actions: ["collect", "status"], tags: ["india", "payments"], piiRisk: "high", requiresConsentGate: true }),
  P({ slug: "bbps", name: "BBPS", description: "Bharat Bill Payment System integration", category: "india_stack", byokTier: "required", provider: "bbps", actions: ["fetch-bill", "pay-bill"], tags: ["india", "payments"], piiRisk: "high", requiresConsentGate: true }),
  P({ slug: "ckyc", name: "CKYC", description: "Central KYC lookup and validation", category: "india_stack", byokTier: "required", provider: "ckyc", actions: ["lookup-kyc"], tags: ["india", "identity", "dpdp"], piiRisk: "high", requiresConsentGate: true }),
  P({ slug: "account-aggregator", name: "Account Aggregator", description: "FIU/FIP consented financial data flows", category: "india_stack", byokTier: "required", provider: "aa", actions: ["create-consent", "fetch-financial-data"], tags: ["india", "finance", "dpdp"], piiRisk: "high", requiresConsentGate: true }),
];

if (pluginRegistryCatalogue.length !== 78) {
  throw new Error(`Expected 78 plugins in registry, found ${pluginRegistryCatalogue.length}`);
}

export const pluginRegistryCategories = Array.from(
  new Set(pluginRegistryCatalogue.map((plugin) => plugin.category))
);
