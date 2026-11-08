import { LEVELS, type Trap } from '../types';
import { SOUND_SETS, type SoundSet } from '../data/sounds';
import { currentLevel, TRAPS } from '../data/words';
import type { AppState, SkillStat } from './store';
import { dayKey } from './util';

function daysSince(last?: string): number {
  if (!last) return 999;
  const [y, m, d] = last.split('-').map(Number);
  return Math.round((Date.now() - new Date(y, m - 1, d).getTime()) / 86_400_000);
}

/** Lower score = needs practice more. Unseen items first, then weak or long-unpractised ones. */
function need(stat: SkillStat | undefined): number {
  if (!stat || stat.seen === 0) return -1;
  const acc = stat.correct / stat.seen;
  return acc - Math.min(daysSince(stat.last), 30) * 0.02;
}

export function trapsForLevel(s: AppState): Trap[] {
  const lvl = LEVELS.indexOf(currentLevel(s));
  return TRAPS.filter((t) => LEVELS.indexOf(t.level) <= Math.max(lvl, 1));
}

export function pickTrap(s: AppState): Trap | null {
  const list = trapsForLevel(s).filter((t) => s.traps[t.id]?.last !== dayKey());
  const pool = list.length ? list : trapsForLevel(s);
  if (!pool.length) return null;
  return [...pool].sort((a, b) => need(s.traps[a.id]) - need(s.traps[b.id]))[0];
}

export function pickSoundSet(s: AppState): SoundSet {
  const withPairs = SOUND_SETS.filter((x) => x.pairs.length > 0);
  const list = withPairs.filter((x) => s.sounds[x.id]?.last !== dayKey());
  const pool = list.length ? list : withPairs;
  return [...pool].sort((a, b) => need(s.sounds[a.id]) - need(s.sounds[b.id]))[0];
}

export function accuracy(stat?: SkillStat): number | null {
  return stat && stat.seen ? stat.correct / stat.seen : null;
}
