import { useEffect, useState } from 'react';
import { supabase, toEmail } from './supabase';
import { clearLocal, defaultState, getState, replaceState, update } from './store';
import { hasUnsynced, startSync, stopSync, syncNow } from './sync';

const LAST_USER = 'et-last-user';

export function lastUsername(): string {
  try {
    return localStorage.getItem(LAST_USER) ?? '';
  } catch {
    return '';
  }
}

const timeout = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

/** Log in, then load this account's progress from the cloud (merged with this device). */
export async function login(username: string, password: string): Promise<void> {
  if (!supabase) throw new Error('Cloud sync is not set up.');
  const { data, error } = await supabase.auth.signInWithPassword({ email: toEmail(username), password });
  if (error) throw error;
  const uid = data.user.id;
  const s = getState();
  if (s.owner && s.owner !== uid) {
    // This device had someone else's progress: start clean for the new person.
    replaceState({ ...defaultState(), owner: uid });
  } else if (!s.owner) {
    // Progress made before logging in on this device joins the account.
    update((d) => {
      d.owner = uid;
    });
  }
  try {
    localStorage.setItem(LAST_USER, username.trim());
  } catch {
    /* ignore */
  }
  await Promise.race([startSync(uid), timeout(12000)]);
}

/** Save to the cloud, then log out and remove this device's copy. Returns false if cancelled. */
export async function logout(): Promise<boolean> {
  await Promise.race([syncNow(), timeout(8000)]);
  if (hasUnsynced() && !confirm('Some progress is not saved to the cloud yet (no internet). If you log out now, it will be lost. Log out anyway?')) {
    return false;
  }
  stopSync();
  try {
    await supabase?.auth.signOut({ scope: 'local' });
  } catch {
    /* offline: the local session is removed anyway */
  }
  clearLocal();
  location.hash = '/';
  return true;
}

export async function changePassword(newPassword: string): Promise<void> {
  if (!supabase) throw new Error('Cloud sync is not set up.');
  const { error } = await supabase.auth.updateUser({ password: newPassword });
  if (error) throw error;
}

/** The logged-in email address (or null). */
export function useAccountEmail(): string | null {
  const [email, setEmail] = useState<string | null>(null);
  useEffect(() => {
    if (!supabase) return;
    void supabase.auth.getSession().then(({ data }) => setEmail(data.session?.user.email ?? null));
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => setEmail(session?.user.email ?? null));
    return () => sub.subscription.unsubscribe();
  }, []);
  return email;
}

export function loginErrorFa(e: unknown): string {
  const msg = (e as { message?: string })?.message ?? String(e);
  if (/invalid login credentials|invalid_credentials/i.test(msg)) return 'نام کاربری یا رمز عبور اشتباه است.';
  if (/fetch|network|Failed to fetch|Load failed/i.test(msg) || !navigator.onLine) return 'اتصال به سرور برقرار نشد. اینترنت را چک کنید و دوباره امتحان کنید.';
  if (/rate|too many/i.test(msg)) return 'تلاش‌های زیادی انجام شد. چند دقیقه صبر کنید.';
  return 'ورود انجام نشد: ' + msg;
}
