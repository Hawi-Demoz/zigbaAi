-- Migration: Add profile roles and automated auth trigger
-- Enforces that signup can NEVER assign an 'admin' role

-- 1. Create user_role ENUM type
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role_type') THEN
        CREATE TYPE user_role_type AS ENUM ('candidate', 'employer');
    END IF;
END $$;

-- 2. Add role column to profiles table if not present
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' AND column_name = 'role'
    ) THEN
        ALTER TABLE profiles ADD COLUMN role user_role_type NOT NULL DEFAULT 'candidate';
    END IF;
END $$;

-- 3. Update existing seed profiles with their appropriate roles
UPDATE profiles 
SET role = 'employer' 
WHERE id IN (
    '66666666-6666-6666-6666-666666666666', -- Elena Vance (Apex Labs)
    '77777777-7777-7777-7777-777777777777'  -- Marcus Brody (Veritas Cloud)
);

UPDATE profiles 
SET role = 'candidate' 
WHERE id IN (
    '11111111-1111-1111-1111-111111111111',
    '22222222-2222-2222-2222-222222222222',
    '33333333-3333-3333-3333-333333333333',
    '44444444-4444-4444-4444-444444444444',
    '55555555-5555-5555-5555-555555555555'
);

-- 4. Grant permissions to supabase_auth_admin for auth triggers
GRANT USAGE ON SCHEMA public TO supabase_auth_admin;
GRANT ALL ON ALL TABLES IN SCHEMA public TO supabase_auth_admin;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO supabase_auth_admin;
GRANT ALL ON ALL ROUTINES IN SCHEMA public TO supabase_auth_admin;

-- 5. Auth trigger function to automatically create profile on signup
-- Security rule: role is sanitized strictly to ('candidate' | 'employer').
-- Any malicious value (like 'admin') is forced to 'candidate'.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
    assigned_role public.user_role_type;
    meta_name text;
BEGIN
    IF (NEW.raw_user_meta_data->>'role' = 'employer') THEN
        assigned_role := 'employer'::public.user_role_type;
    ELSE
        assigned_role := 'candidate'::public.user_role_type;
    END IF;

    meta_name := COALESCE(NULLIF(NEW.raw_user_meta_data->>'full_name', ''), 'New Member');

    INSERT INTO public.profiles (id, full_name, role)
    VALUES (NEW.id, meta_name, assigned_role)
    ON CONFLICT (id) DO UPDATE
    SET full_name = EXCLUDED.full_name,
        role = EXCLUDED.role;

    RETURN NEW;
EXCEPTION WHEN OTHERS THEN
    -- Fallback: guarantee user creation never fails
    BEGIN
        INSERT INTO public.profiles (id, full_name, role)
        VALUES (NEW.id, 'New Member', 'candidate'::public.user_role_type)
        ON CONFLICT (id) DO NOTHING;
    EXCEPTION WHEN OTHERS THEN
        NULL;
    END;
    RETURN NEW;
END;
$$;

-- 6. Attach trigger to auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_user();
