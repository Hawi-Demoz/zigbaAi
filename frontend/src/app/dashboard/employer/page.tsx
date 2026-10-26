import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { signout } from "@/app/auth/actions";

export const dynamic = "force-dynamic";

export default async function EmployerDashboardPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, headline, bio, role")
    .eq("id", user.id)
    .single();

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      {/* Top Navigation */}
      <header className="border-b border-slate-800 bg-slate-900/60 backdrop-blur px-6 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="h-8 w-8 rounded-lg bg-blue-600 flex items-center justify-center font-bold text-white text-sm">
            Z
          </div>
          <span className="font-semibold tracking-tight text-white">Zigba AI Network</span>
          <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-blue-950 border border-blue-700 text-blue-300">
            Employer
          </span>
        </div>

        <div className="flex items-center space-x-4">
          <span className="text-xs text-slate-400 hidden sm:inline">{user.email}</span>
          <form action={signout}>
            <button
              type="submit"
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-lg transition-colors cursor-pointer border border-slate-700"
            >
              Sign Out
            </button>
          </form>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-5xl mx-auto p-6 mt-6">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-sm mb-6">
          <h1 className="text-2xl font-bold text-white">
            Welcome, {profile?.full_name || "Employer"}!
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            {profile?.headline || "Manage jobs and review verified candidate evidence."}
          </p>
        </div>

        {/* Feature Placeholders */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5">
            <h2 className="font-semibold text-white text-base">Company Jobs</h2>
            <p className="text-xs text-slate-400 mt-1 mb-4">
              Post listings with must-have & nice-to-have proofs.
            </p>
            <div className="h-24 border border-dashed border-slate-800 rounded-lg flex items-center justify-center text-xs text-slate-500">
              No active job listings
            </div>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5">
            <h2 className="font-semibold text-white text-base">Received Applications</h2>
            <p className="text-xs text-slate-400 mt-1 mb-4">
              Review candidates and examine their code evidence.
            </p>
            <div className="h-24 border border-dashed border-slate-800 rounded-lg flex items-center justify-center text-xs text-slate-500">
              No applications to review
            </div>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5">
            <h2 className="font-semibold text-white text-base">Candidate Evidence</h2>
            <p className="text-xs text-slate-400 mt-1 mb-4">
              Inspect pull requests, test logs, and live demos.
            </p>
            <div className="h-24 border border-dashed border-slate-800 rounded-lg flex items-center justify-center text-xs text-slate-500">
              Zero unreviewed claims
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
