import { useSyncExternalStore } from 'react';
import type { Level } from '../types';
import type { StoredCard } from './srs';
import { dayKey } from './util';

export type Accent = 'en-GB' | 'en-US' | 'any';
export type Theme = 'auto' | 'light' | 'dark';

export interface Profile {
  onboarded: boolean;
  level: Level;
  dailyNew: number;
  persianHelp: boolean;
  accent: Accent;
  voiceURI: string | null;
  rate: number;
  theme: Theme;
  targetBand: number;
  examDate: string | null;
}

export interface SkillStat {
  seen: number;
  correct: number;
  last?: string;
}

export interface DayLog {
  reviews: number;
  newWords: number;
  trapItems: number;
  soundTrials: number;
  shadow: number;
  dictation: number;
  ielts: number;
  seconds: number;
  sessionDone?: boolean;
}

export interface WritingSample {
  id: string;
  date: string;
  task: 'task1' | 'task2';
  promptId: string;
  text: string;
  words: number;
  minutes: number;
}

export interface AppState {
  v: 1;
  createdAt: string;
  profile: Profile;
  cards: Record<string, StoredCard>;
  /** Words marked "I already know this" (skipped, not scheduled). */
  known: Record<string, true>;
  /** Words the learner asked to learn next (from the word list). */
  queue: string[];
  traps: Record<string, SkillStat>;
  sounds: Record<string, SkillStat>;
  days: Record<string, DayLog>;
  writing: WritingSample[];
}

const KEY = 'english-trainer:v1';

export const emptyDay = (): DayLog => ({
  reviews: 0,
  newWords: 0,
  trapItems: 0,
  soundTrials: 0,
  shadow: 0,
  dictation: 0,
  ielts: 0,
  seconds: 0,
});

export function defaultState(): AppState {
  return {
    v: 1,
    createdAt: new Date().toISOString(),
    profile: {
      onboarded: false,
      level: 'A1',
      dailyNew: 10,
      persianHelp: true,
      accent: 'en-GB',
      voiceURI: null,
      rate: 0.95,
      theme: 'auto',
      targetBand: 7,
      examDate: null,
    },
    cards: {},
    known: {},
    queue: [],
    traps: {},
    sounds: {},
    days: {},
    writing: [],
  };
}

function merge(raw: Partial<AppState>): AppState {
  const d = defaultState();
  return { ...d, ...raw, profile: { ...d.profile, ...(raw.profile ?? {}) } } as AppState;
}

function load(): AppState {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return merge(JSON.parse(raw));
  } catch {
    /* storage blocked or corrupt — start fresh */
  }
  return defaultState();
}

let state: AppState = load();
const listeners = new Set<() => void>();
let saveTimer: number | undefined;

function persist() {
  window.clearTimeout(saveTimer);
  saveTimer = window.setTimeout(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(state));
    } catch (e) {
      console.warn('Could not save progress', e);
    }
  }, 250);
}

function emit() {
  listeners.forEach((l) => l());
}

export function getState(): AppState {
  return state;
}

/** Update state with a mutating function applied to a copy. */
export function update(fn: (draft: AppState) => void) {
  const next = structuredClone(state);
  fn(next);
  state = next;
  persist();
  emit();
}

export function useApp(): AppState {
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    () => state,
  );
}

export function today(draft: AppState): DayLog {
  const k = dayKey();
  if (!draft.days[k]) draft.days[k] = emptyDay();
  return draft.days[k];
}

export function logDay(inc: Partial<Record<keyof DayLog, number>>) {
  update((s) => {
    const d = today(s);
    for (const [k, v] of Object.entries(inc)) {
      (d as unknown as Record<string, number>)[k] = ((d as unknown as Record<string, number>)[k] ?? 0) + (v ?? 0);
    }
  });
}

export function recordSkill(kind: 'traps' | 'sounds', id: string, correct: boolean) {
  update((s) => {
    const st = s[kind][id] ?? { seen: 0, correct: 0 };
    st.seen += 1;
    if (correct) st.correct += 1;
    st.last = dayKey();
    s[kind][id] = st;
    const d = today(s);
    if (kind === 'traps') d.trapItems += 1;
    else d.soundTrials += 1;
  });
}

// ---- Study-time tracking: counts time while the learner is actively interacting ----
let lastActivity = 0;
let pendingSeconds = 0;

export function noteActivity() {
  const now = Date.now();
  const gap = (now - lastActivity) / 1000;
  if (lastActivity && gap < 90) pendingSeconds += gap;
  lastActivity = now;
  if (pendingSeconds >= 30) flushActivity();
}

export function flushActivity() {
  if (pendingSeconds < 1) return;
  const secs = Math.round(pendingSeconds);
  pendingSeconds = 0;
  update((s) => {
    today(s).seconds += secs;
  });
}

export function streak(s: AppState): number {
  const active = (k: string) => {
    const d = s.days[k];
    return !!d && (d.reviews + d.newWords + d.trapItems + d.soundTrials + d.shadow + d.dictation + d.ielts > 0);
  };
  let n = 0;
  const cur = new Date();
  if (!active(dayKey(cur))) cur.setDate(cur.getDate() - 1);
  while (active(dayKey(cur))) {
    n++;
    cur.setDate(cur.getDate() - 1);
  }
  return n;
}

export function exportJSON(): string {
  flushActivity();
  return JSON.stringify(state);
}

export function importJSON(text: string): boolean {
  const raw = JSON.parse(text);
  if (!raw || raw.v !== 1 || typeof raw.cards !== 'object') return false;
  state = merge(raw);
  persist();
  emit();
  return true;
}

export function resetAll() {
  state = defaultState();
  persist();
  emit();
}
