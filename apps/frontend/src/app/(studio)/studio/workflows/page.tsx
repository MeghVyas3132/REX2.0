import Link from "next/link";

export default function StudioWorkflowsPage() {
  return (
    <section>
      <h1>Studio Workflows</h1>
      <p>Choose a workflow to edit in the DAG canvas.</p>
      <ul>
        <li><Link href="/dashboard/workflows">Open existing dashboard workflows</Link></li>
      </ul>
    </section>
  );
}
