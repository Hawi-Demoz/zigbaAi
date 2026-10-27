import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/utils/supabase/server";
import {
  updateCandidateProfile,
  addEducationAction,
  deleteEducationAction,
  addExperienceAction,
  deleteExperienceAction,
  addSkillAction,
  deleteSkillAction,
} from "../actions";
import { AppHeader } from "@/components/layout/app-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader } from "@/components/ui/card";
import { Field, TextArea, TextInput } from "@/components/ui/field";
import { EmptyState } from "@/components/ui/empty-state";

export const dynamic = "force-dynamic";

export default async function CandidateProfilePage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, full_name, headline, bio, location, visibility")
    .eq("id", user.id)
    .single();

  const { data: education } = await supabase
    .from("education")
    .select("id, institution, degree, field_of_study, start_date, end_date, is_current, verification_status")
    .eq("profile_id", user.id)
    .order("created_at", { ascending: false });

  const { data: experience } = await supabase
    .from("experience")
    .select("id, company_name, role_title, description, start_date, end_date, is_current")
    .eq("profile_id", user.id)
    .order("created_at", { ascending: false });

  const { data: profileSkills } = await supabase
    .from("profile_skills")
    .select("id, years_experience, skills(id, name, category)")
    .eq("profile_id", user.id);

  return (
    <div className="shell">
      <AppHeader email={user.email}>
        <Link href="/dashboard/candidate" className="btn btn--ghost">
          Back to dashboard
        </Link>
      </AppHeader>

      <main className="page page--app stack">
        <div>
          <h1 className="display" style={{ fontSize: "clamp(1.8rem, 4vw, 2.5rem)" }}>
            Edit candidate profile
          </h1>
          <p className="lede">
            Customize how employers and peers see your evidence of competence.
          </p>
        </div>

        <Card>
          <CardHeader
            title="Profile details & privacy"
            description="A headline and bio help employers read your work in context."
          />
          <form action={updateCandidateProfile} className="stack">
            <div className="form-grid form-grid--2">
              <Field label="Full name">
                <TextInput
                  name="full_name"
                  type="text"
                  required
                  defaultValue={profile?.full_name || ""}
                />
              </Field>
              <Field label="Location">
                <TextInput
                  name="location"
                  type="text"
                  placeholder="e.g. Addis Ababa / Remote"
                  defaultValue={profile?.location || ""}
                />
              </Field>
            </div>

            <Field label="Headline">
              <TextInput
                name="headline"
                type="text"
                placeholder="e.g. Full-stack developer · Python & React"
                defaultValue={profile?.headline || ""}
              />
            </Field>

            <Field label="Bio / summary">
              <TextArea
                name="bio"
                rows={3}
                placeholder="Briefly describe your focus, interests, and proof of work…"
                defaultValue={profile?.bio || ""}
              />
            </Field>

            <Field label="Privacy setting">
              <div className="privacy">
                <label>
                  <input
                    type="radio"
                    name="visibility"
                    value="public"
                    defaultChecked={profile?.visibility === "public"}
                  />
                  <div>
                    <strong>Public</strong>
                    <span>Viewable by all members</span>
                  </div>
                </label>
                <label>
                  <input
                    type="radio"
                    name="visibility"
                    value="employers_only"
                    defaultChecked={profile?.visibility === "employers_only" || !profile?.visibility}
                  />
                  <div>
                    <strong>Employers only</strong>
                    <span>Verified hiring managers only</span>
                  </div>
                </label>
                <label>
                  <input
                    type="radio"
                    name="visibility"
                    value="private"
                    defaultChecked={profile?.visibility === "private"}
                  />
                  <div>
                    <strong>Private</strong>
                    <span>Only visible to you</span>
                  </div>
                </label>
              </div>
            </Field>

            <div>
              <button type="submit" className="btn btn--primary">
                Save profile changes
              </button>
            </div>
          </form>
        </Card>

        <Card>
          <CardHeader
            title="Skills catalog"
            description="Technologies and competencies you work with."
          />

          <div className="chip-row">
            {profileSkills && profileSkills.length > 0 ? (
              profileSkills.map((ps: any) => (
                <div key={ps.id} className="chip">
                  <span>
                    {ps.skills?.name}
                    {ps.years_experience ? (
                      <span style={{ color: "var(--ink-muted)" }}>
                        {" "}
                        · {ps.years_experience} yrs
                      </span>
                    ) : null}
                  </span>
                  <form action={deleteSkillAction.bind(null, ps.id)}>
                    <button
                      type="submit"
                      className="btn btn--danger"
                      title="Remove skill"
                      aria-label={`Remove ${ps.skills?.name || "skill"}`}
                    >
                      ×
                    </button>
                  </form>
                </div>
              ))
            ) : (
              <EmptyState
                title="No skills listed yet"
                body="Add a skill you can later attach to a project or proof item."
              />
            )}
          </div>

          <form action={addSkillAction} className="inset">
            <p className="field__label" style={{ marginBottom: "0.75rem" }}>
              Add new skill
            </p>
            <div className="form-grid form-grid--3">
              <TextInput
                name="skill_name"
                type="text"
                required
                placeholder="Skill (e.g. Python, React)"
              />
              <TextInput
                name="category"
                type="text"
                placeholder="Category (e.g. Backend)"
              />
              <div style={{ display: "flex", gap: "0.5rem" }}>
                <TextInput
                  name="years_experience"
                  type="number"
                  step="0.5"
                  min="0"
                  placeholder="Years"
                  style={{ width: "5.5rem" }}
                />
                <button type="submit" className="btn btn--primary">
                  Add skill
                </button>
              </div>
            </div>
          </form>
        </Card>

        <Card>
          <CardHeader
            title="Education & self-taught studies"
            description={
              <>
                Optional. Beginners without formal degrees can skip this. Education
                added via personal emails is marked <strong>self-reported</strong>.
              </>
            }
            action={<Badge tone="muted">Optional</Badge>}
          />

          <div>
            {education && education.length > 0 ? (
              education.map((edu: any) => (
                <div key={edu.id} className="record">
                  <div>
                    <div className="chip-row" style={{ marginBottom: "0.35rem" }}>
                      <h3>{edu.institution}</h3>
                      <Badge tone={edu.verification_status === "self_reported" ? "warn" : "ok"}>
                        {edu.verification_status === "self_reported"
                          ? "Self-reported"
                          : "Institutional submitted"}
                      </Badge>
                    </div>
                    {(edu.degree || edu.field_of_study) && (
                      <p>
                        {edu.degree} {edu.field_of_study && `· ${edu.field_of_study}`}
                      </p>
                    )}
                    {(edu.start_date || edu.end_date) && (
                      <p>
                        {edu.start_date || "N/A"} — {edu.is_current ? "Present" : edu.end_date || "N/A"}
                      </p>
                    )}
                  </div>
                  <form action={deleteEducationAction.bind(null, edu.id)}>
                    <button type="submit" className="btn btn--danger">
                      Delete
                    </button>
                  </form>
                </div>
              ))
            ) : (
              <EmptyState
                title="No education entries"
                body="Add a university, bootcamp, or self-taught path — or leave this blank."
              />
            )}
          </div>

          <form action={addEducationAction} className="inset stack">
            <p className="field__label">Add education or study platform</p>
            <div className="form-grid form-grid--2">
              <TextInput
                name="institution"
                type="text"
                required
                placeholder="Institution (e.g. FreeCodeCamp, university)"
              />
              <TextInput
                name="degree"
                type="text"
                placeholder="Degree or certificate"
              />
            </div>
            <div className="form-grid form-grid--2">
              <TextInput
                name="field_of_study"
                type="text"
                placeholder="Field of study"
              />
              <Field
                label="Contact / alumni email"
                hint={'Personal emails (gmail/yahoo) are marked "Self-Reported".'}
              >
                <TextInput
                  name="contact_email"
                  type="email"
                  placeholder="you@university.edu"
                />
              </Field>
            </div>
            <div>
              <button type="submit" className="btn btn--primary">
                Add education
              </button>
            </div>
          </form>
        </Card>

        <Card>
          <CardHeader
            title="Experience & work history"
            description="Optional. No prior corporate work history required. Beginners can leave this blank."
            action={<Badge tone="muted">Optional</Badge>}
          />

          <div>
            {experience && experience.length > 0 ? (
              experience.map((exp: any) => (
                <div key={exp.id} className="record">
                  <div>
                    <h3>{exp.role_title}</h3>
                    <p>{exp.company_name}</p>
                    {exp.description && <p>{exp.description}</p>}
                  </div>
                  <form action={deleteExperienceAction.bind(null, exp.id)}>
                    <button type="submit" className="btn btn--danger">
                      Delete
                    </button>
                  </form>
                </div>
              ))
            ) : (
              <EmptyState
                title="No work history listed"
                body="Freelance, internships, and campus projects can live here later."
              />
            )}
          </div>

          <form action={addExperienceAction} className="inset stack">
            <p className="field__label">Add experience item</p>
            <div className="form-grid form-grid--2">
              <TextInput
                name="company_name"
                type="text"
                required
                placeholder="Company or client name"
              />
              <TextInput
                name="role_title"
                type="text"
                required
                placeholder="Role title"
              />
            </div>
            <TextArea
              name="description"
              rows={2}
              placeholder="Brief summary of duties and technologies used…"
            />
            <div>
              <button type="submit" className="btn btn--primary">
                Add experience
              </button>
            </div>
          </form>
        </Card>
      </main>
    </div>
  );
}
