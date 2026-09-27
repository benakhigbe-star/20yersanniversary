import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { adminLoginSchema } from '@/lib/validation';
import { normalizeEmail } from '@/lib/utils';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { checkRateLimit, recordLoginAttempt } from '@/lib/rate-limit';
import { createAdminSessionToken, setAdminSessionCookie } from '@/lib/auth/admin';
import type { Admin } from '@/types/db';

const GENERIC_ERROR = 'Invalid email or password.';

export async function POST(req: NextRequest) {
  const parsed = adminLoginSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: GENERIC_ERROR }, { status: 400 });
  }

  const emailNormalized = normalizeEmail(parsed.data.email);

  const rate = await checkRateLimit(emailNormalized, 'admin');
  if (!rate.allowed) {
    return NextResponse.json(
      { error: `Too many attempts. Please try again in ${rate.retryAfterMinutes} minutes.` },
      { status: 429 }
    );
  }

  const { data: admin } = await supabaseAdmin()
    .from('admins')
    .select('*')
    .eq('email', emailNormalized)
    .eq('is_active', true)
    .maybeSingle();

  const typedAdmin = admin as unknown as Admin | null;

  const valid = typedAdmin ? await bcrypt.compare(parsed.data.password, typedAdmin.password_hash) : false;

  if (!typedAdmin || !valid) {
    await recordLoginAttempt(emailNormalized, 'admin', false);
    return NextResponse.json({ error: GENERIC_ERROR }, { status: 401 });
  }

  await recordLoginAttempt(emailNormalized, 'admin', true);

  const token = await createAdminSessionToken({
    adminId: typedAdmin.id,
    eventId: typedAdmin.event_id,
    email: typedAdmin.email,
    name: typedAdmin.name,
    role: typedAdmin.role,
  });
  await setAdminSessionCookie(token);

  await supabaseAdmin().from('admins').update({ last_login_at: new Date().toISOString() }).eq('id', typedAdmin.id);

  return NextResponse.json({ ok: true });
}
