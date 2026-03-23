"use client";

import { useMemo, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LoginPage() {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const router = useRouter();

  const emailLooksValid = useMemo(() => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email), [email]);
  const nameLooksValid = useMemo(() => name.trim().length >= 2, [name]);
  const passwordChecks = useMemo(() => {
    const hasLength = password.length >= 8;
    const hasMixedCase = /[a-z]/.test(password) && /[A-Z]/.test(password);
    const hasNumber = /\d/.test(password);
    const hasSymbol = /[^A-Za-z0-9]/.test(password);
    const score = Number(hasLength) + Number(hasMixedCase) + Number(hasNumber) + Number(hasSymbol);
    return { hasLength, hasMixedCase, hasNumber, hasSymbol, score };
  }, [password]);

  const passwordStrength = useMemo(() => {
    if (!password) return { label: "", tone: "" };
    if (passwordChecks.score <= 1) return { label: "Weak", tone: "weak" };
    if (passwordChecks.score === 2) return { label: "Fair", tone: "fair" };
    if (passwordChecks.score === 3) return { label: "Good", tone: "good" };
    return { label: "Strong", tone: "strong" };
  }, [password, passwordChecks.score]);

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
    <div className="auth-root auth-root--quiet">
      <div className="auth-grid" aria-hidden="true" />

      <Link href="/" className="auth-home-link">← Back to Home</Link>

      <div className="auth-panel page-reveal">
        <Link href="/" className="auth-brand-link">REX</Link>
        <h1 className="auth-title">Welcome back</h1>
        <p className="auth-subtitle">Sign in to continue building trusted workflows.</p>

        <div className="auth-tabs" role="tablist" aria-label="Authentication mode">
          <button
            type="button"
            className={mode === "login" ? "auth-tab is-active" : "auth-tab"}
            aria-selected={mode === "login"}
            onClick={() => setMode("login")}
          >
            Sign in
          </button>
          <button
            type="button"
            className={mode === "register" ? "auth-tab is-active" : "auth-tab"}
            aria-selected={mode === "register"}
            onClick={() => setMode("register")}
          >
            Create account
          </button>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          {mode === "register" && (
            <label className="auth-field">
              <span>Name</span>
              <input
                type="text"
                placeholder="Jane Doe"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className={`auth-input${name && !nameLooksValid ? " is-invalid" : ""}`}
                required
              />
              {name && !nameLooksValid ? <p className="auth-hint auth-hint--error">Use at least 2 characters.</p> : null}
            </label>
          )}

          <label className="auth-field">
            <span>Email</span>
            <input
              type="email"
              placeholder="you@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={`auth-input${email && !emailLooksValid ? " is-invalid" : ""}`}
              required
            />
            {email && !emailLooksValid ? <p className="auth-hint auth-hint--error">Enter a valid email address.</p> : null}
          </label>

          <label className="auth-field">
            <span>Password</span>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="auth-input"
              required
              minLength={8}
            />
            {(mode === "register" || password.length > 0) && (
              <div className="auth-strength">
                <div className="auth-strength__meter" aria-hidden="true">
                  <span className={passwordChecks.score >= 1 ? `active ${passwordStrength.tone}` : ""} />
                  <span className={passwordChecks.score >= 2 ? `active ${passwordStrength.tone}` : ""} />
                  <span className={passwordChecks.score >= 3 ? `active ${passwordStrength.tone}` : ""} />
                  <span className={passwordChecks.score >= 4 ? `active ${passwordStrength.tone}` : ""} />
                </div>
                {passwordStrength.label ? (
                  <p className="auth-strength__label">Strength: <strong>{passwordStrength.label}</strong></p>
                ) : null}
                {mode === "register" ? (
                  <ul className="auth-checks">
                    <li className={passwordChecks.hasLength ? "ok" : ""}>At least 8 characters</li>
                    <li className={passwordChecks.hasMixedCase ? "ok" : ""}>Upper + lowercase letters</li>
                    <li className={passwordChecks.hasNumber ? "ok" : ""}>One number</li>
                    <li className={passwordChecks.hasSymbol ? "ok" : ""}>One special symbol</li>
                  </ul>
                ) : null}
              </div>
            )}
          </label>

          {error && <p className="auth-error">{error}</p>}

          <button type="submit" className="auth-submit" disabled={loading}>
            {loading ? "Processing..." : mode === "login" ? "Sign in" : "Create account"}
          </button>
        </form>

        <p className="auth-footnote">Responsible automation for regulated teams.</p>
      </div>
    </div>
  );
}
