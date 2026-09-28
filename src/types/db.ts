// Hand-written types mirroring supabase/migrations/0001_init.sql.
// If you introduce `supabase gen types typescript`, this file can be
// replaced/merged with the generated output — the shapes are kept close
// to the generated convention (snake_case columns) on purpose.

export type QuestionType =
  | 'short_text'
  | 'long_text'
  | 'number'
  | 'dropdown'
  | 'radio'
  | 'checkboxes'
  | 'yes_no'
  | 'date'
  | 'multiple_choice';

export type GuestStatus = 'invited' | 'confirmed' | 'declined';
export type AnnouncementPriority = 'normal' | 'important' | 'urgent';
export type ActivityCategory =
  | 'dining'
  | 'entertainment'
  | 'excursions'
  | 'nightlife'
  | 'spa'
  | 'shopping'
  | 'party_events'
  | 'group_activities';

export interface Event {
  id: string;
  slug: string;
  name: string;
  cruise_name: string | null;
  cruise_line: string | null;
  ship_name: string | null;
  departure_port: string | null;
  departure_date: string | null;
  departure_time: string | null;
  return_date: string | null;
  return_port: string | null;
  logo_url: string | null;
  hero_image_url: string | null;
  welcome_message: string | null;
  theme_color: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface EventSettings {
  event_id: string;
  destinations: string | null;
  boarding_info: string | null;
  baggage_info: string | null;
  dress_codes: string | null;
  important_reminders: string | null;
  documents_info: string | null;
  updated_at: string;
}

export interface ItineraryDay {
  id: string;
  event_id: string;
  day_number: number;
  date: string | null;
  port_name: string;
  arrival_time: string | null;
  departure_time: string | null;
  description: string | null;
  display_order: number;
}

export interface Admin {
  id: string;
  event_id: string | null;
  email: string;
  password_hash: string;
  name: string;
  role: 'owner' | 'admin';
  is_active: boolean;
  last_login_at: string | null;
  created_at: string;
}

export interface Guest {
  id: string;
  event_id: string;
  first_name: string;
  last_name: string;
  preferred_name: string | null;
  email: string;
  email_normalized: string;
  phone: string | null;
  gender: string | null;
  group_name: string | null;
  cabin_number: string | null;
  booking_reference: string | null;
  profile_photo_url: string | null;
  status: GuestStatus;
  notes: string | null;
  is_active: boolean;
  date_added: string;
  last_login_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface InformationRequest {
  id: string;
  event_id: string;
  title: string;
  description: string | null;
  question_type: QuestionType;
  is_required: boolean;
  deadline: string | null;
  display_order: number;
  is_active: boolean;
  allow_edit_after_submit: boolean;
  icon: string | null;
  config: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface RequestOption {
  id: string;
  request_id: string;
  label: string;
  value: string;
  display_order: number;
  image_url: string | null;
}

export interface GuestResponse {
  id: string;
  event_id: string;
  request_id: string;
  guest_id: string;
  answer_text: string | null;
  selected_option_id: string | null;
  submitted_at: string;
  updated_at: string;
}

export type DependentAgeCategory = 'child' | 'teen';

export interface GuestDependent {
  id: string;
  guest_id: string;
  first_name: string;
  last_name: string | null;
  age_category: DependentAgeCategory;
  created_at: string;
}

export interface DependentResponse {
  id: string;
  event_id: string;
  request_id: string;
  dependent_id: string;
  answer_text: string | null;
  selected_option_id: string | null;
  submitted_at: string;
  updated_at: string;
}

export interface Activity {
  id: string;
  event_id: string;
  image_url: string | null;
  name: string;
  description: string | null;
  location: string | null;
  activity_date: string | null;
  activity_time: string | null;
  cost: string | null;
  booking_required: boolean;
  booking_link: string | null;
  category: ActivityCategory;
  display_order: number;
  is_active: boolean;
  created_at: string;
}

export interface ScheduleItem {
  id: string;
  event_id: string;
  day_number: number;
  day_label: string | null;
  icon: string | null;
  title: string;
  item_time: string | null;
  description: string | null;
  display_order: number;
}

export interface Announcement {
  id: string;
  event_id: string;
  title: string;
  body: string;
  priority: AnnouncementPriority;
  is_published: boolean;
  published_at: string | null;
  created_by: string | null;
  created_at: string;
}

export interface UsefulLink {
  id: string;
  event_id: string;
  title: string;
  description: string | null;
  icon: string | null;
  url: string;
  category: string;
  display_order: number;
  is_active: boolean;
}

export interface PackingItem {
  id: string;
  event_id: string;
  label: string;
  category: string | null;
  display_order: number;
  is_active: boolean;
}

export interface GuestPackingStatus {
  guest_id: string;
  packing_item_id: string;
  is_checked: boolean;
  checked_at: string | null;
}

export interface AppGuide {
  id: string;
  event_id: string;
  app_name: string;
  app_store_url: string | null;
  google_play_url: string | null;
  intro_description: string | null;
}

export interface AppGuideStep {
  id: string;
  app_guide_id: string;
  step_number: number;
  title: string;
  description: string | null;
  image_url: string | null;
  display_order: number;
}

export interface AppGuideFeature {
  id: string;
  app_guide_id: string;
  label: string;
  display_order: number;
}

export interface AppGuideTip {
  id: string;
  app_guide_id: string;
  tip: string;
  display_order: number;
}

export interface ActivityLogEntry {
  id: string;
  event_id: string;
  guest_id: string | null;
  admin_id: string | null;
  action_type: string;
  message: string;
  metadata: Record<string, unknown>;
  created_at: string;
}
