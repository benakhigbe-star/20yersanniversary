-- ============================================================================
-- Dependents: children/teens who don't get their own login, but whose sizes
-- (t-shirt, shoe, dietary needs, etc.) still need to be captured.
--
-- Modeled as a separate table rather than reusing `guests`, because guests
-- are login-capable identities (unique email, session-bearing) and
-- dependents deliberately are not — a dependent belongs to exactly one
-- guest (their parent/guardian), who answers information requests on
-- their behalf from their own session.
--
-- Kept as its own migration (rather than editing 0001/0002) because those
-- may already be applied against a live database — this only adds.
-- ============================================================================

create table guest_dependents (
  id uuid primary key default gen_random_uuid(),
  guest_id uuid not null references guests(id) on delete cascade,
  first_name text not null,
  last_name text,
  age_category text not null default 'child' check (age_category in ('child', 'teen')),
  created_at timestamptz not null default now()
);

create index idx_dependents_guest on guest_dependents(guest_id);

-- Mirrors guest_responses / guest_response_options exactly, keyed by
-- dependent_id instead of guest_id. Kept as a separate table (instead of
-- adding a nullable dependent_id column to guest_responses) to avoid the
-- classic SQL footgun where a multi-column UNIQUE constraint silently
-- stops enforcing uniqueness once one of its columns is NULL.
create table dependent_responses (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references events(id) on delete cascade,
  request_id uuid not null references information_requests(id) on delete cascade,
  dependent_id uuid not null references guest_dependents(id) on delete cascade,
  answer_text text,
  selected_option_id uuid references request_options(id) on delete set null,
  submitted_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (request_id, dependent_id)
);

create index idx_dependent_responses_dependent on dependent_responses(dependent_id);
create index idx_dependent_responses_request on dependent_responses(request_id);

create table dependent_response_options (
  response_id uuid not null references dependent_responses(id) on delete cascade,
  option_id uuid not null references request_options(id) on delete cascade,
  primary key (response_id, option_id)
);

create trigger trg_dependent_responses_updated_at before update on dependent_responses
  for each row execute function set_updated_at();

-- --------------------------------------------------------------------------
-- RLS: same posture as every other table (see 0002_rls.sql) — deny-by-default
-- for anon/authenticated, enforcement happens in the API layer via the
-- guest's session, service-role key used server-only.
-- --------------------------------------------------------------------------
alter table guest_dependents enable row level security;
alter table dependent_responses enable row level security;
alter table dependent_response_options enable row level security;
