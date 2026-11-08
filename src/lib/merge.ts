import type { AppState, DayLog, SkillStat, WritingSample } from './store';
import type { StoredCard } from './srs';

/**
 * Combine progress from two devices of the same user without losing work.
 * - Word cards: keep the copy that has been reviewed more (then the most recent).
 * - Daily logs: the larger number for each counter.
 * - Grammar/sound stats: the copy with more answers.
 * - Writing: all pieces from both devices.
 * - Settings: the most recently changed.
 * - "Reset everything" (higher epoch) wins over older progress.
 */
export function mergeStates(a: AppState, b: AppState): AppState {
  if (a.epoch !== b.epoch) {
    const winner = a.epoch > b.epoch ? a : b;
    return { ...winner, owner: a.owner ?? b.owner };
  }

  const cards: Record<string, StoredCard> = { ...a.cards };
  for (const [id, cb] of Object.entries(b.cards)) {
    const ca = cards[id];
    cards[id] = !ca ? cb : pickCard(ca, cb);
  }

  const known = { ...a.known, ...b.known };

  const queue = [...new Set([...a.queue, ...b.queue])].filter((id) => !cards[`${id}|r`] && !known[id]);

  const days: Record<string, DayLog> = { ...a.days };
  for (const [k, db] of Object.entries(b.days)) {
    const da = days[k];
    days[k] = !da ? db : mergeDay(da, db);
  }

  const writingById = new Map<string, WritingSample>();
  for (const w of [...a.writing, ...b.writing]) writingById.set(w.id, w);
  const writing = [...writingById.values()].sort((x, y) => y.date.localeCompare(x.date)).slice(0, 50);

  const newerProfile = (b.profileUpdatedAt || '') > (a.profileUpdatedAt || '') ? b : a;
  const profile = { ...newerProfile.profile, onboarded: a.profile.onboarded || b.profile.onboarded };

  return {
    ...a,
    owner: a.owner ?? b.owner,
    createdAt: a.createdAt < b.createdAt ? a.createdAt : b.createdAt,
    profile,
    profileUpdatedAt: newerProfile.profileUpdatedAt,
    cards,
    known,
    queue,
    traps: mergeStats(a.traps, b.traps),
    sounds: mergeStats(a.sounds, b.sounds),
    days,
    writing,
  };
}

function pickCard(a: StoredCard, b: StoredCard): StoredCard {
  if (a.reps !== b.reps) return a.reps > b.reps ? a : b;
  return (b.last_review ?? '') > (a.last_review ?? '') ? b : a;
}

function mergeDay(a: DayLog, b: DayLog): DayLog {
  const out = { ...a } as unknown as Record<string, number | boolean | undefined>;
  for (const [k, v] of Object.entries(b)) {
    const cur = out[k];
    if (typeof v === 'number') out[k] = Math.max(typeof cur === 'number' ? cur : 0, v);
    else if (typeof v === 'boolean') out[k] = !!cur || v;
  }
  return out as unknown as DayLog;
}

function mergeStats(a: Record<string, SkillStat>, b: Record<string, SkillStat>): Record<string, SkillStat> {
  const out = { ...a };
  for (const [id, sb] of Object.entries(b)) {
    const sa = out[id];
    out[id] = !sa || sb.seen > sa.seen ? sb : sa;
  }
  return out;
}
