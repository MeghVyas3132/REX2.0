import Link from "next/link";

export default function HomePage() {
  return (
    <main className="center-page">
      <h1>REX Frontend</h1>
      <p>Baseline initialized. Choose an entry path.</p>
      <div>
        <Link className="button button-primary" href="/select-mode">
          Get Started
        </Link>
      </div>
      <div className="link-row">
        <Link href="/login">Login</Link>
        <Link href="/register">Register</Link>
        <Link href="/dashboard">App</Link>
      </div>
    </main>
  );
}
