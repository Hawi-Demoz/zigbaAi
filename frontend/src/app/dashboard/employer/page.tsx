import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { signout } from "@/app/auth/actions";
import { AppHeader } from "@/components/layout/app-header";
import { Card, CardHeader } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";

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
    <div className="shell">
      <AppHeader role="Employer" email={user.email}>
        <form action={signout}>
          <button type="submit" className="btn btn--secondary">
            Sign out
          </button>
        </form>
      </AppHeader>

      <main className="page page--app">
        <div className="welcome">
          <div>
            <h1 className="display" style={{ fontSize: "clamp(1.8rem, 4vw, 2.6rem)" }}>
              Welcome, {profile?.full_name || "Employer"}
            </h1>
            <p className="lede">
              {profile?.headline || "Manage jobs and review verified candidate evidence."}
            </p>
          </div>
        </div>

        <div className="grid-3">
          <Card>
            <CardHeader
              title="Company jobs"
              description="Post listings with must-have and nice-to-have proofs."
            />
            <EmptyState
              title="No active job listings"
              body="Jobs stay drafts until you approve them. Verification unlocks reach."
            />
          </Card>
          <Card>
            <CardHeader
              title="Received applications"
              description="Review candidates and examine their evidence."
            />
            <EmptyState
              title="No applications to review"
              body="When candidates apply, their attached proof will appear here."
            />
          </Card>
          <Card>
            <CardHeader
              title="Candidate evidence"
              description="Inspect repositories, test logs, and live demos."
            />
            <EmptyState
              title="Zero unreviewed claims"
              body="Each claim will show its evidence state in precise wording."
            />
          </Card>
        </div>
      </main>
    </div>
  );
}
