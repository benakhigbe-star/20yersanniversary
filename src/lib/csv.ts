import Papa from 'papaparse';
import { csvGuestRowSchema } from './validation';
import { normalizeEmail, isValidEmailShape } from './utils';
import type { Guest } from '@/types/db';

export interface CsvImportRow {
  row: number;
  data: Record<string, string>;
  errors: string[];
}

export interface CsvImportResult {
  valid: Array<{
    first_name: string;
    last_name: string;
    email: string;
    email_normalized: string;
    preferred_name?: string;
    phone?: string;
    gender?: string;
    group_name?: string;
    cabin_number?: string;
    booking_reference?: string;
  }>;
  invalid: CsvImportRow[];
  duplicatesInFile: CsvImportRow[];
  duplicatesInDb: CsvImportRow[];
}

/**
 * Parses + validates a guest CSV before anything touches the database.
 * `existingEmails` is the set of already-imported normalized emails for
 * this event, so re-importing the same file twice is a safe no-op that
 * reports duplicates rather than creating them.
 */
export function parseAndValidateGuestCsv(csvText: string, existingEmails: Set<string>): CsvImportResult {
  const parsed = Papa.parse<Record<string, string>>(csvText, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (h) => h.trim().toLowerCase().replace(/\s+/g, '_'),
  });

  const result: CsvImportResult = { valid: [], invalid: [], duplicatesInFile: [], duplicatesInDb: [] };
  const seenInFile = new Set<string>();

  parsed.data.forEach((raw, idx) => {
    const rowNumber = idx + 2; // header is row 1
    const errors: string[] = [];

    const candidate = {
      first_name: raw.first_name ?? '',
      last_name: raw.last_name ?? '',
      email: raw.email ?? '',
      preferred_name: raw.preferred_name || undefined,
      phone: raw.phone || undefined,
      gender: raw.gender || undefined,
      group_name: raw.group_name || raw.group || raw.family || undefined,
      cabin_number: raw.cabin_number || raw.cabin || undefined,
      booking_reference: raw.booking_reference || raw.booking || undefined,
    };

    if (!candidate.email || !isValidEmailShape(candidate.email)) {
      errors.push('Invalid or missing email address.');
    }
    const parsedRow = csvGuestRowSchema.safeParse(candidate);
    if (!parsedRow.success) {
      for (const issue of parsedRow.error.issues) {
        errors.push(`${issue.path.join('.')}: ${issue.message}`);
      }
    }

    if (errors.length > 0) {
      result.invalid.push({ row: rowNumber, data: raw, errors });
      return;
    }

    const emailNormalized = normalizeEmail(candidate.email);

    if (seenInFile.has(emailNormalized)) {
      result.duplicatesInFile.push({ row: rowNumber, data: raw, errors: ['Duplicate email within this file.'] });
      return;
    }
    if (existingEmails.has(emailNormalized)) {
      result.duplicatesInDb.push({ row: rowNumber, data: raw, errors: ['Guest with this email already exists.'] });
      return;
    }

    seenInFile.add(emailNormalized);
    result.valid.push({ ...candidate, email_normalized: emailNormalized });
  });

  return result;
}

export function guestsToCsv(guests: Guest[]): string {
  return Papa.unparse(
    guests.map((g) => ({
      first_name: g.first_name,
      last_name: g.last_name,
      preferred_name: g.preferred_name ?? '',
      email: g.email,
      phone: g.phone ?? '',
      gender: g.gender ?? '',
      group_name: g.group_name ?? '',
      cabin_number: g.cabin_number ?? '',
      booking_reference: g.booking_reference ?? '',
      status: g.status,
      is_active: g.is_active,
      date_added: g.date_added,
      last_login_at: g.last_login_at ?? '',
    }))
  );
}

export function rowsToCsv(rows: Record<string, unknown>[]): string {
  return Papa.unparse(rows);
}
