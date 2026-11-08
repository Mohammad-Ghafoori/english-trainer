export const LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1'] as const;
export type Level = (typeof LEVELS)[number];

export const LEVEL_INFO: Record<Level, { name: string; fa: string; ielts: string; hours: string }> = {
  A1: { name: 'Beginner', fa: 'مبتدی', ielts: '2–3', hours: '~100 h' },
  A2: { name: 'Elementary', fa: 'مقدماتی', ielts: '3–4', hours: '~200 h' },
  B1: { name: 'Intermediate', fa: 'متوسط', ielts: '4–5', hours: '~400 h' },
  B2: { name: 'Upper-intermediate', fa: 'فوق متوسط', ielts: '5.5–6.5', hours: '~600 h' },
  C1: { name: 'Advanced', fa: 'پیشرفته', ielts: '7–8', hours: '~800 h' },
};

export interface RawWord {
  w: string;
  pos: string;
  ipa: string;
  fa: string;
  ex: string;
  exFa: string;
  t: string;
  /** Level, when the file name doesn't give one (e.g. ngsl-1.json). */
  lv?: Level;
  /** Frequency rank in the New General Service List (lower = more common). */
  r?: number;
}

export interface Word extends RawWord {
  id: string;
  level: Level;
}

export interface TrapItem {
  q: string;
  opts: string[];
  a: number;
  whyFa: string;
}

export interface Trap {
  id: string;
  level: Level;
  title: string;
  titleFa: string;
  explainFa: string;
  rule: string;
  examples: { wrong: string; right: string }[];
  items: TrapItem[];
}

export type WordStatus = 'new' | 'learning' | 'known';
