"use client";

import { useState } from "react";

export default function BusinessWorkflowRunPage() {
  const [status, setStatus] = useState<"idle" | "running" | "done">("idle");

  return (
    <section>
      <h1>Run workflow</h1>
      <p>Enter required inputs and start a monitored execution.</p>
      <button
        onClick={() => {
          setStatus("running");
          setTimeout(() => setStatus("done"), 1800);
        }}
      >
        Run workflow
      </button>
      {status === "running" && <p>Step 1 of 3: Collecting data...</p>}
      {status === "done" && <p>Completed. This workflow is REX certified.</p>}
    </section>
  );
}
