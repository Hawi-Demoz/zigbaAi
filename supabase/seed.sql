-- Synthetic Seed Data for Phase 1
-- Adheres to: synthetic test data only, beginner inclusion, evidence-backed claims

-- 1. SYNTHETIC USERS (AUTH.USERS PLACEHOLDERS)
-- In real Supabase, users are created via Auth. For local testing and schema seeds, we populate auth.users safely.
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'auth' AND table_name = 'users') THEN
        INSERT INTO auth.users (
            instance_id,
            id,
            aud,
            role,
            email,
            encrypted_password,
            email_confirmed_at,
            raw_app_meta_data,
            raw_user_meta_data,
            created_at,
            updated_at
        )
        VALUES 
            ('00000000-0000-0000-0000-000000000000', '11111111-1111-1111-1111-111111111111', 'authenticated', 'authenticated', 'alex.rivera@synthetic.test', crypt('synthetic-password-123', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}'::jsonb, '{"full_name": "Alex Rivera"}'::jsonb, now(), now()),
            ('00000000-0000-0000-0000-000000000000', '22222222-2222-2222-2222-222222222222', 'authenticated', 'authenticated', 'jordan.chen@synthetic.test', crypt('synthetic-password-123', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}'::jsonb, '{"full_name": "Jordan Chen"}'::jsonb, now(), now()),
            ('00000000-0000-0000-0000-000000000000', '33333333-3333-3333-3333-333333333333', 'authenticated', 'authenticated', 'morgan.taylor@synthetic.test', crypt('synthetic-password-123', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}'::jsonb, '{"full_name": "Morgan Taylor"}'::jsonb, now(), now()),
            ('00000000-0000-0000-0000-000000000000', '44444444-4444-4444-4444-444444444444', 'authenticated', 'authenticated', 'samira.patel@synthetic.test', crypt('synthetic-password-123', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}'::jsonb, '{"full_name": "Samira Patel"}'::jsonb, now(), now()),
            ('00000000-0000-0000-0000-000000000000', '55555555-5555-5555-5555-555555555555', 'authenticated', 'authenticated', 'taylor.brooks@synthetic.test', crypt('synthetic-password-123', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}'::jsonb, '{"full_name": "Taylor Brooks"}'::jsonb, now(), now()),
            ('00000000-0000-0000-0000-000000000000', '66666666-6666-6666-6666-666666666666', 'authenticated', 'authenticated', 'elena.vance@synthetic.test', crypt('synthetic-password-123', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}'::jsonb, '{"full_name": "Elena Vance"}'::jsonb, now(), now()),
            ('00000000-0000-0000-0000-000000000000', '77777777-7777-7777-7777-777777777777', 'authenticated', 'authenticated', 'marcus.brody@synthetic.test', crypt('synthetic-password-123', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}'::jsonb, '{"full_name": "Marcus Brody"}'::jsonb, now(), now())
        ON CONFLICT (id) DO NOTHING;
    END IF;
END $$;


-- 2. CANDIDATE & EMPLOYER PROFILES
INSERT INTO profiles (id, full_name, headline, bio, location)
VALUES
    ('11111111-1111-1111-1111-111111111111', 'Alex Rivera', 'Self-Taught Full-Stack Developer', 'Passionate about building clean modular web apps. No traditional degree, portfolio speaks for itself.', 'Chicago, IL'),
    ('22222222-2222-2222-2222-222222222222', 'Jordan Chen', 'Backend Engineer | Python & APIs', 'Specializing in high-throughput FastAPI services, PostgreSQL modeling, and RLS.', 'San Francisco, CA'),
    ('33333333-3333-3333-3333-333333333333', 'Morgan Taylor', 'Frontend Developer | React & Next.js', 'Focused on responsive design, Tailwind CSS systems, and accessible user experiences.', 'New York, NY'),
    ('44444444-4444-4444-4444-444444444444', 'Samira Patel', 'Cloud & Systems Engineer', 'Automating deployments and building resilient containerized backend infrastructure.', 'Austin, TX'),
    ('55555555-5555-5555-5555-555555555555', 'Taylor Brooks', 'Junior Software Engineer', 'Recent boot camp graduate eager to contribute to production web stacks.', 'Remote'),
    ('66666666-6666-6666-6666-666666666666', 'Elena Vance', 'Engineering Director @ Apex Labs', 'Leading development teams building scalable SaaS products.', 'Seattle, WA'),
    ('77777777-7777-7777-7777-777777777777', 'Marcus Brody', 'Technical Talent Partner @ Veritas Cloud', 'Connecting authentic engineering talent with high-impact cloud infrastructure teams.', 'Boston, MA')
ON CONFLICT (id) DO NOTHING;

-- 3. GLOBAL SKILLS DIRECTORY
INSERT INTO skills (id, name, category)
VALUES
    ('aaaaaaaa-0001-0000-0000-000000000001', 'Python', 'Backend'),
    ('aaaaaaaa-0002-0000-0000-000000000002', 'FastAPI', 'Backend'),
    ('aaaaaaaa-0003-0000-0000-000000000003', 'PostgreSQL', 'Database'),
    ('aaaaaaaa-0004-0000-0000-000000000004', 'React', 'Frontend'),
    ('aaaaaaaa-0005-0000-0000-000000000005', 'TypeScript', 'Frontend'),
    ('aaaaaaaa-0006-0000-0000-000000000006', 'Tailwind CSS', 'Frontend'),
    ('aaaaaaaa-0007-0000-0000-000000000007', 'Next.js', 'Frontend')
ON CONFLICT (name) DO NOTHING;

-- 4. CANDIDATE PROFILE SKILLS
INSERT INTO profile_skills (id, profile_id, skill_id, years_experience)
VALUES
    ('bbbbbbbb-0001-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', 'aaaaaaaa-0001-0000-0000-000000000001', 1.5),
    ('bbbbbbbb-0002-0000-0000-000000000002', '11111111-1111-1111-1111-111111111111', 'aaaaaaaa-0004-0000-0000-000000000004', 1.0),
    ('bbbbbbbb-0003-0000-0000-000000000003', '22222222-2222-2222-2222-222222222222', 'aaaaaaaa-0001-0000-0000-000000000001', 4.0),
    ('bbbbbbbb-0004-0000-0000-000000000004', '22222222-2222-2222-2222-222222222222', 'aaaaaaaa-0002-0000-0000-000000000002', 3.0),
    ('bbbbbbbb-0005-0000-0000-000000000005', '33333333-3333-3333-3333-333333333333', 'aaaaaaaa-0004-0000-0000-000000000004', 3.5),
    ('bbbbbbbb-0006-0000-0000-000000000006', '33333333-3333-3333-3333-333333333333', 'aaaaaaaa-0007-0000-0000-000000000007', 2.5)
ON CONFLICT DO NOTHING;

-- 5. CANDIDATE PROJECTS (BEGINNER-FRIENDLY PROOF OF WORK)
INSERT INTO projects (id, created_by, title, description, repository_url, live_url)
VALUES
    ('cccccccc-0001-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', 'Open-Source Markdown Parser', 'High-performance markdown parser written in Python with complete test coverage.', 'https://github.com/synthetic/md-parser', 'https://parser.synthetic.demo'),
    ('cccccccc-0002-0000-0000-000000000002', '22222222-2222-2222-2222-222222222222', 'Distributed Rate Limiter', 'Token-bucket rate limiter middleware for FastAPI backed by Redis with zero-leak guarantees.', 'https://github.com/synthetic/fastapi-limiter', NULL)
ON CONFLICT (id) DO NOTHING;

-- 6. EVIDENCE ITEMS (EVIDENCE OVER CLAIMS)
INSERT INTO evidence_items (id, profile_id, claim_type, claim_id, title, evidence_url, visibility, status, verification_notes)
VALUES
    ('dddddddd-0001-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', 'project', 'cccccccc-0001-0000-0000-000000000001', 'Test Suite & Git Commit Log', 'https://github.com/synthetic/md-parser/actions', 'application_only', 'evidence_submitted', NULL),
    ('dddddddd-0002-0000-0000-000000000002', '22222222-2222-2222-2222-222222222222', 'skill', 'bbbbbbbb-0004-0000-0000-000000000004', 'FastAPI Core Contributor Commit #4812', 'https://github.com/synthetic/fastapi/commit/4812', 'public', 'evidence_reviewed', 'Checked GitHub author signature, commit SHA, and test suite execution')
ON CONFLICT (id) DO NOTHING;

-- 7. 2 FAKE COMPANIES
INSERT INTO companies (id, name, website, description)
VALUES
    ('eeeeeeee-0001-0000-0000-000000000001', 'Apex Software Labs', 'https://apexlabs.synthetic.test', 'Engineering-driven product studio specializing in high-trust web applications.'),
    ('eeeeeeee-0002-0000-0000-000000000002', 'Veritas Cloud Technologies', 'https://veritascloud.synthetic.test', 'Cloud infrastructure and data systems with evidence-based reliability.')
ON CONFLICT (name) DO NOTHING;

-- 8. COMPANY MEMBERS
INSERT INTO company_members (company_id, profile_id, role)
VALUES
    ('eeeeeeee-0001-0000-0000-000000000001', '66666666-6666-6666-6666-666666666666', 'owner'),
    ('eeeeeeee-0002-0000-0000-000000000002', '77777777-7777-7777-7777-777777777777', 'recruiter')
ON CONFLICT (company_id, profile_id) DO NOTHING;

-- 9. JOBS
INSERT INTO jobs (id, company_id, created_by, title, description, location_type, salary_min, salary_max, status)
VALUES
    ('ffffffff-0001-0000-0000-000000000001', 'eeeeeeee-0001-0000-0000-000000000001', '66666666-6666-6666-6666-666666666666', 'Junior Full-Stack Engineer', 'Build modern customer-facing apps with Next.js, Python, and PostgreSQL. Beginners with strong evidence encouraged.', 'remote', 75000.00, 95000.00, 'published'),
    ('ffffffff-0002-0000-0000-000000000002', 'eeeeeeee-0002-0000-0000-000000000002', '77777777-7777-7777-7777-777777777777', 'Backend Cloud Systems Engineer', 'Scale distributed backend APIs using FastAPI and PostgreSQL with robust security.', 'hybrid', 120000.00, 150000.00, 'published')
ON CONFLICT (id) DO NOTHING;

-- 10. STRUCTURED JOB REQUIREMENTS (MUST-HAVE & NICE-TO-HAVE)
INSERT INTO job_requirements (id, job_id, skill_id, requirement_text, requirement_type, min_evidence_level)
VALUES
    ('10000000-0001-0000-0000-000000000001', 'ffffffff-0001-0000-0000-000000000001', 'aaaaaaaa-0001-0000-0000-000000000001', 'Solid understanding of Python programming concepts and testing', 'must_have', 'evidence_submitted'),
    ('10000000-0002-0000-0000-000000000001', 'ffffffff-0001-0000-0000-000000000001', 'aaaaaaaa-0004-0000-0000-000000000004', 'Experience creating React UI components with responsive CSS', 'must_have', 'self_reported'),
    ('10000000-0003-0000-0000-000000000001', 'ffffffff-0001-0000-0000-000000000001', 'aaaaaaaa-0003-0000-0000-000000000003', 'Familiarity with SQL relational schemas and migrations', 'nice_to_have', 'self_reported'),
    ('10000000-0004-0000-0000-000000000001', 'ffffffff-0002-0000-0000-000000000002', 'aaaaaaaa-0002-0000-0000-000000000002', 'Production experience architecting FastAPI services with Pydantic', 'must_have', 'evidence_reviewed')
ON CONFLICT (id) DO NOTHING;

-- 11. APPLICATIONS (ONE CANDIDATE TO ONE JOB)
INSERT INTO applications (id, job_id, candidate_id, status, cover_note)
VALUES
    ('20000000-0001-0000-0000-000000000001', 'ffffffff-0001-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', 'submitted', 'Excited about the Junior Full-Stack role. Please inspect my test coverage and project evidence!'),
    ('20000000-0002-0000-0000-000000000002', 'ffffffff-0002-0000-0000-000000000002', '22222222-2222-2222-2222-222222222222', 'under_review', 'Senior backend engineer with deep experience in FastAPI and PostgreSQL security.')
ON CONFLICT (job_id, candidate_id) DO NOTHING;
