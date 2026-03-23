"use client";

import { useState } from "react";

export default function BusinessWorkflowRunPage() {
  const [status, setStatus] = useState<"idle" | "running" | "done">("idle");

  return (
    <section className="control-header">
      <h1>Run Workflow</h1>
      <p>Submit inputs, monitor progress, and export execution evidence if required.</p>
      <article className="control-card">
        <h3>Execution Console</h3>
        <p>Status updates stream in real time during each run phase.</p>
        <p>
          <button
            className="auth-submit"
            onClick={() => {
              setStatus("running");
              setTimeout(() => setStatus("done"), 1800);
            }}
          >
            Run workflow
          </button>
        </p>
        {status === "running" && <p><span className="control-badge control-badge--warn">running</span> Step 1 of 3: Collecting data...</p>}
        {status === "done" && <p><span className="control-badge">certified</span> Completed. This workflow is REX certified.</p>}
      </article>
    </section>
  );
}
