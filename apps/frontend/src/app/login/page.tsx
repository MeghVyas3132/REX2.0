"use client";

import { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (mode === "register") {
        const res = await api.auth.register(email, name, password);
        login(res.data.token, res.data.user);
      } else {
        const res = await api.auth.login(email, password);
        login(res.data.token, res.data.user);
      }
      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h1 style={styles.title}>REX</h1>
        <p style={styles.subtitle}>Workflow Automation Engine</p>

        <div style={styles.tabs}>
          <button
            style={mode === "login" ? styles.tabActive : styles.tab}
            onClick={() => setMode("login")}
          >
            Sign In
          </button>
          <button
            style={mode === "register" ? styles.tabActive : styles.tab}
            onClick={() => setMode("register")}
          >
            Register
          </button>
        </div>

        <form onSubmit={handleSubmit} style={styles.form}>
          {mode === "register" && (
            <input
              type="text"
              placeholder="Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              style={styles.input}
              required
            />
          )}
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={styles.input}
            required
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={styles.input}
            required
            minLength={8}
          />

          {error && <p style={styles.error}>{error}</p>}

          <button type="submit" style={styles.button} disabled={loading}>
            {loading ? "Processing..." : mode === "login" ? "Sign In" : "Create Account"}
          </button>
        </form>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#0a0a0a",
  },
  card: {
    width: "100%",
    maxWidth: "400px",
    padding: "40px",
    backgroundColor: "#111111",
    border: "1px solid #2a2a2a",
    borderRadius: "8px",
  },
  title: {
    fontSize: "32px",
    fontWeight: 700,
    color: "#e5e5e5",
    textAlign: "center" as const,
    marginBottom: "4px",
    letterSpacing: "4px",
  },
  subtitle: {
    fontSize: "13px",
    color: "#666666",
    textAlign: "center" as const,
    marginBottom: "32px",
  },
  tabs: {
    display: "flex",
    gap: "0",
    marginBottom: "24px",
    borderBottom: "1px solid #2a2a2a",
  },
  tab: {
    flex: 1,
    padding: "10px",
    background: "none",
    border: "none",
    color: "#666666",
    cursor: "pointer",
    fontSize: "14px",
    transition: "color 0.2s",
  },
  tabActive: {
    flex: 1,
    padding: "10px",
    background: "none",
    border: "none",
    borderBottom: "2px solid #e5e5e5",
    color: "#e5e5e5",
    cursor: "pointer",
    fontSize: "14px",
    fontWeight: 600,
  },
  form: {
    display: "flex",
    flexDirection: "column" as const,
    gap: "12px",
  },
  input: {
    padding: "12px 16px",
    backgroundColor: "#1a1a1a",
    border: "1px solid #2a2a2a",
    borderRadius: "6px",
    color: "#e5e5e5",
    fontSize: "14px",
    outline: "none",
    transition: "border-color 0.2s",
  },
  button: {
    padding: "12px",
    backgroundColor: "#e5e5e5",
    color: "#0a0a0a",
    border: "none",
    borderRadius: "6px",
    fontSize: "14px",
    fontWeight: 600,
    cursor: "pointer",
    marginTop: "8px",
    transition: "opacity 0.2s",
  },
  error: {
    color: "#ef4444",
    fontSize: "13px",
    margin: 0,
  },
};
