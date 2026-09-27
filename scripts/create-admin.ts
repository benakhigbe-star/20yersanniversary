/**
 * Creates (or updates the password for) an admin account.
 *
 * Usage:
 *   npm run create-admin -- --email you@example.com --password "a-strong-password" --name "Your Name"
 */
import { config } from 'dotenv';
config({ path: '.env.local' });

import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceKey) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local');
  process.exit(1);
}

function arg(name: string): string | undefined {
  const idx = process.argv.indexOf(`--${name}`);
  return idx !== -1 ? process.argv[idx + 1] : undefined;
}

const email = arg('email');
const password = arg('password');
const name = arg('name') || 'Admin';

if (!email || !password) {
  console.error('Usage: npm run create-admin -- --email you@example.com --password "..." --name "Your Name"');
  process.exit(1);
}
if (password.length < 8) {
  console.error('Password must be at least 8 characters.');
  process.exit(1);
}

const supabase = createClient(url, serviceKey);

async function main() {
  const emailNormalized = email!.trim().toLowerCase();
  const passwordHash = await bcrypt.hash(password!, 12);

  const { data: existing } = await supabase.from('admins').select('id').eq('email', emailNormalized).maybeSingle();

  if (existing) {
    await supabase.from('admins').update({ password_hash: passwordHash, name, is_active: true }).eq('id', existing.id);
    console.log(`Updated existing admin: ${emailNormalized}`);
  } else {
    await supabase.from('admins').insert({ email: emailNormalized, password_hash: passwordHash, name, role: 'owner', is_active: true });
    console.log(`Created admin: ${emailNormalized}`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
