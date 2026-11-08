import { createEmptyCard, fsrs, generatorParameters, Rating, State, type Card, type CardInput, type Grade } from 'ts-fsrs';

export { Rating, State };
export type { Grade };

/** A scheduling card as saved in localStorage (dates as ISO strings). */
export type StoredCard = Omit<CardInput, 'due' | 'last_review'> & { due: string; last_review?: string };

// FSRS: a modern spaced-repetition scheduler (more accurate than the old SM-2 used by Anki).
// Short-term learning steps are off because the app does its own in-session practice
// (massed practice when a word is new, then spaced retrieval over days).
const scheduler = fsrs(
  generatorParameters({
    request_retention: 0.9,
    maximum_interval: 3 * 365,
    enable_fuzz: true,
    enable_short_term: false,
  }),
);

function toStored(c: Card): StoredCard {
  return {
    ...c,
    due: c.due.toISOString(),
    last_review: c.last_review ? c.last_review.toISOString() : undefined,
  };
}

export function newCard(now = new Date()): StoredCard {
  return toStored(createEmptyCard(now));
}

export function gradeCard(card: StoredCard, grade: Grade, now = new Date()): StoredCard {
  return toStored(scheduler.next(card as CardInput, now, grade).card);
}

/** Days until the next review for each possible answer (shown on the buttons). */
export function previewIntervals(card: StoredCard, now = new Date()): Record<Grade, number> {
  const p = scheduler.repeat(card as CardInput, now);
  const days = (g: Grade) => (p[g].card.due.getTime() - now.getTime()) / 86_400_000;
  return {
    [Rating.Again]: days(Rating.Again),
    [Rating.Hard]: days(Rating.Hard),
    [Rating.Good]: days(Rating.Good),
    [Rating.Easy]: days(Rating.Easy),
  } as Record<Grade, number>;
}

/** Card ids: "<wordId>|r" = recognise (English → Persian), "<wordId>|p" = produce (Persian → English). */
export const recId = (wordId: string) => `${wordId}|r`;
export const prodId = (wordId: string) => `${wordId}|p`;
export function parseCardId(id: string): { wordId: string; kind: 'r' | 'p' } {
  const i = id.lastIndexOf('|');
  return { wordId: id.slice(0, i), kind: id.slice(i + 1) as 'r' | 'p' };
}

/** A word counts as "known" once its memory is stable for about 3 weeks. */
export const KNOWN_STABILITY = 21;
