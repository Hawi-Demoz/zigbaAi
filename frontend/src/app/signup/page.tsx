"use client";

import { useState } from "react";
import Link from "next/link";
import { signup } from "@/app/auth/actions";
import { SiteHeader } from "@/components/layout/site-header";
import { Alert } from "@/components/ui/alert";
import { Field, TextInput } from "@/components/ui/field";

export default function SignupPage() {
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedRole, setSelectedRole] = useState<"candidate" | "employer">("candidate");

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSuccessMessage(null);
    setLoading(true);

    const formData = new FormData(event.currentTarget);
    const result = await signup(formData);

    if (result?.error) {
      setError(result.error);
      setLoading(false);
    } else if (result?.success) {
      setSuccessMessage(result.message);
      setLoading(false);
    }
  }

  return (
    <div className="shell">
      <SiteHeader
        compact
        trailing={
          <Link href="/login" className="btn btn--ghost">
            Sign in
          </Link>
        }
      />
      <main className="auth">
        <div className="auth__card">
          <div className="auth__intro">
            <h1>Create an account</h1>
            <p>Join as a candidate showing proof, or as an employer who will be verified.</p>
          </div>

          {error && <Alert tone="error">{error}</Alert>}

          {successMessage ? (
            <div className="stack">
              <Alert tone="success" title="Check your email">
                {successMessage}
              </Alert>
              <Link href="/login" className="btn btn--secondary btn--block">
                Return to sign in
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="auth__form">
              <Field label="Full name">
                <TextInput
                  name="full_name"
                  type="text"
                  required
                  autoComplete="name"
                  placeholder="Your name"
                />
              </Field>

              <Field label="Email address">
                <TextInput
                  name="email"
                  type="email"
                  required
                  autoComplete="email"
                  placeholder="you@example.com"
                />
              </Field>

              <Field label="Password">
                <TextInput
                  name="password"
                  type="password"
                  required
                  minLength={6}
                  autoComplete="new-password"
                  placeholder="At least 6 characters"
                />
              </Field>

              <Field label="I am joining as">
                <div className="choice">
                  <label>
                    <input
                      type="radio"
                      name="role"
                      value="candidate"
                      checked={selectedRole === "candidate"}
                      onChange={() => setSelectedRole("candidate")}
                      className="sr-only"
                    />
                    <span>Candidate</span>
                    <small>Seeking roles with proof</small>
                  </label>
                  <label>
                    <input
                      type="radio"
                      name="role"
                      value="employer"
                      checked={selectedRole === "employer"}
                      onChange={() => setSelectedRole("employer")}
                      className="sr-only"
                    />
                    <span>Employer</span>
                    <small>Hiring after verification</small>
                  </label>
                </div>
              </Field>

              <button type="submit" disabled={loading} className="btn btn--primary btn--block">
                {loading ? "Creating account…" : "Sign up"}
              </button>
            </form>
          )}

          <p className="auth__foot">
            Already have an account? <Link href="/login">Sign in</Link>
          </p>
        </div>
      </main>
    </div>
  );
}
