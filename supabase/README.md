# Supabase Directory

This folder holds database migrations, seed data, and Supabase local configuration.

## Principles
- All schema changes must be managed via migrations in `supabase/migrations/` (never manually edit database tables).
- Row Level Security (RLS) is strictly enforced for every table.
- Seed data must use synthetic test data only (never real personal data).
