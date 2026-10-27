"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { login } from "@/app/auth/actions";
import { SiteHeader } from "@/components/layout/site-header";
import { Alert } from "@/components/ui/alert";
import { Field, TextInput } from "@/components/ui/field";
import { SkeletonPage } from "@/components/ui/skeleton";

function LoginForm() {
  const searchParams = useSearchParams();
  const initialMessage = searchParams.get("message");
  const initialError = searchParams.get("error");

  const [error, setError] = useState<string | null>(initialError);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setLoading(true);

    const formData = new FormData(event.currentTarget);
    const result = await login(formData);

    if (result?.error) {
      setError(result.error);
      setLoading(false);
    }
  }

  return (
    <div className="auth__card">
      <div className="auth__intro">
        <h1>Welcome back</h1>
        <p>Sign in to your evidence-based professional dashboard.</p>
      </div>

      {initialMessage && <Alert tone="info">{initialMessage}</Alert>}
      {error && <Alert tone="error">{error}</Alert>}

      <form onSubmit={handleSubmit} className="auth__form" style={{ marginTop: "1rem" }}>
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
            autoComplete="current-password"
            placeholder="Your password"
          />
        </Field>

        <button type="submit" disabled={loading} className="btn btn--primary btn--block">
          {loading ? "Signing in…" : "Sign in"}
        </button>
      </form>

      <p className="auth__foot">
        Don&apos;t have an account? <Link href="/signup">Create an account</Link>
      </p>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="shell">
      <SiteHeader
        compact
        trailing={
          <Link href="/signup" className="btn btn--ghost">
            Create account
          </Link>
        }
      />
      <main className="auth">
        <Suspense fallback={<SkeletonPage label="Loading sign in" />}>
          <LoginForm />
        </Suspense>
      </main>
    </div>
  );
}
