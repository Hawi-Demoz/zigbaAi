import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/utils/supabase/server";
import { signout } from "@/app/auth/actions";

export const dynamic = "force-dynamic";

export default async function CandidateDashboardPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, headline, bio, role, visibility, location")
    .eq("id", user.id)
    .single();

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      {/* Top Navigation */}
      <header className="border-b border-slate-800 bg-slate-900/60 backdrop-blur px-6 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="h-8 w-8 rounded-lg bg-emerald-600 flex items-center justify-center font-bold text-white text-sm">
            Z
          </div>
          <span className="font-semibold tracking-tight text-white">Zigba AI Network</span>
          <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-emerald-950 border border-emerald-700 text-emerald-300">
            Candidate
          </span>
        </div>

        <div className="flex items-center space-x-4">
          <Link
            href="/dashboard/candidate/profile"
            className="text-xs text-slate-300 hover:text-white transition-colors"
          >
            My Profile
          </Link>
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
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-sm mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-2xl font-bold text-white">
                Welcome, {profile?.full_name || "Candidate"}!
              </h1>
              <span className="px-2 py-0.5 text-[10px] uppercase tracking-wider font-semibold rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                {profile?.visibility || "Employers Only"}
              </span>
            </div>
            <p className="text-sm text-slate-400 mt-1">
              {profile?.headline || "Your evidence-based candidate profile is ready."}
            </p>
            {profile?.location && (
              <p className="text-xs text-slate-500 mt-0.5">📍 {profile.location}</p>
            )}
          </div>

          <Link
            href="/dashboard/candidate/profile"
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium rounded-lg transition-colors shadow-md shadow-emerald-950 cursor-pointer"
          >
            Edit Profile, Skills & Studies
          </Link>
        </div>

        {/* Feature Placeholders */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5">
            <h2 className="font-semibold text-white text-base">My Evidence Items</h2>
            <p className="text-xs text-slate-400 mt-1 mb-4">
              Add verified proof of code, projects, and skills.
            </p>
            <div className="h-24 border border-dashed border-slate-800 rounded-lg flex items-center justify-center text-xs text-slate-500">
              No evidence submitted yet
            </div>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5">
            <h2 className="font-semibold text-white text-base">My Applications</h2>
            <p className="text-xs text-slate-400 mt-1 mb-4">
              Track the status of your applications.
            </p>
            <div className="h-24 border border-dashed border-slate-800 rounded-lg flex items-center justify-center text-xs text-slate-500">
              No active applications
            </div>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5">
            <h2 className="font-semibold text-white text-base">Verified Badges</h2>
            <p className="text-xs text-slate-400 mt-1 mb-4">
              Independently reviewed competence proofs.
            </p>
            <div className="h-24 border border-dashed border-slate-800 rounded-lg flex items-center justify-center text-xs text-slate-500">
              Level: Self-Reported
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
