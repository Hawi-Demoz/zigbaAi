"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/utils/supabase/server";

const PERSONAL_EMAIL_DOMAINS = [
  "gmail.com",
  "yahoo.com",
  "hotmail.com",
  "outlook.com",
  "icloud.com",
  "proton.me",
  "protonmail.com",
  "aol.com",
  "mail.com",
];

export async function updateCandidateProfile(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Not authenticated." };
  }

  const fullName = formData.get("full_name") as string;
  const headline = formData.get("headline") as string;
  const bio = formData.get("bio") as string;
  const location = formData.get("location") as string;
  const visibility = formData.get("visibility") as string;

  const { error } = await supabase
    .from("profiles")
    .update({
      full_name: fullName.trim(),
      headline: headline?.trim() || null,
      bio: bio?.trim() || null,
      location: location?.trim() || null,
      visibility: visibility || "employers_only",
      updated_at: new Date().toISOString(),
    })
    .eq("id", user.id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/dashboard/candidate");
  revalidatePath("/dashboard/candidate/profile");
  return { success: true };
}

export async function addEducationAction(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Not authenticated." };
  }

  const institution = formData.get("institution") as string;
  const degree = formData.get("degree") as string;
  const fieldOfStudy = formData.get("field_of_study") as string;
  const contactEmail = formData.get("contact_email") as string;
  const startDate = formData.get("start_date") as string;
  const endDate = formData.get("end_date") as string;
  const isCurrent = formData.get("is_current") === "true";

  if (!institution) {
    return { error: "Institution is required." };
  }

  // Domain rule: personal email marks education as self-reported
  let verificationStatus = "institutional_submitted";
  if (contactEmail && contactEmail.includes("@")) {
    const domain = contactEmail.split("@")[-1]?.toLowerCase().trim();
    if (PERSONAL_EMAIL_DOMAINS.includes(domain)) {
      verificationStatus = "self_reported";
    }
  } else {
    verificationStatus = "self_reported";
  }

  const { error } = await supabase.from("education").insert({
    profile_id: user.id,
    institution: institution.trim(),
    degree: degree?.trim() || null,
    field_of_study: fieldOfStudy?.trim() || null,
    start_date: startDate || null,
    end_date: endDate || null,
    is_current: isCurrent,
    verification_status: verificationStatus,
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/dashboard/candidate/profile");
  return { success: true };
}

export async function deleteEducationAction(educationId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Not authenticated." };
  }

  const { error } = await supabase
    .from("education")
    .delete()
    .eq("id", educationId)
    .eq("profile_id", user.id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/dashboard/candidate/profile");
  return { success: true };
}

export async function addExperienceAction(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Not authenticated." };
  }

  const companyName = formData.get("company_name") as string;
  const roleTitle = formData.get("role_title") as string;
  const description = formData.get("description") as string;
  const startDate = formData.get("start_date") as string;
  const endDate = formData.get("end_date") as string;
  const isCurrent = formData.get("is_current") === "true";

  if (!companyName || !roleTitle) {
    return { error: "Company name and role title are required." };
  }

  const { error } = await supabase.from("experience").insert({
    profile_id: user.id,
    company_name: companyName.trim(),
    role_title: roleTitle.trim(),
    description: description?.trim() || null,
    start_date: startDate || null,
    end_date: endDate || null,
    is_current: isCurrent,
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/dashboard/candidate/profile");
  return { success: true };
}

export async function deleteExperienceAction(experienceId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Not authenticated." };
  }

  const { error } = await supabase
    .from("experience")
    .delete()
    .eq("id", experienceId)
    .eq("profile_id", user.id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/dashboard/candidate/profile");
  return { success: true };
}

export async function addSkillAction(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Not authenticated." };
  }

  const skillName = formData.get("skill_name") as string;
  const category = (formData.get("category") as string) || "General";
  const yearsExperience = formData.get("years_experience")
    ? parseFloat(formData.get("years_experience") as string)
    : null;

  if (!skillName) {
    return { error: "Skill name is required." };
  }

  // Find or insert into global skills catalog
  const { data: existingSkill } = await supabase
    .from("skills")
    .select("id")
    .ilike("name", skillName.trim())
    .maybeSingle();

  let skillId = existingSkill?.id;

  if (!skillId) {
    const { data: newSkill, error: skillError } = await supabase
      .from("skills")
      .insert({ name: skillName.trim(), category: category.trim() })
      .select("id")
      .single();

    if (skillError) {
      return { error: skillError.message };
    }
    skillId = newSkill.id;
  }

  // Link to profile_skills
  const { error } = await supabase.from("profile_skills").insert({
    profile_id: user.id,
    skill_id: skillId,
    years_experience: yearsExperience,
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/dashboard/candidate/profile");
  return { success: true };
}

export async function deleteSkillAction(profileSkillId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Not authenticated." };
  }

  const { error } = await supabase
    .from("profile_skills")
    .delete()
    .eq("id", profileSkillId)
    .eq("profile_id", user.id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/dashboard/candidate/profile");
  return { success: true };
}
