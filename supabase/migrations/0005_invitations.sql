-- ============================================================================
-- Public invitation requests.
--
-- Guest self-registration is deliberately NOT allowed anywhere else in this
-- app (only an admin-preloaded email can log in) — this table is the one
-- sanctioned front door for "I know about the party but the organiser
-- doesn't have my email yet". A submission here creates nothing an
-- unauthenticated visitor can log in with; it only becomes a real `guests`
-- row once an admin approves it (see src/app/api/admin/invitations).
-- ============================================================================

create table signup_requests (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references events(id) on delete cascade,
  first_name text not null,
  last_name text not null,
  preferred_name text,
  email text not null,
  email_normalized text not null,
  note text,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  guest_id uuid references guests(id) on delete set null,
  reviewed_by uuid references admins(id) on delete set null,
  reviewed_at timestamptz,
  created_at timestamptz not null default now()
);

create index idx_signup_requests_event on signup_requests(event_id, status, created_at desc);

-- Only one PENDING request per email per event — resubmitting after a
-- rejection is fine (that's a new decision for the admin to make), but
-- spamming the same pending request repeatedly is not.
create unique index idx_signup_requests_pending_email
  on signup_requests(event_id, email_normalized)
  where status = 'pending';

alter table signup_requests enable row level security;

-- Extend login_attempts to also rate-limit this public, unauthenticated
-- endpoint (same DB-backed approach as guest/admin login — see
-- src/lib/rate-limit.ts).
alter table login_attempts drop constraint login_attempts_kind_check;
alter table login_attempts add constraint login_attempts_kind_check
  check (kind in ('guest', 'admin', 'invitation'));
