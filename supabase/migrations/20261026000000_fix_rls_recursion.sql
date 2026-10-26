-- Fix infinite recursion in RLS policies by using SECURITY DEFINER helper functions

-- 1. Helper function: is_company_member
CREATE OR REPLACE FUNCTION is_company_member(_profile_id UUID, _company_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM company_members
    WHERE profile_id = _profile_id AND company_id = _company_id
  );
$$;

-- 2. Helper function: is_company_owner
CREATE OR REPLACE FUNCTION is_company_owner(_profile_id UUID, _company_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM company_members
    WHERE profile_id = _profile_id AND company_id = _company_id AND role = 'owner'
  );
$$;

-- 3. Replace company_members policies
DROP POLICY IF EXISTS "Company members view memberships within company" ON company_members;
DROP POLICY IF EXISTS "Company owners manage memberships" ON company_members;

CREATE POLICY "Company members view memberships within company"
ON company_members FOR SELECT
TO authenticated
USING (
    profile_id = auth.uid()
    OR is_company_member(auth.uid(), company_id)
);

CREATE POLICY "Company owners manage memberships"
ON company_members FOR ALL
TO authenticated
USING (is_company_owner(auth.uid(), company_id));

-- 4. Replace companies update policy
DROP POLICY IF EXISTS "Company owners manage company details" ON companies;

CREATE POLICY "Company owners manage company details"
ON companies FOR UPDATE
TO authenticated
USING (is_company_owner(auth.uid(), id));

-- 5. Replace jobs policies
DROP POLICY IF EXISTS "Published jobs viewable by all, drafts only by company members" ON jobs;
DROP POLICY IF EXISTS "Company members manage their company jobs" ON jobs;

CREATE POLICY "Published jobs viewable by all, drafts only by company members"
ON jobs FOR SELECT
TO authenticated
USING (
    status = 'published'
    OR is_company_member(auth.uid(), company_id)
);

CREATE POLICY "Company members manage their company jobs"
ON jobs FOR ALL
TO authenticated
USING (is_company_member(auth.uid(), company_id))
WITH CHECK (is_company_member(auth.uid(), company_id));

-- 6. Replace applications policies
DROP POLICY IF EXISTS "Candidates and employers view permitted applications" ON applications;
DROP POLICY IF EXISTS "Employers update application status for their jobs" ON applications;

CREATE POLICY "Candidates and employers view permitted applications"
ON applications FOR SELECT
TO authenticated
USING (
    auth.uid() = candidate_id
    OR EXISTS (
        SELECT 1 FROM jobs j
        WHERE j.id = applications.job_id
          AND is_company_member(auth.uid(), j.company_id)
    )
);

CREATE POLICY "Employers update application status for their jobs"
ON applications FOR UPDATE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM jobs j
        WHERE j.id = applications.job_id
          AND is_company_member(auth.uid(), j.company_id)
    )
);

-- 7. Replace evidence_items SELECT policy
DROP POLICY IF EXISTS "Evidence visibility policy" ON evidence_items;

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
            WHERE a.candidate_id = evidence_items.profile_id
              AND is_company_member(auth.uid(), j.company_id)
        )
    )
);
