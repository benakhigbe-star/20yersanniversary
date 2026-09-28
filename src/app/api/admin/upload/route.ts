import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'node:crypto';
import { requireAdminSession, jsonError } from '@/lib/api-helpers';
import { supabaseAdmin } from '@/lib/supabase/admin';

const MAX_BYTES = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
};

/**
 * Generic image upload for admin-authored content (option photos today;
 * reusable for activity/logo images later). Always goes through the
 * service-role key server-side — the browser never talks to Supabase
 * Storage directly, matching every other write path in this app.
 */
export async function POST(req: NextRequest) {
  const guard = await requireAdminSession();
  if ('error' in guard) return guard.error;

  const formData = await req.formData().catch(() => null);
  const file = formData?.get('file');
  if (!file || !(file instanceof File)) return jsonError(400, 'No file uploaded.');

  const extension = ALLOWED_TYPES[file.type];
  if (!extension) return jsonError(400, 'Please upload a JPEG, PNG, WebP, or GIF image.');
  if (file.size > MAX_BYTES) return jsonError(400, 'Image must be under 5MB.');

  const path = `${randomUUID()}.${extension}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  const { error } = await supabaseAdmin()
    .storage.from('option-images')
    .upload(path, buffer, { contentType: file.type, upsert: false });

  if (error) {
    console.error('upload failed', error);
    return jsonError(500, 'Could not upload the image. Please try again.');
  }

  const { data: publicUrl } = supabaseAdmin().storage.from('option-images').getPublicUrl(path);

  return NextResponse.json({ url: publicUrl.publicUrl });
}
