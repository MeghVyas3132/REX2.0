ALTER TABLE "plugin_catalogue"
DROP CONSTRAINT IF EXISTS "plugin_catalogue_category_check";

ALTER TABLE "plugin_catalogue"
ADD CONSTRAINT "plugin_catalogue_category_check"
CHECK (
  "category" IN (
    'ai_llm',
    'data_storage',
    'communication',
    'business_crm',
    'logic_control',
    'trigger',
    'compliance_rex',
    'developer',
    'india_stack'
  )
);
