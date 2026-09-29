import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().trim().min(3).max(254).email('Enter a valid email address.'),
});

export const questionTypeSchema = z.enum([
  'short_text',
  'long_text',
  'number',
  'dropdown',
  'radio',
  'checkboxes',
  'yes_no',
  'date',
  'multiple_choice',
]);

export const requestOptionInputSchema = z.object({
  id: z.string().uuid().optional(),
  label: z.string().trim().min(1).max(200),
  value: z.string().trim().min(1).max(200),
  display_order: z.number().int().min(0).default(0),
  image_url: z.string().trim().url().optional().nullable().or(z.literal('')),
});

export const informationRequestInputSchema = z.object({
  title: z.string().trim().min(1).max(200),
  description: z.string().trim().max(2000).optional().nullable(),
  question_type: questionTypeSchema,
  is_required: z.boolean().default(false),
  deadline: z.string().datetime().optional().nullable().or(z.literal('')),
  display_order: z.number().int().min(0).default(0),
  is_active: z.boolean().default(true),
  allow_edit_after_submit: z.boolean().default(true),
  icon: z.string().trim().max(10).optional().nullable(),
  config: z.record(z.unknown()).default({}),
  options: z.array(requestOptionInputSchema).default([]),
});

export const responseSubmitSchema = z.object({
  request_id: z.string().uuid(),
  answer_text: z.string().trim().max(4000).optional().nullable(),
  selected_option_id: z.string().uuid().optional().nullable(),
  selected_option_ids: z.array(z.string().uuid()).optional(),
});

export const invitationSubmitSchema = z.object({
  first_name: z.string().trim().min(1).max(100),
  last_name: z.string().trim().min(1).max(100),
  preferred_name: z.string().trim().max(100).optional().nullable(),
  email: z.string().trim().email().max(254),
  note: z.string().trim().max(1000).optional().nullable(),
});

export const dependentInputSchema = z.object({
  first_name: z.string().trim().min(1).max(100),
  last_name: z.string().trim().max(100).optional().nullable(),
  age_category: z.enum(['child', 'teen']).default('child'),
});

export const dependentResponseSubmitSchema = responseSubmitSchema.extend({
  dependent_id: z.string().uuid(),
});

export const guestInputSchema = z.object({
  first_name: z.string().trim().min(1).max(100),
  last_name: z.string().trim().min(1).max(100),
  preferred_name: z.string().trim().max(100).optional().nullable(),
  email: z.string().trim().email().max(254),
  phone: z.string().trim().max(40).optional().nullable(),
  gender: z.string().trim().max(40).optional().nullable(),
  group_name: z.string().trim().max(100).optional().nullable(),
  cabin_number: z.string().trim().max(40).optional().nullable(),
  booking_reference: z.string().trim().max(80).optional().nullable(),
  status: z.enum(['invited', 'confirmed', 'declined']).default('invited'),
  notes: z.string().trim().max(2000).optional().nullable(),
  is_active: z.boolean().default(true),
});

export const activityInputSchema = z.object({
  image_url: z.string().trim().url().optional().nullable().or(z.literal('')),
  name: z.string().trim().min(1).max(200),
  description: z.string().trim().max(2000).optional().nullable(),
  location: z.string().trim().max(200).optional().nullable(),
  activity_date: z.string().optional().nullable().or(z.literal('')),
  activity_time: z.string().optional().nullable().or(z.literal('')),
  cost: z.string().trim().max(60).optional().nullable(),
  booking_required: z.boolean().default(false),
  booking_link: z.string().trim().url().optional().nullable().or(z.literal('')),
  category: z.enum([
    'dining',
    'entertainment',
    'excursions',
    'nightlife',
    'spa',
    'shopping',
    'party_events',
    'group_activities',
  ]),
  display_order: z.number().int().min(0).default(0),
  is_active: z.boolean().default(true),
});

export const scheduleItemInputSchema = z.object({
  day_number: z.number().int().min(1),
  day_label: z.string().trim().max(100).optional().nullable(),
  icon: z.string().trim().max(10).optional().nullable(),
  title: z.string().trim().min(1).max(200),
  item_time: z.string().trim().max(40).optional().nullable(),
  description: z.string().trim().max(2000).optional().nullable(),
  display_order: z.number().int().min(0).default(0),
});

export const announcementInputSchema = z.object({
  title: z.string().trim().min(1).max(200),
  body: z.string().trim().min(1).max(4000),
  priority: z.enum(['normal', 'important', 'urgent']).default('normal'),
  is_published: z.boolean().default(false),
});

export const usefulLinkInputSchema = z.object({
  title: z.string().trim().min(1).max(200),
  description: z.string().trim().max(1000).optional().nullable(),
  icon: z.string().trim().max(10).optional().nullable(),
  url: z.string().trim().url(),
  category: z.string().trim().min(1).max(60),
  display_order: z.number().int().min(0).default(0),
  is_active: z.boolean().default(true),
});

export const packingItemInputSchema = z.object({
  label: z.string().trim().min(1).max(200),
  category: z.string().trim().max(60).optional().nullable(),
  display_order: z.number().int().min(0).default(0),
  is_active: z.boolean().default(true),
});

export const eventSettingsInputSchema = z.object({
  name: z.string().trim().min(1).max(200).optional(),
  cruise_name: z.string().trim().max(200).optional().nullable(),
  cruise_line: z.string().trim().max(200).optional().nullable(),
  ship_name: z.string().trim().max(200).optional().nullable(),
  departure_port: z.string().trim().max(200).optional().nullable(),
  departure_date: z.string().optional().nullable().or(z.literal('')),
  departure_time: z.string().optional().nullable().or(z.literal('')),
  return_date: z.string().optional().nullable().or(z.literal('')),
  return_port: z.string().trim().max(200).optional().nullable(),
  logo_url: z.string().trim().url().optional().nullable().or(z.literal('')),
  hero_image_url: z.string().trim().url().optional().nullable().or(z.literal('')),
  welcome_message: z.string().trim().max(1000).optional().nullable(),
  theme_color: z.string().trim().max(20).optional().nullable(),
  destinations: z.string().trim().max(2000).optional().nullable(),
  boarding_info: z.string().trim().max(4000).optional().nullable(),
  baggage_info: z.string().trim().max(4000).optional().nullable(),
  dress_codes: z.string().trim().max(4000).optional().nullable(),
  important_reminders: z.string().trim().max(4000).optional().nullable(),
  documents_info: z.string().trim().max(4000).optional().nullable(),
});

export const itineraryDayInputSchema = z.object({
  day_number: z.number().int().min(1),
  date: z.string().optional().nullable().or(z.literal('')),
  port_name: z.string().trim().min(1).max(200),
  arrival_time: z.string().optional().nullable().or(z.literal('')),
  departure_time: z.string().optional().nullable().or(z.literal('')),
  description: z.string().trim().max(1000).optional().nullable(),
  display_order: z.number().int().min(0).default(0),
});

export const appGuideInputSchema = z.object({
  app_name: z.string().trim().min(1).max(200),
  app_store_url: z.string().trim().url().optional().nullable().or(z.literal('')),
  google_play_url: z.string().trim().url().optional().nullable().or(z.literal('')),
  intro_description: z.string().trim().max(2000).optional().nullable(),
  steps: z
    .array(
      z.object({
        step_number: z.number().int().min(1),
        title: z.string().trim().min(1).max(200),
        description: z.string().trim().max(1000).optional().nullable(),
        image_url: z.string().trim().url().optional().nullable().or(z.literal('')),
        display_order: z.number().int().min(0).default(0),
      })
    )
    .default([]),
  features: z.array(z.object({ label: z.string().trim().min(1).max(200), display_order: z.number().int().min(0).default(0) })).default([]),
  tips: z.array(z.object({ tip: z.string().trim().min(1).max(500), display_order: z.number().int().min(0).default(0) })).default([]),
});

export const adminLoginSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(1).max(200),
});

export const csvGuestRowSchema = z.object({
  first_name: z.string().trim().min(1),
  last_name: z.string().trim().min(1),
  email: z.string().trim().email(),
  preferred_name: z.string().trim().optional(),
  phone: z.string().trim().optional(),
  gender: z.string().trim().optional(),
  group_name: z.string().trim().optional(),
  cabin_number: z.string().trim().optional(),
  booking_reference: z.string().trim().optional(),
});
