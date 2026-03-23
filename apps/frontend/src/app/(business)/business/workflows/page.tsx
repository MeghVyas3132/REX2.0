import Link from "next/link";

const demo = [
  { id: "customer-query-analyser", title: "Customer query analyser", team: "Support", trust: "certified" },
  { id: "incident-triage", title: "Incident triage", team: "Operations", trust: "attention" },
];

export default function BusinessWorkflowsPage() {
  return (
    <section className="control-header">
      <h1>Published Workflows</h1>
      <p>Templates approved by Studio and ready for business execution.</p>
      <ul className="control-list">
        {demo.map((item) => (
          <li key={item.id}>
            <span>
              {item.title} · {item.team}
            </span>
            <span>
              <span className={item.trust === "certified" ? "control-badge" : "control-badge control-badge--warn"}>
                {item.trust}
              </span>{" "}
              <Link className="control-link" href={`/business/workflows/${item.id}`}>Run</Link>
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
