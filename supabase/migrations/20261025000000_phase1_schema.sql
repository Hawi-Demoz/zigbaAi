-- Phase 1 Schema Migration: Evidence-Based Professional Network
-- Enforcing modular monolith design, strict permissions, and Row Level Security.

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. CUSTOM TYPES & ENUMS
CREATE TYPE evidence_status_type AS ENUM (
    'self_reported',
    'evidence_submitted',
    'evidence_reviewed',
    'independently_confirmed'
);

CREATE TYPE evidence_visibility_type AS ENUM (
    'public',
    'application_only',
    'private'
);

CREATE TYPE claim_type AS ENUM (
    'skill',
    'project'
);

CREATE TYPE job_location_type AS ENUM (
    'remote',
    'hybrid',
    'onsite'
);

CREATE TYPE job_status_type AS ENUM (
    'draft',
    'published',
    'closed'
);

CREATE TYPE requirement_type AS ENUM (
    'must_have',
    'nice_to_have'
);

CREATE TYPE company_member_role AS ENUM (
    'owner',
    'recruiter',
    'hiring_manager'
);

CREATE TYPE application_status_type AS ENUM (
    'submitted',
    'under_review',
    'interviewing',
    'rejected',
    'accepted'
);

CREATE TYPE report_status_type AS ENUM (
    'pending',
    'resolved',
    'dismissed'
);

-- 3. CORE IDENTITY & PROFILES
CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    headline TEXT,
    bio TEXT,
    location TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE skills (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL UNIQUE,
    category TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE profile_skills (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    skill_id UUID NOT NULL REFERENCES skills(id) ON DELETE RESTRICT,
    years_experience NUMERIC(4, 1),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (profile_id, skill_id)
);

CREATE TABLE education (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    institution TEXT NOT NULL,
    degree TEXT,
    field_of_study TEXT,
    start_date DATE,
    end_date DATE,
    is_current BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE experience (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    company_name TEXT NOT NULL,
    role_title TEXT NOT NULL,
    description TEXT,
    start_date DATE,
    end_date DATE,
    is_current BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. PROJECTS & EVIDENCE
CREATE TABLE projects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    repository_url TEXT,
    live_url TEXT,
    start_date DATE,
    end_date DATE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE project_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    role_in_project TEXT NOT NULL,
    joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (project_id, profile_id)
);

CREATE TABLE evidence_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    claim_type claim_type NOT NULL,
    claim_id UUID NOT NULL,
    title TEXT NOT NULL,
    evidence_url TEXT,
    storage_path TEXT,
    visibility evidence_visibility_type NOT NULL DEFAULT 'application_only',
    status evidence_status_type NOT NULL DEFAULT 'self_reported',
    verification_notes TEXT,
    reviewed_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    reviewed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE user_documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    document_name TEXT NOT NULL,
    storage_path TEXT NOT NULL,
    document_type TEXT NOT NULL,
    file_size_bytes BIGINT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. RECRUITMENT, COMPANIES & APPLICATIONS
CREATE TABLE companies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL UNIQUE,
    website TEXT,
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE company_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    role company_member_role NOT NULL DEFAULT 'recruiter',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (company_id, profile_id)
);

CREATE TABLE jobs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    created_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    location_type job_location_type NOT NULL DEFAULT 'remote',
    salary_min NUMERIC(12, 2),
    salary_max NUMERIC(12, 2),
    status job_status_type NOT NULL DEFAULT 'draft',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE job_requirements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
    skill_id UUID REFERENCES skills(id) ON DELETE SET NULL,
    requirement_text TEXT NOT NULL,
    requirement_type requirement_type NOT NULL,
    min_evidence_level evidence_status_type NOT NULL DEFAULT 'self_reported',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE applications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
    candidate_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    status application_status_type NOT NULL DEFAULT 'submitted',
    cover_note TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (job_id, candidate_id)
);

-- 6. SAFETY & GOVERNANCE
CREATE TABLE reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    reporter_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    reported_profile_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    reported_job_id UUID REFERENCES jobs(id) ON DELETE SET NULL,
    reason TEXT NOT NULL,
    details TEXT,
    status report_status_type NOT NULL DEFAULT 'pending',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE audit_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    actor_id UUID,
    action TEXT NOT NULL,
    resource_type TEXT NOT NULL,
    resource_id UUID NOT NULL,
    payload JSONB DEFAULT '{}'::JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. SECURITY TRIGGER: PREVENT REGULAR USERS FROM SETTING REVIEWED / CONFIRMED EVIDENCE
CREATE OR REPLACE FUNCTION check_evidence_status_permission()
RETURNS TRIGGER AS $$
BEGIN
    -- If the status is changing to or being created as 'evidence_reviewed' or 'independently_confirmed'
    IF (NEW.status IN ('evidence_reviewed', 'independently_confirmed')) THEN
        -- If current user is the candidate himself, reject tampering
        IF (auth.uid() = NEW.profile_id) THEN
            RAISE EXCEPTION 'Candidates cannot self-assign evidence_reviewed or independently_confirmed status.';
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER enforce_evidence_status_integrity
BEFORE INSERT OR UPDATE ON evidence_items
FOR EACH ROW
EXECUTE FUNCTION check_evidence_status_permission();

-- 8. ENABLE ROW LEVEL SECURITY ON ALL 16 TABLES
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE profile_skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE education ENABLE ROW LEVEL SECURITY;
ALTER TABLE experience ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE evidence_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_requirements ENABLE ROW LEVEL SECURITY;
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_events ENABLE ROW LEVEL SECURITY;

-- 9. RLS POLICIES

-- PROFILES
CREATE POLICY "Public profiles are viewable by authenticated users"
ON profiles FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Users can create their own profile"
ON profiles FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
ON profiles FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- SKILLS
CREATE POLICY "Skills directory is viewable by authenticated users"
ON skills FOR SELECT
TO authenticated
USING (true);

-- PROFILE SKILLS
CREATE POLICY "Profile skills viewable by authenticated users"
ON profile_skills FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Users manage their own skills"
ON profile_skills FOR ALL
TO authenticated
USING (auth.uid() = profile_id)
WITH CHECK (auth.uid() = profile_id);

-- EDUCATION & EXPERIENCE
CREATE POLICY "Education viewable by authenticated users"
ON education FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Users manage their own education"
ON education FOR ALL
TO authenticated
USING (auth.uid() = profile_id)
WITH CHECK (auth.uid() = profile_id);

CREATE POLICY "Experience viewable by authenticated users"
ON experience FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Users manage their own experience"
ON experience FOR ALL
TO authenticated
USING (auth.uid() = profile_id)
WITH CHECK (auth.uid() = profile_id);

-- PROJECTS & MEMBERS
CREATE POLICY "Projects viewable by authenticated users"
ON projects FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Users manage their created projects"
ON projects FOR ALL
TO authenticated
USING (auth.uid() = created_by)
WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Project members viewable by authenticated users"
ON project_members FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Project creators manage memberships"
ON project_members FOR ALL
TO authenticated
USING (
    auth.uid() IN (SELECT created_by FROM projects WHERE id = project_members.project_id)
    OR auth.uid() = profile_id
);

-- EVIDENCE ITEMS
-- Visible if: owner, OR public, OR to an employer whose job the candidate applied to
CREATE POLICY "Evidence visibility policy"
ON evidence_items FOR SELECT
TO authenticated
USING (
    auth.uid() = profile_id
    OR visibility = 'public'
    OR (
        visibility = 'application_only'
        AND EXISTS (
            SELECT 1 FROM applications a
            JOIN jobs j ON j.id = a.job_id
            JOIN company_members cm ON cm.company_id = j.company_id
            WHERE a.candidate_id = evidence_items.profile_id
              AND cm.profile_id = auth.uid()
        )
    )
);

CREATE POLICY "Candidates insert their own evidence"
ON evidence_items FOR INSERT
TO authenticated
WITH CHECK (
    auth.uid() = profile_id
    AND status IN ('self_reported', 'evidence_submitted')
);

CREATE POLICY "Candidates update their own evidence"
ON evidence_items FOR UPDATE
TO authenticated
USING (auth.uid() = profile_id)
WITH CHECK (
    auth.uid() = profile_id
    AND status IN ('self_reported', 'evidence_submitted')
);

CREATE POLICY "Candidates delete their own evidence"
ON evidence_items FOR DELETE
TO authenticated
USING (auth.uid() = profile_id);

-- USER DOCUMENTS (STRICT PRIVATE STORAGE METADATA)
CREATE POLICY "Users exclusively manage their private documents"
ON user_documents FOR ALL
TO authenticated
USING (auth.uid() = profile_id)
WITH CHECK (auth.uid() = profile_id);

-- COMPANIES & MEMBERS
CREATE POLICY "Companies viewable by authenticated users"
ON companies FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Company owners manage company details"
ON companies FOR UPDATE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM company_members
        WHERE company_id = companies.id
          AND profile_id = auth.uid()
          AND role = 'owner'
    )
);

CREATE POLICY "Company members view memberships within company"
ON company_members FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM company_members cm
        WHERE cm.company_id = company_members.company_id
          AND cm.profile_id = auth.uid()
    )
);

CREATE POLICY "Company owners manage memberships"
ON company_members FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM company_members cm
        WHERE cm.company_id = company_members.company_id
          AND cm.profile_id = auth.uid()
          AND cm.role = 'owner'
    )
);

-- JOBS & REQUIREMENTS
CREATE POLICY "Published jobs viewable by all, drafts only by company members"
ON jobs FOR SELECT
TO authenticated
USING (
    status = 'published'
    OR EXISTS (
        SELECT 1 FROM company_members cm
        WHERE cm.company_id = jobs.company_id
          AND cm.profile_id = auth.uid()
    )
);

CREATE POLICY "Company members manage their company jobs"
ON jobs FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM company_members cm
        WHERE cm.company_id = jobs.company_id
          AND cm.profile_id = auth.uid()
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM company_members cm
        WHERE cm.company_id = jobs.company_id
          AND cm.profile_id = auth.uid()
    )
);

CREATE POLICY "Job requirements viewable if job is viewable"
ON job_requirements FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM jobs j
        WHERE j.id = job_requirements.job_id
          AND (
              j.status = 'published'
              OR EXISTS (
                  SELECT 1 FROM company_members cm
                  WHERE cm.company_id = j.company_id
                    AND cm.profile_id = auth.uid()
              )
          )
    )
);

CREATE POLICY "Company members manage job requirements"
ON job_requirements FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM jobs j
        JOIN company_members cm ON cm.company_id = j.company_id
        WHERE j.id = job_requirements.job_id
          AND cm.profile_id = auth.uid()
    )
);

-- APPLICATIONS
-- Candidate sees only their own; Employers see only their company's received applications
CREATE POLICY "Candidates and employers view permitted applications"
ON applications FOR SELECT
TO authenticated
USING (
    auth.uid() = candidate_id
    OR EXISTS (
        SELECT 1 FROM jobs j
        JOIN company_members cm ON cm.company_id = j.company_id
        WHERE j.id = applications.job_id
          AND cm.profile_id = auth.uid()
    )
);

CREATE POLICY "Candidates submit their own applications"
ON applications FOR INSERT
TO authenticated
WITH CHECK (
    auth.uid() = candidate_id
    AND status = 'submitted'
);

CREATE POLICY "Employers update application status for their jobs"
ON applications FOR UPDATE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM jobs j
        JOIN company_members cm ON cm.company_id = j.company_id
        WHERE j.id = applications.job_id
          AND cm.profile_id = auth.uid()
    )
);

-- REPORTS & AUDIT EVENTS
CREATE POLICY "Users can file reports"
ON reports FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = reporter_id);

CREATE POLICY "Users can view their own filed reports"
ON reports FOR SELECT
TO authenticated
USING (auth.uid() = reporter_id);
