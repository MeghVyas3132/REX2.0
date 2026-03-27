"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/Button";

type GlobalErrorPageProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function GlobalErrorPage({ error, reset }: GlobalErrorPageProps) {
  useEffect(() => {
    console.error("Unhandled app error", error);
  }, [error]);

  return (
    <main className="center-page">
      <h1>Something went wrong</h1>
      <p>Unexpected app error. Please retry.</p>
      <Button onClick={reset}>Try again</Button>
    </main>
  );
}
