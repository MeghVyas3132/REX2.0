#!/usr/bin/env bash
set -euo pipefail

ROOT="/Users/meghvyas/Desktop/REX2.0/apps/frontend/src/components"

mkdir -p "$ROOT/workflows" "$ROOT/executions" "$ROOT/knowledge" "$ROOT/templates" "$ROOT/governance" "$ROOT/compliance" "$ROOT/tenant" "$ROOT/admin" "$ROOT/tools"

make_component() {
  local dir="$1"
  local name="$2"
  cat > "$ROOT/$dir/$name.tsx" <<EOF
"use client";

import React from "react";

export type ${name}Props = {
  className?: string;
};

export function ${name}({ className }: ${name}Props) {
  return (
    <section className={className}>
      <h3>${name}</h3>
    </section>
  );
}
EOF
}

for c in WorkflowListTable WorkflowFilters WorkflowCreateForm WorkflowHeaderActions WorkflowGraphEditor WorkflowRexPanel; do make_component workflows "$c"; done
for c in ExecutionStatusHeader ExecutionStepTimeline ExecutionAttemptTable RetrievalEventsTable ContextSnapshotDiffView; do make_component executions "$c"; done
for c in CorporaTable CreateCorpusModal DocumentIngestionForm DocumentsTable ChunksTable KnowledgeQueryConsole; do make_component knowledge "$c"; done
for c in TemplateGrid TemplateDetailPanel TemplatePreviewGraph InstantiateTemplateModal; do make_component templates "$c"; done
for c in ModelRegistryTable DomainConfigEditor WorkspaceTable WorkspaceMemberManager WorkflowPermissionEditor PolicyEditor HyperparameterProfileEditor ProfileComparisonResult AlertRulesTable AlertEventsTable MetricsCardGrid TimeseriesChart; do make_component governance "$c"; done
for c in ConsentTable RetentionPolicyEditor RetentionSweepAction LegalBasisForm DataSubjectRequestQueue DataSubjectResponseModal ComplianceReportPanels PrivacyActionPanel; do make_component compliance "$c"; done
for c in TenantProfileForm TenantUsersTable InviteUserModal TenantPluginCards ByokConfigPanel TenantPlanPanel TenantUsagePanel; do make_component tenant "$c"; done
for c in TenantsTable TenantDetailTabs AdminTenantUsersPanel AdminTenantPlanPanel AdminTenantPluginPanel AdminPluginsTable AuditLogExplorer; do make_component admin "$c"; done
for c in ApiKeysManager ChatAssistantConsole FileParseUploader ParsedFilePreview; do make_component tools "$c"; done

for d in workflows executions knowledge templates governance compliance tenant admin tools; do
  {
    echo "// Auto-generated exports"
    for f in "$ROOT/$d"/*.tsx; do
      base=$(basename "$f" .tsx)
      echo "export { $base } from \"./$base\";"
      echo "export type { ${base}Props } from \"./$base\";"
    done
  } > "$ROOT/$d/index.ts"
done

echo "Generated domain components successfully."
