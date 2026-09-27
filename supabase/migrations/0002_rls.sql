-- ============================================================================
-- Row Level Security
--
-- IMPORTANT — read this before assuming RLS is "the" access control layer.
-- Guests authenticate through a custom passwordless flow (see README), not
-- Supabase Auth, so there is no `auth.uid()` to key guest policies off of.
-- The browser NEVER talks to Supabase directly: all reads/writes go through
-- Next.js API routes running with the service-role key, which is what
-- actually enforces "guest X can only see guest X's data" (see
-- src/lib/supabase/admin.ts and the API route handlers).
--
-- These policies exist as defense-in-depth (lock the anon/authenticated
-- keys out completely) and to make a future migration to Supabase Auth /
-- magic links a policy-tightening exercise instead of a rewrite.
-- ============================================================================

alter table events enable row level security;
alter table event_settings enable row level security;
alter table itinerary_days enable row level security;
alter table admins enable row level security;
alter table guests enable row level security;
alter table information_requests enable row level security;
alter table request_options enable row level security;
alter table guest_responses enable row level security;
alter table guest_response_options enable row level security;
alter table activities enable row level security;
alter table schedule_items enable row level security;
alter table announcements enable row level security;
alter table useful_links enable row level security;
alter table packing_items enable row level security;
alter table guest_packing_status enable row level security;
alter table app_guides enable row level security;
alter table app_guide_steps enable row level security;
alter table app_guide_features enable row level security;
alter table app_guide_tips enable row level security;
alter table activity_log enable row level security;
alter table login_attempts enable row level security;

-- Deny-by-default: no policies are created for `anon` or `authenticated`
-- roles on any table, so PostgREST (the anon/authenticated API path) returns
-- zero rows / permission denied everywhere. The `service_role` key bypasses
-- RLS entirely by design in Supabase and is only ever used server-side.
--
-- If/when this app switches guests to Supabase Auth magic links, add
-- policies here such as:
--
--   create policy "guests can read own row" on guests
--     for select using (auth.jwt() ->> 'email' = email_normalized);
--
--   create policy "guests can read own responses" on guest_responses
--     for select using (
--       guest_id in (select id from guests where auth.jwt() ->> 'email' = email_normalized)
--     );
--
-- and equivalent update policies scoped the same way, then start issuing
-- guests real Supabase sessions instead of the custom cookie.
