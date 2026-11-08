import { useSyncExternalStore } from 'react';
import { supabase } from './supabase';
import { flushActivity, getState, replaceState, subscribe, withDefaults, type AppState } from './store';
import { mergeStates } from './merge';

// ---------------- Status (shown in the app) ----------------

export type SyncState = 'off' | 'idle' | 'syncing' | 'offline' | 'auth' | 'error';
export interface SyncStatus {
  state: SyncState;
  lastSync: number | null;
  message?: string;
}

let status: SyncStatus = { state: 'off', lastSync: null };
const statusListeners = new Set<() => void>();
function setStatus(patch: Partial<SyncStatus>) {
  status = { ...status, ...patch };
  statusListeners.forEach((l) => l());
}
export function useSyncStatus(): SyncStatus {
  return useSyncExternalStore(
    (cb) => {
      statusListeners.add(cb);
      return () => statusListeners.delete(cb);
    },
    () => status,
  );
}

// ---------------- Packing: gzip + base64 keeps uploads small on mobile data ----------------

async function pack(s: AppState): Promise<string> {
  const json = JSON.stringify(s);
  if (typeof CompressionStream === 'undefined') return 'json:' + json;
  const stream = new Blob([json]).stream().pipeThrough(new CompressionStream('gzip'));
  const bytes = new Uint8Array(await new Response(stream).arrayBuffer());
  let bin = '';
  for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return 'gz:' + btoa(bin);
}

async function unpack(data: string): Promise<AppState> {
  if (data.startsWith('json:')) return withDefaults(JSON.parse(data.slice(5)));
  if (!data.startsWith('gz:')) return withDefaults(JSON.parse(data));
  const bin = atob(data.slice(3));
  const bytes = Uint8Array.from(bin, (c) => c.charCodeAt(0));
  const stream = new Blob([bytes]).stream().pipeThrough(new DecompressionStream('gzip'));
  return withDefaults(JSON.parse(await new Response(stream).text()));
}

// ---------------- Sync engine ----------------

/** JSON with sorted keys, so two copies with the same content compare equal. */
function canonical(v: unknown): string {
  return JSON.stringify(v, (_k, val) =>
    val && typeof val === 'object' && !Array.isArray(val)
      ? Object.keys(val)
          .sort()
          .reduce<Record<string, unknown>>((o, k) => {
            o[k] = (val as Record<string, unknown>)[k];
            return o;
          }, {})
      : val,
  );
}

let userId: string | null = null;
let dirty = false;
let changeCount = 0;
let applyingRemote = false;
let running = false;
let again = false;
let pushTimer: number | undefined;
let unsubscribe: (() => void) | null = null;

const remoteKey = () => `et-sync-remote:${userId}`;
const getRemoteAt = () => {
  try {
    return localStorage.getItem(remoteKey());
  } catch {
    return null;
  }
};
const setRemoteAt = (v: string | null) => {
  try {
    if (v) localStorage.setItem(remoteKey(), v);
    else localStorage.removeItem(remoteKey());
  } catch {
    /* ignore */
  }
};
const dirtyKey = () => `et-sync-dirty:${userId}`;

function markDirty() {
  if (applyingRemote || !userId) return;
  dirty = true;
  changeCount++;
  try {
    localStorage.setItem(dirtyKey(), '1');
  } catch {
    /* ignore */
  }
  window.clearTimeout(pushTimer);
  pushTimer = window.setTimeout(() => void syncNow(), 8000);
}

function clearDirty() {
  dirty = false;
  try {
    localStorage.removeItem(dirtyKey());
  } catch {
    /* ignore */
  }
}

function classify(e: unknown): { state: SyncState; message: string } {
  const err = e as { status?: number; code?: string; message?: string; name?: string };
  const msg = err?.message ?? String(e);
  if (!navigator.onLine || /fetch|network|Failed to fetch|NetworkError|Load failed/i.test(msg)) return { state: 'offline', message: msg };
  if (err?.status === 401 || err?.code === 'PGRST301' || /JWT|refresh token|not authenticated|Auth session missing/i.test(msg)) return { state: 'auth', message: msg };
  return { state: 'error', message: msg };
}

/** Pull the cloud copy, merge it with this device, and push the result. */
export async function syncNow(): Promise<void> {
  if (!supabase || !userId) return;
  if (running) {
    again = true;
    return;
  }
  running = true;
  window.clearTimeout(pushTimer);
  setStatus({ state: 'syncing' });
  try {
    const { data: auth } = await supabase.auth.getSession();
    if (!auth.session) throw Object.assign(new Error('Auth session missing'), { status: 401 });

    flushActivity();
    const meta = await supabase.from('progress').select('updated_at').eq('user_id', userId).maybeSingle();
    if (meta.error) throw meta.error;
    let remoteAt = getRemoteAt();
    let local = getState();
    let remote: AppState | null = null;

    if (meta.data && meta.data.updated_at !== remoteAt) {
      const row = await supabase.from('progress').select('data, updated_at').eq('user_id', userId).single();
      if (row.error) throw row.error;
      remote = await unpack(row.data.data);
      const merged = mergeStates({ ...local, owner: userId }, { ...remote, owner: userId });
      applyingRemote = true;
      replaceState(merged);
      applyingRemote = false;
      remoteAt = row.data.updated_at;
      setRemoteAt(remoteAt);
      local = getState();
      // If the merge added nothing new from this device, there's nothing to upload.
      if (!dirty && canonical(local) === canonical(withDefaults({ ...remote, owner: userId }))) {
        setStatus({ state: 'idle', lastSync: Date.now(), message: undefined });
        return;
      }
      dirty = true;
    }

    if (meta.data && !dirty) {
      setStatus({ state: 'idle', lastSync: Date.now(), message: undefined });
      return;
    }

    const countAtPack = changeCount;
    const payload = await pack({ ...local, owner: userId });
    const now = new Date().toISOString();
    if (!meta.data) {
      const ins = await supabase.from('progress').insert({ user_id: userId, data: payload, updated_at: now }).select('updated_at').single();
      if (ins.error) {
        if (ins.error.code === '23505') again = true; // another device created it first → merge again
        else throw ins.error;
      } else setRemoteAt(ins.data.updated_at);
    } else {
      // Only overwrite if nobody else saved in the meantime; otherwise merge again.
      const upd = await supabase.from('progress').update({ data: payload, updated_at: now }).eq('user_id', userId).eq('updated_at', remoteAt!).select('updated_at');
      if (upd.error) throw upd.error;
      if (!upd.data.length) {
        setRemoteAt(null);
        again = true;
      } else setRemoteAt(upd.data[0].updated_at);
    }
    // Changes made while uploading stay "dirty" and go up next time.
    if (!again && changeCount === countAtPack) clearDirty();
    setStatus({ state: 'idle', lastSync: Date.now(), message: undefined });
  } catch (e) {
    applyingRemote = false;
    setStatus(classify(e));
  } finally {
    running = false;
    if (again) {
      again = false;
      window.setTimeout(() => void syncNow(), 300);
    }
  }
}

function onVisibility() {
  if (document.visibilityState === 'visible') void syncNow();
  else if (dirty) void syncNow();
}
const onOnline = () => void syncNow();

/** Start syncing for this user (after login, or on app start when already logged in). */
export async function startSync(uid: string): Promise<void> {
  if (!supabase) return;
  if (userId === uid && unsubscribe) return syncNow();
  stopSync();
  userId = uid;
  try {
    dirty = localStorage.getItem(dirtyKey()) === '1';
  } catch {
    dirty = false;
  }
  unsubscribe = subscribe(markDirty);
  document.addEventListener('visibilitychange', onVisibility);
  window.addEventListener('online', onOnline);
  await syncNow();
}

export function stopSync() {
  unsubscribe?.();
  unsubscribe = null;
  document.removeEventListener('visibilitychange', onVisibility);
  window.removeEventListener('online', onOnline);
  window.clearTimeout(pushTimer);
  userId = null;
  setStatus({ state: 'off', lastSync: null, message: undefined });
}

/** True when there are changes on this device that are not in the cloud yet. */
export function hasUnsynced(): boolean {
  return dirty;
}
