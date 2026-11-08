import { LEVELS, type Level, type RawWord, type Trap, type Word, type WordStatus } from '../types';
import type { AppState } from '../lib/store';
import { KNOWN_STABILITY, parseCardId, prodId, recId } from '../lib/srs';
import { endOfToday, shuffle } from '../lib/util';

// Word lists live in src/data/words/<level>.json. Add more files or entries any time.
const files = import.meta.glob<RawWord[]>('./words/*.json', { eager: true, import: 'default' });
const trapFiles = import.meta.glob<Trap[]>('./traps.json', { eager: true, import: 'default' });

export const WORDS_BY_LEVEL: Record<Level, Word[]> = { A1: [], A2: [], B1: [], B2: [], C1: [] };
{
  const seen = new Set<string>();
  for (const level of LEVELS) {
    for (const r of files[`./words/${level.toLowerCase()}.json`] ?? []) {
      const id = r.w.trim().toLowerCase();
      if (!id || seen.has(id)) continue; // keep the first (lowest-level) copy of a word
      seen.add(id);
      WORDS_BY_LEVEL[level].push({ ...r, id, level });
    }
  }
}

export const ALL_WORDS: Word[] = LEVELS.flatMap((l) => WORDS_BY_LEVEL[l]);
export const WORD_MAP = new Map(ALL_WORDS.map((w) => [w.id, w]));
export const TRAPS: Trap[] = trapFiles['./traps.json'] ?? [];

export function wordStatus(s: AppState, id: string): WordStatus {
  if (s.known[id]) return 'known';
  const c = s.cards[recId(id)];
  if (!c) return 'new';
  return c.stability >= KNOWN_STABILITY ? 'known' : 'learning';
}

const isUnseen = (s: AppState, id: string) => !s.cards[recId(id)] && !s.known[id];

/** The level whose new words you are learning now (moves up automatically). */
export function currentLevel(s: AppState): Level {
  const start = LEVELS.indexOf(s.profile.level);
  for (let i = start; i < LEVELS.length; i++) {
    if (WORDS_BY_LEVEL[LEVELS[i]].some((w) => isUnseen(s, w.id))) return LEVELS[i];
  }
  return LEVELS[LEVELS.length - 1];
}

export function nextNewWords(s: AppState, n: number): Word[] {
  const out: Word[] = [];
  for (const id of s.queue) {
    const w = WORD_MAP.get(id);
    if (w && isUnseen(s, id) && out.length < n) out.push(w);
  }
  const start = LEVELS.indexOf(s.profile.level);
  for (let i = start; i < LEVELS.length && out.length < n; i++) {
    for (const w of WORDS_BY_LEVEL[LEVELS[i]]) {
      if (out.length >= n) break;
      if (isUnseen(s, w.id) && !out.includes(w)) out.push(w);
    }
  }
  return out;
}

export function newWordsLearnedToday(s: AppState, todayKey: string): number {
  return s.days[todayKey]?.newWords ?? 0;
}

/** Cards due by the end of today, oldest first, recognition and production mixed. */
export function dueCardIds(s: AppState, limit = 200): string[] {
  const end = endOfToday().getTime();
  const due = Object.entries(s.cards)
    .filter(([id, c]) => new Date(c.due).getTime() <= end && WORD_MAP.has(parseCardId(id).wordId))
    .sort((a, b) => new Date(a[1].due).getTime() - new Date(b[1].due).getTime())
    .slice(0, limit)
    .map(([id]) => id);
  // Light shuffle so the same word's two cards rarely come back to back.
  return shuffle(due);
}

export function hasProductionCard(s: AppState, wordId: string) {
  return !!s.cards[prodId(wordId)];
}

export function levelStats(s: AppState) {
  const out = {} as Record<Level, { total: number; known: number; learning: number }>;
  for (const l of LEVELS) {
    let known = 0;
    let learning = 0;
    for (const w of WORDS_BY_LEVEL[l]) {
      const st = wordStatus(s, w.id);
      if (st === 'known') known++;
      else if (st === 'learning') learning++;
    }
    out[l] = { total: WORDS_BY_LEVEL[l].length, known, learning };
  }
  return out;
}

/** Rough vocabulary level: the highest level where you have learned at least 80% of the words. */
export function vocabLevel(s: AppState): Level | null {
  const stats = levelStats(s);
  let result: Level | null = null;
  const startIdx = LEVELS.indexOf(s.profile.level);
  LEVELS.forEach((l, i) => {
    const st = stats[l];
    const reached = i < startIdx || (st.total > 0 && (st.known + st.learning) / st.total >= 0.8);
    if (reached && (result === null || LEVELS.indexOf(result) === i - 1)) result = l;
  });
  return result;
}

/** Recently learned words (for shadowing and dictation: practise sentences you already understand). */
export function recentWords(s: AppState, n: number): Word[] {
  return Object.entries(s.cards)
    .filter(([id]) => id.endsWith('|r'))
    .sort((a, b) => new Date(b[1].last_review ?? 0).getTime() - new Date(a[1].last_review ?? 0).getTime())
    .slice(0, n)
    .map(([id]) => WORD_MAP.get(parseCardId(id).wordId))
    .filter((w): w is Word => !!w);
}

export function distractors(word: Word, n: number, field: 'fa' | 'w'): string[] {
  const pool = WORDS_BY_LEVEL[word.level].length > 20 ? WORDS_BY_LEVEL[word.level] : ALL_WORDS;
  const out = new Set<string>();
  for (const w of shuffle(pool)) {
    if (out.size >= n) break;
    if (w.id !== word.id && w[field] !== word[field]) out.add(w[field]);
  }
  return [...out];
}
