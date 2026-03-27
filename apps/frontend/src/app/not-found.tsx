import Link from "next/link";

export default function GlobalNotFoundPage() {
  return (
    <main className="center-page">
      <h1>Not Found</h1>
      <p>The page you requested does not exist.</p>
      <div className="link-row">
        <Link href="/dashboard">Go to dashboard</Link>
      </div>
    </main>
  );
}
