import Link from "next/link";

const demo = [
  { id: "customer-query-analyser", title: "Customer query analyser" },
  { id: "incident-triage", title: "Incident triage" },
];

export default function BusinessWorkflowsPage() {
  return (
    <section>
      <h1>Published workflows</h1>
      <ul>
        {demo.map((item) => (
          <li key={item.id}>
            <Link href={`/business/workflows/${item.id}`}>{item.title}</Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
