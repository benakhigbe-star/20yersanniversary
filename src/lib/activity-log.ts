import 'server-only';
import { supabaseAdmin } from './supabase/admin';

export async function logActivity(params: {
  eventId: string;
  guestId?: string | null;
  adminId?: string | null;
  actionType: string;
  message: string;
  metadata?: Record<string, unknown>;
}) {
  await supabaseAdmin().from('activity_log').insert({
    event_id: params.eventId,
    guest_id: params.guestId ?? null,
    admin_id: params.adminId ?? null,
    action_type: params.actionType,
    message: params.message,
    metadata: params.metadata ?? {},
  });
}
