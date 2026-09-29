import { NextRequest, NextResponse } from 'next/server';
import { requireAdminSession, jsonError } from '@/lib/api-helpers';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { logActivity } from '@/lib/activity-log';
import type { SignupRequest } from '@/types/db';

export async function POST(_req: NextRequest, { params }: { params: { id: string } }) {
  const guard = await requireAdminSession();
  if ('error' in guard) return guard.error;
  const { session } = guard;

  const { data: request } = await supabaseAdmin()
    .from('signup_requests')
    .select('*')
    .eq('id', params.id)
    .eq('status', 'pending')
    .maybeSingle();

  const typedRequest = request as unknown as SignupRequest | null;
  if (!typedRequest) return jsonError(404, 'Request not found or already reviewed.');

  const { error } = await supabaseAdmin()
    .from('signup_requests')
    .update({ status: 'rejected', reviewed_by: session.adminId, reviewed_at: new Date().toISOString() })
    .eq('id', typedRequest.id);

  if (error) return jsonError(500, error.message);

  await logActivity({
    eventId: typedRequest.event_id,
    adminId: session.adminId,
    actionType: 'invitation_rejected',
    message: `${typedRequest.first_name} ${typedRequest.last_name}'s invitation request was declined.`,
  });

  return NextResponse.json({ ok: true });
}
