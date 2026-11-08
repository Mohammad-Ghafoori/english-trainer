import { createClient, type SupabaseClient } from '@supabase/supabase-js';

// Set these in .env.local (computer) and in the GitHub repository variables (website):
//   VITE_SUPABASE_URL=https://xxxx.supabase.co
//   VITE_SUPABASE_KEY=sb_publishable_...   (the publishable / "anon public" key — safe to be public)
// Without them the app runs in local-only mode (no login, progress stays on the device).
const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const key = import.meta.env.VITE_SUPABASE_KEY as string | undefined;

export const supabase: SupabaseClient | null = url && key ? createClient(url, key, { auth: { persistSession: true, autoRefreshToken: true } }) : null;

export const cloudEnabled = !!supabase;

/**
 * Supabase logins need an email address. Friends just type a username:
 * "ali" becomes "ali@english-trainer.app" (no email is ever sent there).
 * Typing a full email address also works.
 */
export const LOGIN_DOMAIN = (import.meta.env.VITE_LOGIN_DOMAIN as string | undefined) || 'english-trainer.app';

export function toEmail(username: string): string {
  const u = username.trim().toLowerCase();
  return u.includes('@') ? u : `${u}@${LOGIN_DOMAIN}`;
}

export function displayName(email?: string | null): string {
  if (!email) return '';
  const [name, domain] = email.split('@');
  return domain === LOGIN_DOMAIN ? name : email;
}
