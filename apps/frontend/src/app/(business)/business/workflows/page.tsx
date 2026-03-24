"use client";

import Link from "next/link";
import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";

type WorkflowRow = {
  id: string;
  name: string;
  status: string;
};

type TemplateLookup = Record<string, string>;

export default function BusinessWorkflowsPage() {
  return (
    <Suspense fallback={null}>
      <BusinessWorkflowsContent />
    </Suspense>
  );
}

function BusinessWorkflowsContent() {
  const { token, loading: authLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const selectedTemplate = searchParams.get("template");
  const [workflows, setWorkflows] = useState<WorkflowRow[]>([]);
  const [templateNames, setTemplateNames] = useState<TemplateLookup>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!token) {
      router.push("/login");
      return;
    }

    const load = async () => {
      try {
        setError(null);
        const [workflowsRes, templatesRes] = await Promise.all([
          api.workflows.list(token, 1, 50),
          api.templates.list(token),
        ]);

        setWorkflows(workflowsRes.data.map((item) => ({ id: item.id, name: item.name, status: item.status })));
        const lookup: TemplateLookup = {};
        templatesRes.data.forEach((template) => {
          lookup[template.id] = template.name;
        });
        setTemplateNames(lookup);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load workflows");
      } finally {
        setIsLoading(false);
      }
    };

    void load();
  }, [authLoading, token, router]);

  const selectedTemplateLabel = useMemo(() => {
    if (!selectedTemplate) return null;
    return templateNames[selectedTemplate] ?? selectedTemplate;
  }, [selectedTemplate, templateNames]);

  if (authLoading || !token) return null;

  return (
    <section className="control-header">
      <h1>Published Workflows</h1>
      <p>Templates approved by Studio and ready for business execution with minimal setup.</p>

      {error ? <p className="control-error">{error}</p> : null}

      {isLoading ? <article className="control-card control-skeleton" /> : null}

      {selectedTemplate ? (
        <article className="control-card business-selected-template">
          <h3>Template selected</h3>
          <p>
            You chose <strong>{selectedTemplateLabel}</strong>. Create or reuse a workflow with business-safe defaults.
          </p>
          <p>
            <Link className="control-link" href={`/dashboard/templates/${selectedTemplate}`}>Open template details</Link>
          </p>
        </article>
      ) : null}

      <ul className="control-list">
        {!isLoading && workflows.length === 0 ? (
          <li>
            <span className="control-empty">No workflows are currently published for business execution.</span>
          </li>
        ) : null}
        {workflows.map((item) => (
          <li key={item.id}>
            <span>
              {item.name}
            </span>
            <span>
              <span className={item.status === "active" ? "control-badge" : "control-badge control-badge--warn"}>
                {item.status}
              </span>{" "}
              <Link className="control-link" href={`/business/workflows/${item.id}`}>Run</Link>
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
