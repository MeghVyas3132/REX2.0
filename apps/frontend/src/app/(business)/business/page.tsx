import Link from "next/link";

export default function BusinessPage() {
  return (
    <section>
      <h1>Your published workflows</h1>
      <p>Run approved automations without opening the technical editor.</p>
      <p><Link href="/business/workflows">Browse workflows</Link></p>
    </section>
  );
}
