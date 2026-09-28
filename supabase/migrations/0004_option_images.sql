-- ============================================================================
-- Photo-based option pickers (e.g. "Select Your Scarf Colour" with a photo
-- per colour) for dropdown/radio/checkbox/multiple-choice information
-- requests — not limited to clothing, works for any option-based request.
-- ============================================================================

alter table request_options add column image_url text;

-- Public bucket for admin-uploaded option photos. "Public" here just means
-- objects are servable via their public URL without a signed link — appropriate
-- since these are outfit/colour option photos, not sensitive data. Every
-- write to this bucket goes through the admin API using the service-role
-- key (see src/app/api/admin/upload/route.ts), which bypasses Storage RLS
-- the same way it bypasses table RLS everywhere else in this app — so no
-- additional storage.objects policies are needed for uploads.
insert into storage.buckets (id, name, public)
values ('option-images', 'option-images', true)
on conflict (id) do nothing;
