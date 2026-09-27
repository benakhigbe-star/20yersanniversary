import { NextRequest, NextResponse } from 'next/server';
import { requireAdminSession, jsonError } from '@/lib/api-helpers';
import { parseAndValidateGuestCsv } from '@/lib/csv';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { getCurrentEvent } from '@/lib/event';
import { logActivity } from '@/lib/activity-log';

/**
 * Two-step import: `commit: false` (default) validates and returns a
 * preview (valid/invalid/duplicate rows) without touching the database.
 * `commit: true` re-validates against current DB state and inserts.
 */
export async function POST(req: NextRequest) {
  const guard = await requireAdminSession();
  if ('error' in guard) return guard.error;

  const body = await req.json().catch(() => null);
  if (!body?.csv || typeof body.csv !== 'string') return jsonError(400, 'Missing CSV content.');
  const commit = body.commit === true;

  const event = await getCurrentEvent();

  const { data: existingGuests } = await supabaseAdmin().from('guests').select('email_normalized').eq('event_id', event.id);
  const existingEmails = new Set(((existingGuests ?? []) as { email_normalized: string }[]).map((g) => g.email_normalized));

  const result = parseAndValidateGuestCsv(body.csv, existingEmails);

  if (!commit) {
    return NextResponse.json({
      preview: true,
      validCount: result.valid.length,
      invalidCount: result.invalid.length,
      duplicateInFileCount: result.duplicatesInFile.length,
      duplicateInDbCount: result.duplicatesInDb.length,
      invalid: result.invalid,
      duplicatesInFile: result.duplicatesInFile,
      duplicatesInDb: result.duplicatesInDb,
      sampleValid: result.valid.slice(0, 5),
    });
  }

  if (result.valid.length === 0) {
    return NextResponse.json({ imported: 0, skipped: result.invalid.length + result.duplicatesInDb.length + result.duplicatesInFile.length });
  }

  const { error } = await supabaseAdmin()
    .from('guests')
    .insert(result.valid.map((g) => ({ ...g, event_id: event.id })));

  if (error) return jsonError(500, error.message);

  await logActivity({
    eventId: event.id,
    actionType: 'guests_imported',
    message: `${result.valid.length} guest(s) imported via CSV.`,
  });

  return NextResponse.json({
    imported: result.valid.length,
    skipped: result.invalid.length + result.duplicatesInDb.length + result.duplicatesInFile.length,
    invalid: result.invalid,
  });
}
