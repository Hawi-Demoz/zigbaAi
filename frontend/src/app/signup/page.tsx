"use client";

import { useState } from "react";
import Link from "next/link";
import { signup } from "@/app/auth/actions";

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
    <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-xl p-8 shadow-2xl">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-bold text-white tracking-tight">Create an Account</h1>
          <p className="text-sm text-slate-400 mt-1">
            Join the evidence-based network as a candidate or employer
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-rose-950/60 border border-rose-800 text-rose-200 text-sm rounded-lg">
            {error}
          </div>
        )}

        {successMessage ? (
          <div className="space-y-4 text-center">
            <div className="p-4 bg-emerald-950/60 border border-emerald-800 text-emerald-200 text-sm rounded-lg">
              <p className="font-semibold text-base mb-1">Check Your Email</p>
              <p>{successMessage}</p>
            </div>
            <Link
              href="/login"
              className="inline-block text-sm text-emerald-400 hover:underline font-semibold"
            >
              Return to Login
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1">
                Full Name
              </label>
              <input
                name="full_name"
                type="text"
                required
                placeholder="Jane Doe"
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1">
                Email Address
              </label>
              <input
                name="email"
                type="email"
                required
                placeholder="you@example.com"
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1">
                Password
              </label>
              <input
                name="password"
                type="password"
                required
                minLength={6}
                placeholder="•••••••• (min 6 characters)"
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1">
                I am joining as a
              </label>
              <div className="grid grid-cols-2 gap-3 mt-1">
                <label
                  className={`flex flex-col items-center justify-center p-3 border rounded-lg cursor-pointer transition-colors text-center ${
                    selectedRole === "candidate"
                      ? "border-emerald-500 bg-emerald-950/30 text-white"
                      : "border-slate-800 bg-slate-950/60 text-slate-400 hover:border-slate-700"
                  }`}
                >
                  <input
                    type="radio"
                    name="role"
                    value="candidate"
                    checked={selectedRole === "candidate"}
                    onChange={() => setSelectedRole("candidate")}
                    className="sr-only"
                  />
                  <span className="font-semibold text-sm">Candidate</span>
                  <span className="text-[11px] text-slate-400 mt-0.5">Seeking roles</span>
                </label>

                <label
                  className={`flex flex-col items-center justify-center p-3 border rounded-lg cursor-pointer transition-colors text-center ${
                    selectedRole === "employer"
                      ? "border-emerald-500 bg-emerald-950/30 text-white"
                      : "border-slate-800 bg-slate-950/60 text-slate-400 hover:border-slate-700"
                  }`}
                >
                  <input
                    type="radio"
                    name="role"
                    value="employer"
                    checked={selectedRole === "employer"}
                    onChange={() => setSelectedRole("employer")}
                    className="sr-only"
                  />
                  <span className="font-semibold text-sm">Employer</span>
                  <span className="text-[11px] text-slate-400 mt-0.5">Hiring talent</span>
                </label>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-medium rounded-lg text-sm transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer mt-2"
            >
              {loading ? "Creating Account..." : "Sign Up"}
            </button>
          </form>
        )}

        <div className="mt-6 text-center text-xs text-slate-400">
          Already have an account?{" "}
          <Link href="/login" className="text-emerald-400 hover:underline font-semibold">
            Sign In
          </Link>
        </div>
      </div>
    </div>
  );
}
