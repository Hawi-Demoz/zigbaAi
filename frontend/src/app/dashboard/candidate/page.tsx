import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/utils/supabase/server";
import { signout } from "@/app/auth/actions";
import { AppHeader } from "@/components/layout/app-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";

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

  const visibilityLabel =
    profile?.visibility === "public"
      ? "Public"
      : profile?.visibility === "private"
        ? "Private"
        : "Employers only";

  return (
    <div className="shell">
      <AppHeader role="Candidate" email={user.email}>
        <Link href="/dashboard/candidate/profile" className="btn btn--ghost">
          My profile
        </Link>
        <form action={signout}>
          <button type="submit" className="btn btn--secondary">
            Sign out
          </button>
        </form>
      </AppHeader>

      <main className="page page--app">
        <div className="welcome">
          <div>
            <div className="chip-row" style={{ marginBottom: "0.65rem" }}>
              <Badge tone="muted">{visibilityLabel}</Badge>
            </div>
            <h1 className="display" style={{ fontSize: "clamp(1.8rem, 4vw, 2.6rem)" }}>
              Welcome, {profile?.full_name || "Candidate"}
            </h1>
            <p className="lede">
              {profile?.headline || "Your evidence-based candidate profile is ready."}
            </p>
            {profile?.location && (
              <p className="lede" style={{ marginTop: "0.35rem", fontSize: "0.9rem" }}>
                {profile.location}
              </p>
            )}
          </div>
          <Link href="/dashboard/candidate/profile" className="btn btn--primary">
            Edit profile, skills &amp; studies
          </Link>
        </div>

        <div className="grid-3">
          <Card>
            <CardHeader
              title="Evidence items"
              description="Add verified proof of code, projects, and skills."
            />
            <EmptyState
              title="No evidence submitted yet"
              body="A public repository, live demo, or report can sit beside a claim."
            />
          </Card>
          <Card>
            <CardHeader
              title="Applications"
              description="Track the status of your applications."
            />
            <EmptyState
              title="No active applications"
              body="When you apply, the job and your attached proof will appear here."
            />
          </Card>
          <Card>
            <CardHeader
              title="Evidence status"
              description="Independently reviewed competence proofs."
            />
            <EmptyState
              title="Level: self-reported"
              body="Claims start here. Review and confirmation come later, with precise wording."
            />
          </Card>
        </div>
      </main>
    </div>
  );
}
