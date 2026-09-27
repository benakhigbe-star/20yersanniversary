-- ============================================================================
-- Cruise Party Guest Portal — initial schema
-- Multi-event ready: every guest-facing table carries event_id from day one,
-- even though this deployment only seeds a single event.
-- ============================================================================

create extension if not exists "pgcrypto";

-- ----------------------------------------------------------------------------
-- events: one row per cruise/party. Everything else hangs off event_id.
-- ----------------------------------------------------------------------------
create table events (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  cruise_name text,
  cruise_line text,
  ship_name text,
  departure_port text,
  departure_date date,
  departure_time time,
  return_date date,
  return_port text,
  logo_url text,
  hero_image_url text,
  welcome_message text,
  theme_color text default '#0ea5a4',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Extended, rarely-queried cruise info content. Kept separate from `events`
-- so the hot path (event name/dates/branding) stays a small row.
create table event_settings (
  event_id uuid primary key references events(id) on delete cascade,
  destinations text,
  boarding_info text,
  baggage_info text,
  dress_codes text,
  important_reminders text,
  documents_info text,
  updated_at timestamptz not null default now()
);

-- Cruise line itinerary (ports of call), distinct from the friends' own party schedule.
create table itinerary_days (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references events(id) on delete cascade,
  day_number int not null,
  date date,
  port_name text not null,
  arrival_time time,
  departure_time time,
  description text,
  display_order int not null default 0,
  created_at timestamptz not null default now(),
  unique (event_id, day_number)
);

-- ----------------------------------------------------------------------------
-- admins: separate, higher-security auth path from guests.
-- ----------------------------------------------------------------------------
create table admins (
  id uuid primary key default gen_random_uuid(),
  event_id uuid references events(id) on delete set null,
  email text not null unique,
  password_hash text not null,
  name text not null,
  role text not null default 'admin' check (role in ('owner', 'admin')),
  is_active boolean not null default true,
  last_login_at timestamptz,
  created_at timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- guests: preloaded by admin, no self-registration.
-- ----------------------------------------------------------------------------
create table guests (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references events(id) on delete cascade,
  first_name text not null,
  last_name text not null,
  preferred_name text,
  email text not null,
  email_normalized text not null,
  phone text,
  gender text,
  group_name text,
  cabin_number text,
  booking_reference text,
  profile_photo_url text,
  status text not null default 'invited' check (status in ('invited', 'confirmed', 'declined')),
  notes text,
  is_active boolean not null default true,
  date_added timestamptz not null default now(),
  last_login_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (event_id, email_normalized)
);

create index idx_guests_event on guests(event_id);
create index idx_guests_email_normalized on guests(email_normalized);
create index idx_guests_group on guests(event_id, group_name);

-- ----------------------------------------------------------------------------
-- information_requests: admin-defined dynamic forms.
-- ----------------------------------------------------------------------------
create table information_requests (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references events(id) on delete cascade,
  title text not null,
  description text,
  question_type text not null check (question_type in (
    'short_text', 'long_text', 'number', 'dropdown', 'radio',
    'checkboxes', 'yes_no', 'date', 'multiple_choice'
  )),
  is_required boolean not null default false,
  deadline timestamptz,
  display_order int not null default 0,
  is_active boolean not null default true,
  allow_edit_after_submit boolean not null default true,
  icon text,
  config jsonb not null default '{}'::jsonb, -- small display config only, e.g. {"sizing_system":"UK"}
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_requests_event on information_requests(event_id, display_order);

create table request_options (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references information_requests(id) on delete cascade,
  label text not null,
  value text not null,
  display_order int not null default 0
);

create index idx_request_options_request on request_options(request_id, display_order);

-- ----------------------------------------------------------------------------
-- guest_responses: one row per (request, guest). Multi-select answers live
-- in the junction table below rather than as an array/jsonb blob.
-- ----------------------------------------------------------------------------
create table guest_responses (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references events(id) on delete cascade,
  request_id uuid not null references information_requests(id) on delete cascade,
  guest_id uuid not null references guests(id) on delete cascade,
  answer_text text,
  selected_option_id uuid references request_options(id) on delete set null,
  submitted_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (request_id, guest_id)
);

create index idx_responses_guest on guest_responses(guest_id);
create index idx_responses_request on guest_responses(request_id);

create table guest_response_options (
  response_id uuid not null references guest_responses(id) on delete cascade,
  option_id uuid not null references request_options(id) on delete cascade,
  primary key (response_id, option_id)
);

-- ----------------------------------------------------------------------------
-- activities ("Things To Do")
-- ----------------------------------------------------------------------------
create table activities (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references events(id) on delete cascade,
  image_url text,
  name text not null,
  description text,
  location text,
  activity_date date,
  activity_time time,
  cost text,
  booking_required boolean not null default false,
  booking_link text,
  category text not null default 'group_activities' check (category in (
    'dining', 'entertainment', 'excursions', 'nightlife', 'spa', 'shopping', 'party_events', 'group_activities'
  )),
  display_order int not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create index idx_activities_event on activities(event_id, category);

-- ----------------------------------------------------------------------------
-- schedule_items ("Our Party Schedule")
-- ----------------------------------------------------------------------------
create table schedule_items (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references events(id) on delete cascade,
  day_number int not null,
  day_label text,
  icon text,
  title text not null,
  item_time text,
  description text,
  display_order int not null default 0,
  created_at timestamptz not null default now()
);

create index idx_schedule_event on schedule_items(event_id, day_number, display_order);

-- ----------------------------------------------------------------------------
-- announcements
-- ----------------------------------------------------------------------------
create table announcements (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references events(id) on delete cascade,
  title text not null,
  body text not null,
  priority text not null default 'normal' check (priority in ('normal', 'important', 'urgent')),
  is_published boolean not null default false,
  published_at timestamptz,
  created_by uuid references admins(id) on delete set null,
  created_at timestamptz not null default now()
);

create index idx_announcements_event on announcements(event_id, is_published, published_at desc);

-- ----------------------------------------------------------------------------
-- useful_links
-- ----------------------------------------------------------------------------
create table useful_links (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references events(id) on delete cascade,
  title text not null,
  description text,
  icon text,
  url text not null,
  category text not null default 'general',
  display_order int not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create index idx_links_event on useful_links(event_id, category);

-- ----------------------------------------------------------------------------
-- packing checklist (master list + per-guest ticked state)
-- ----------------------------------------------------------------------------
create table packing_items (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references events(id) on delete cascade,
  label text not null,
  category text default 'general',
  display_order int not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create index idx_packing_items_event on packing_items(event_id, display_order);

create table guest_packing_status (
  guest_id uuid not null references guests(id) on delete cascade,
  packing_item_id uuid not null references packing_items(id) on delete cascade,
  is_checked boolean not null default false,
  checked_at timestamptz,
  primary key (guest_id, packing_item_id)
);

-- ----------------------------------------------------------------------------
-- app_guides ("Cruise App Guide")
-- ----------------------------------------------------------------------------
create table app_guides (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references events(id) on delete cascade,
  app_name text not null,
  app_store_url text,
  google_play_url text,
  intro_description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table app_guide_steps (
  id uuid primary key default gen_random_uuid(),
  app_guide_id uuid not null references app_guides(id) on delete cascade,
  step_number int not null,
  title text not null,
  description text,
  image_url text,
  display_order int not null default 0
);

create index idx_app_guide_steps on app_guide_steps(app_guide_id, display_order);

create table app_guide_features (
  id uuid primary key default gen_random_uuid(),
  app_guide_id uuid not null references app_guides(id) on delete cascade,
  label text not null,
  display_order int not null default 0
);

create table app_guide_tips (
  id uuid primary key default gen_random_uuid(),
  app_guide_id uuid not null references app_guides(id) on delete cascade,
  tip text not null,
  display_order int not null default 0
);

-- ----------------------------------------------------------------------------
-- activity_log (admin dashboard "recent activity" feed + audit trail)
-- ----------------------------------------------------------------------------
create table activity_log (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references events(id) on delete cascade,
  guest_id uuid references guests(id) on delete set null,
  admin_id uuid references admins(id) on delete set null,
  action_type text not null,
  message text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index idx_activity_log_event on activity_log(event_id, created_at desc);

-- ----------------------------------------------------------------------------
-- login_attempts: DB-backed rate limiting (survives serverless cold starts)
-- ----------------------------------------------------------------------------
create table login_attempts (
  id uuid primary key default gen_random_uuid(),
  identifier text not null, -- normalized email or ip address
  kind text not null default 'guest' check (kind in ('guest', 'admin')),
  succeeded boolean not null default false,
  created_at timestamptz not null default now()
);

create index idx_login_attempts_identifier on login_attempts(identifier, kind, created_at desc);

-- ----------------------------------------------------------------------------
-- updated_at helper trigger
-- ----------------------------------------------------------------------------
create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger trg_events_updated_at before update on events
  for each row execute function set_updated_at();
create trigger trg_event_settings_updated_at before update on event_settings
  for each row execute function set_updated_at();
create trigger trg_guests_updated_at before update on guests
  for each row execute function set_updated_at();
create trigger trg_requests_updated_at before update on information_requests
  for each row execute function set_updated_at();
create trigger trg_responses_updated_at before update on guest_responses
  for each row execute function set_updated_at();
create trigger trg_app_guides_updated_at before update on app_guides
  for each row execute function set_updated_at();
