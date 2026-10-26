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

export const dynamic = "force-dynamic";

export default async function CandidateProfilePage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // 1. Fetch Profile
  const { data: profile } = await supabase
    .from("profiles")
    .select("id, full_name, headline, bio, location, visibility")
    .eq("id", user.id)
    .single();

  // 2. Fetch Education
  const { data: education } = await supabase
    .from("education")
    .select("id, institution, degree, field_of_study, start_date, end_date, is_current, verification_status")
    .eq("profile_id", user.id)
    .order("created_at", { ascending: false });

  // 3. Fetch Experience
  const { data: experience } = await supabase
    .from("experience")
    .select("id, company_name, role_title, description, start_date, end_date, is_current")
    .eq("profile_id", user.id)
    .order("created_at", { ascending: false });

  // 4. Fetch Skills
  const { data: profileSkills } = await supabase
    .from("profile_skills")
    .select("id, years_experience, skills(id, name, category)")
    .eq("profile_id", user.id);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 pb-16">
      {/* Top Header */}
      <header className="border-b border-slate-800 bg-slate-900/60 backdrop-blur px-6 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link
            href="/dashboard/candidate"
            className="text-xs text-slate-400 hover:text-white transition-colors"
          >
            ← Back to Dashboard
          </Link>
          <span className="text-slate-600">|</span>
          <span className="font-semibold text-sm text-white">Candidate Profile & Evidence Setup</span>
        </div>
        <span className="text-xs text-slate-400">{user.email}</span>
      </header>

      <main className="max-w-4xl mx-auto p-6 mt-4 space-y-8">
        {/* Page Title */}
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Edit Candidate Profile</h1>
          <p className="text-xs text-slate-400 mt-1">
            Customize how employers and peers see your evidence of competence.
          </p>
        </div>

        {/* 1. BASIC INFORMATION & PRIVACY SETTINGS */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-sm">
          <h2 className="text-base font-semibold text-white mb-4">Profile Details & Privacy</h2>
          <form action={updateCandidateProfile} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                  Full Name
                </label>
                <input
                  name="full_name"
                  type="text"
                  required
                  defaultValue={profile?.full_name || ""}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                  Location
                </label>
                <input
                  name="location"
                  type="text"
                  placeholder="e.g. Remote / New York, NY"
                  defaultValue={profile?.location || ""}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                Headline
              </label>
              <input
                name="headline"
                type="text"
                placeholder="e.g. Full-Stack Developer | Python & React"
                defaultValue={profile?.headline || ""}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                Bio / Summary
              </label>
              <textarea
                name="bio"
                rows={3}
                placeholder="Briefly describe your focus, interests, and proof of work..."
                defaultValue={profile?.bio || ""}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>

            {/* Privacy Setting: public / employers only / private */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                Privacy Setting
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <label className="flex items-start space-x-3 p-3 bg-slate-950 border border-slate-800 rounded-lg cursor-pointer hover:border-slate-700">
                  <input
                    type="radio"
                    name="visibility"
                    value="public"
                    defaultChecked={profile?.visibility === "public"}
                    className="mt-0.5 text-emerald-600 focus:ring-emerald-500"
                  />
                  <div>
                    <span className="block text-xs font-semibold text-white">Public</span>
                    <span className="block text-[11px] text-slate-400">Viewable by all members</span>
                  </div>
                </label>

                <label className="flex items-start space-x-3 p-3 bg-slate-950 border border-slate-800 rounded-lg cursor-pointer hover:border-slate-700">
                  <input
                    type="radio"
                    name="visibility"
                    value="employers_only"
                    defaultChecked={profile?.visibility === "employers_only" || !profile?.visibility}
                    className="mt-0.5 text-emerald-600 focus:ring-emerald-500"
                  />
                  <div>
                    <span className="block text-xs font-semibold text-white">Employers Only</span>
                    <span className="block text-[11px] text-slate-400">Verified hiring managers only</span>
                  </div>
                </label>

                <label className="flex items-start space-x-3 p-3 bg-slate-950 border border-slate-800 rounded-lg cursor-pointer hover:border-slate-700">
                  <input
                    type="radio"
                    name="visibility"
                    value="private"
                    defaultChecked={profile?.visibility === "private"}
                    className="mt-0.5 text-emerald-600 focus:ring-emerald-500"
                  />
                  <div>
                    <span className="block text-xs font-semibold text-white">Private</span>
                    <span className="block text-[11px] text-slate-400">Only visible to you</span>
                  </div>
                </label>
              </div>
            </div>

            <button
              type="submit"
              className="py-2 px-5 bg-emerald-600 hover:bg-emerald-500 text-white font-medium rounded-lg text-xs transition-colors cursor-pointer"
            >
              Save Profile Changes
            </button>
          </form>
        </div>

        {/* 2. SKILLS SECTION */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-semibold text-white">Skills Catalog</h2>
              <p className="text-xs text-slate-400">Technologies and competencies you work with.</p>
            </div>
          </div>

          {/* List Skills */}
          <div className="flex flex-wrap gap-2 mb-6">
            {profileSkills && profileSkills.length > 0 ? (
              profileSkills.map((ps: any) => (
                <div
                  key={ps.id}
                  className="inline-flex items-center space-x-2 px-3 py-1 bg-slate-950 border border-slate-700 rounded-full text-xs text-slate-200"
                >
                  <span className="font-medium">{ps.skills?.name}</span>
                  {ps.years_experience && (
                    <span className="text-[10px] text-slate-400">({ps.years_experience} yrs)</span>
                  )}
                  <form action={deleteSkillAction.bind(null, ps.id)}>
                    <button
                      type="submit"
                      className="text-slate-400 hover:text-rose-400 ml-1 text-sm font-bold cursor-pointer"
                      title="Remove skill"
                    >
                      ×
                    </button>
                  </form>
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-500 italic">No skills listed yet.</p>
            )}
          </div>

          {/* Add Skill Form */}
          <form action={addSkillAction} className="bg-slate-950/60 p-4 border border-slate-800/80 rounded-lg">
            <span className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
              Add New Skill
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <input
                name="skill_name"
                type="text"
                required
                placeholder="Skill (e.g. Python, React)"
                className="px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-white text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
              <input
                name="category"
                type="text"
                placeholder="Category (e.g. Backend, Database)"
                className="px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-white text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
              <div className="flex space-x-2">
                <input
                  name="years_experience"
                  type="number"
                  step="0.5"
                  min="0"
                  placeholder="Years"
                  className="w-24 px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-white text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
                <button
                  type="submit"
                  className="flex-1 py-1.5 px-3 bg-emerald-600 hover:bg-emerald-500 text-white font-medium rounded-lg text-xs transition-colors cursor-pointer"
                >
                  Add Skill
                </button>
              </div>
            </div>
          </form>
        </div>

        {/* 3. EDUCATION SECTION (OPTIONAL - PERSONAL EMAIL MARKED SELF-REPORTED) */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-sm">
          <div className="mb-4">
            <div className="flex items-center space-x-2">
              <h2 className="text-base font-semibold text-white">Education & Self-Taught Studies</h2>
              <span className="px-2 py-0.5 text-[10px] bg-slate-800 text-slate-400 rounded-full font-medium">
                Optional
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Beginners without formal degrees can skip this section. Education added via personal emails is marked as <strong>Self-Reported</strong>.
            </p>
          </div>

          {/* Education List */}
          <div className="space-y-3 mb-6">
            {education && education.length > 0 ? (
              education.map((edu: any) => (
                <div
                  key={edu.id}
                  className="p-4 bg-slate-950 border border-slate-800 rounded-lg flex items-start justify-between"
                >
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-semibold text-sm text-white">{edu.institution}</span>
                      <span
                        className={`px-2 py-0.5 text-[10px] font-semibold rounded-full border ${
                          edu.verification_status === "self_reported"
                            ? "bg-amber-950/60 border-amber-800 text-amber-300"
                            : "bg-emerald-950/60 border-emerald-800 text-emerald-300"
                        }`}
                      >
                        {edu.verification_status === "self_reported" ? "Self-Reported" : "Institutional Submitted"}
                      </span>
                    </div>
                    {(edu.degree || edu.field_of_study) && (
                      <p className="text-xs text-slate-300 mt-0.5">
                        {edu.degree} {edu.field_of_study && `• ${edu.field_of_study}`}
                      </p>
                    )}
                    {(edu.start_date || edu.end_date) && (
                      <p className="text-[11px] text-slate-500 mt-1">
                        {edu.start_date || "N/A"} — {edu.is_current ? "Present" : edu.end_date || "N/A"}
                      </p>
                    )}
                  </div>
                  <form action={deleteEducationAction.bind(null, edu.id)}>
                    <button
                      type="submit"
                      className="text-xs text-rose-400 hover:underline cursor-pointer"
                    >
                      Delete
                    </button>
                  </form>
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-500 italic">No education entries added (completely optional).</p>
            )}
          </div>

          {/* Add Education Form */}
          <form action={addEducationAction} className="bg-slate-950/60 p-4 border border-slate-800/80 rounded-lg space-y-3">
            <span className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
              Add Education or Study Platform
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input
                name="institution"
                type="text"
                required
                placeholder="Institution (e.g. FreeCodeCamp, University)"
                className="px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-white text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
              <input
                name="degree"
                type="text"
                placeholder="Degree or Certificate (e.g. Full-Stack Cert)"
                className="px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-white text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input
                name="field_of_study"
                type="text"
                placeholder="Field of study (e.g. Web Development)"
                className="px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-white text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
              <div>
                <input
                  name="contact_email"
                  type="email"
                  placeholder="Contact/Alumni email (e.g. @university.edu or @gmail.com)"
                  className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-white text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
                <span className="block text-[10px] text-slate-500 mt-0.5">
                  Personal emails (gmail/yahoo) are marked &quot;Self-Reported&quot;.
                </span>
              </div>
            </div>
            <button
              type="submit"
              className="py-1.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-medium rounded-lg text-xs transition-colors cursor-pointer"
            >
              Add Education
            </button>
          </form>
        </div>

        {/* 4. EXPERIENCE SECTION (OPTIONAL FOR BEGINNERS) */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-sm">
          <div className="mb-4">
            <div className="flex items-center space-x-2">
              <h2 className="text-base font-semibold text-white">Experience & Work History</h2>
              <span className="px-2 py-0.5 text-[10px] bg-slate-800 text-slate-400 rounded-full font-medium">
                Optional
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              No prior corporate work history required. Beginners can leave this blank.
            </p>
          </div>

          {/* Experience List */}
          <div className="space-y-3 mb-6">
            {experience && experience.length > 0 ? (
              experience.map((exp: any) => (
                <div
                  key={exp.id}
                  className="p-4 bg-slate-950 border border-slate-800 rounded-lg flex items-start justify-between"
                >
                  <div>
                    <span className="font-semibold text-sm text-white">{exp.role_title}</span>
                    <p className="text-xs text-slate-300 mt-0.5">{exp.company_name}</p>
                    {exp.description && (
                      <p className="text-xs text-slate-400 mt-1">{exp.description}</p>
                    )}
                  </div>
                  <form action={deleteExperienceAction.bind(null, exp.id)}>
                    <button
                      type="submit"
                      className="text-xs text-rose-400 hover:underline cursor-pointer"
                    >
                      Delete
                    </button>
                  </form>
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-500 italic">No work history listed (completely optional).</p>
            )}
          </div>

          {/* Add Experience Form */}
          <form action={addExperienceAction} className="bg-slate-950/60 p-4 border border-slate-800/80 rounded-lg space-y-3">
            <span className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
              Add Experience Item
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input
                name="company_name"
                type="text"
                required
                placeholder="Company or Client Name"
                className="px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-white text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
              <input
                name="role_title"
                type="text"
                required
                placeholder="Role Title (e.g. Freelance Web Developer)"
                className="px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-white text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>
            <div>
              <textarea
                name="description"
                rows={2}
                placeholder="Brief summary of duties and technologies used..."
                className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-white text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>
            <button
              type="submit"
              className="py-1.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-medium rounded-lg text-xs transition-colors cursor-pointer"
            >
              Add Experience
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}
