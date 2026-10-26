import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between">
      {/* Navigation */}
      <header className="border-b border-slate-800/80 px-8 py-5 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="h-9 w-9 rounded-xl bg-emerald-600 flex items-center justify-center font-bold text-white text-base shadow-lg shadow-emerald-950">
            Z
          </div>
          <span className="font-bold tracking-tight text-lg text-white">Zigba AI Network</span>
        </div>
        <div className="flex items-center space-x-4">
          <Link
            href="/login"
            className="text-sm font-medium text-slate-300 hover:text-white transition-colors"
          >
            Sign In
          </Link>
          <Link
            href="/signup"
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium rounded-lg transition-colors shadow-md shadow-emerald-950/50"
          >
            Create Account
          </Link>
        </div>
      </header>

      {/* Hero */}
      <main className="max-w-4xl mx-auto px-6 py-20 text-center flex flex-col items-center">
        <div className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-emerald-950/80 border border-emerald-800 text-emerald-300 mb-6">
          Evidence Over Claims • Real Proof of Competence
        </div>
        <h1 className="text-4xl sm:text-5xl font-extrabold text-white tracking-tight leading-tight max-w-2xl">
          The Professional Network Built on Verified Proof.
        </h1>
        <p className="text-base sm:text-lg text-slate-400 mt-4 max-w-xl">
          Connect candidates and employers with verifiable code, project artifacts, and independent checks. Beginners without work history can fully participate.
        </p>

        <div className="mt-8 flex flex-col sm:flex-row gap-4">
          <Link
            href="/signup"
            className="px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-medium rounded-lg text-sm transition-colors shadow-lg shadow-emerald-950"
          >
            Join as Candidate or Employer
          </Link>
          <Link
            href="/dashboard"
            className="px-6 py-3 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 font-medium rounded-lg text-sm transition-colors"
          >
            Go to Dashboard
          </Link>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 py-6 text-center text-xs text-slate-500">
        © 2026 Zigba AI Network. Evidence over claims.
      </footer>
    </div>
  );
}
