-- Migration: Candidate Profile Enhancements (Privacy Settings & Education Verification Status)

-- 1. Create profile_visibility_type enum
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'profile_visibility_type') THEN
        CREATE TYPE profile_visibility_type AS ENUM ('public', 'employers_only', 'private');
    END IF;
END $$;

-- 2. Add visibility column to profiles
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' AND column_name = 'visibility'
    ) THEN
        ALTER TABLE profiles ADD COLUMN visibility profile_visibility_type NOT NULL DEFAULT 'employers_only';
    END IF;
END $$;

-- 3. Add verification_status to education
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'education' AND column_name = 'verification_status'
    ) THEN
        ALTER TABLE education ADD COLUMN verification_status TEXT NOT NULL DEFAULT 'self_reported';
    END IF;
END $$;

-- 4. Helper function: is_employer (SECURITY DEFINER prevents policy recursion)
CREATE OR REPLACE FUNCTION is_employer(_profile_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = _profile_id AND role = 'employer'
  );
$$;

-- 5. Update profiles RLS policy to respect visibility setting
DROP POLICY IF EXISTS "Public profiles are viewable by authenticated users" ON profiles;
DROP POLICY IF EXISTS "Profiles visibility policy" ON profiles;

CREATE POLICY "Profiles visibility policy"
ON profiles FOR SELECT
TO authenticated
USING (
    -- 1. Profile owner can always view own profile
    auth.uid() = id
    -- 2. Public profile is viewable by all authenticated users
    OR visibility = 'public'
    -- 3. Employers only profile is viewable by employers
    OR (
        visibility = 'employers_only'
        AND is_employer(auth.uid())
    )
);
