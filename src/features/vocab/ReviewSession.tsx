import { useEffect, useMemo, useRef, useState } from 'react';
import type { Word } from '../../types';
import { Btn, Card, Chip, Fa, Help, Highlight, Icon, Progress, SpeakBtn } from '../../components/ui';
import { WORD_MAP } from '../../data/words';
import { gradeCard, newCard, parseCardId, previewIntervals, prodId, Rating, State, type Grade } from '../../lib/srs';
import { getState, today, update, useApp } from '../../lib/store';
import { speak } from '../../lib/speech';
import { escapeRegExp, formatInterval, normalize } from '../../lib/util';

interface Item {
  id: string;
  practice: boolean; // repeated in this session after "Forgot" — not graded again
}

const GRADES: { g: Grade; en: string; fa: string; variant: 'bad' | 'soft' | 'good' | 'primary' }[] = [
  { g: Rating.Again, en: 'Forgot', fa: 'یادم رفت', variant: 'bad' },
  { g: Rating.Hard, en: 'Hard', fa: 'سخت', variant: 'soft' },
  { g: Rating.Good, en: 'Good', fa: 'خوب', variant: 'good' },
  { g: Rating.Easy, en: 'Easy', fa: 'آسان', variant: 'primary' },
];

function blankExample(word: Word): string | null {
  const re = new RegExp(`\\b${escapeRegExp(word.w)}\\w*`, 'i');
  if (!re.test(word.ex)) return null;
  return word.ex.replace(re, '_____');
}

function isCorrect(typed: string, word: Word): boolean {
  const t = normalize(typed);
  if (!t) return false;
  const forms = word.w.split('/').map((f) => normalize(f));
  return forms.some((f) => f === t || f.replace(/^to /, '') === t.replace(/^to /, '') || f.replace(/\s*\(.*?\)\s*/g, '') === t);
}

/** Spaced review: try to remember first, then check yourself. Your answer decides when you see the card again. */
export function ReviewSession({ ids, onDone }: { ids: string[]; onDone: (count: number) => void }) {
  const { profile } = useApp();
  const [queue, setQueue] = useState<Item[]>(() => ids.map((id) => ({ id, practice: false })));
  const [revealed, setRevealed] = useState(false);
  const [typed, setTyped] = useState('');
  const [checked, setChecked] = useState<null | boolean>(null);
  const [hint, setHint] = useState(false);
  const [graded, setGraded] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const item = queue[0];
  const { wordId, kind } = item ? parseCardId(item.id) : { wordId: '', kind: 'r' as const };
  const word = WORD_MAP.get(wordId);
  const card = item ? getState().cards[item.id] : undefined;
  const intervals = useMemo(() => (card ? previewIntervals(card) : null), [card]);

  useEffect(() => {
    if (kind === 'p' && !revealed) inputRef.current?.focus();
  }, [item?.id, kind, revealed]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!item || kind !== 'r') return;
      if ((e.target as HTMLElement)?.tagName === 'INPUT') return;
      if (!revealed && (e.key === ' ' || e.key === 'Enter')) {
        e.preventDefault();
        setRevealed(true);
      } else if (revealed && !item.practice && ['1', '2', '3', '4'].includes(e.key)) {
        grade(Number(e.key) as Grade);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  if (!item || !word || !card) {
    if (item && (!word || !card)) setTimeout(() => advance(false), 0);
    return null;
  }

  function advance(again: boolean) {
    const [first, ...rest] = queue;
    const next = again && first ? [...rest, { id: first.id, practice: true }] : rest;
    setQueue(next);
    setRevealed(false);
    setTyped('');
    setChecked(null);
    setHint(false);
    if (!next.length) onDone(ids.length);
  }

  function grade(g: Grade) {
    if (!item.practice) {
      update((s) => {
        const now = new Date();
        const c = s.cards[item.id];
        if (!c) return;
        const nextCard = gradeCard(c, g, now);
        s.cards[item.id] = nextCard;
        today(s).reviews += 1;
        // After you recognise a word again, start practising producing it (Persian → English).
        if (kind === 'r' && g >= Rating.Good && nextCard.state === State.Review && !s.cards[prodId(wordId)]) {
          const tomorrow = new Date(now.getTime() + 86_400_000);
          s.cards[prodId(wordId)] = { ...newCard(tomorrow), due: tomorrow.toISOString() };
        }
      });
      setGraded((n) => n + 1);
    }
    advance(g === Rating.Again);
  }

  function check() {
    const ok = isCorrect(typed, word!);
    setChecked(ok);
    setRevealed(true);
    speak(word!.w);
  }

  const total = ids.length;
  const progressDone = Math.min(graded, total);
  const blank = kind === 'p' ? blankExample(word) : null;

  return (
    <div className="stack">
      <div className="row-between">
        <Chip tone="accent">{kind === 'r' ? 'Remember the meaning' : 'Say it in English'}</Chip>
        <span className="muted small">
          {progressDone} / {total} {item.practice && '· practice'}
        </span>
      </div>
      <Progress value={progressDone} max={total} />

      <Card className="word-card">
        {kind === 'r' ? (
          <>
            <div className="word-head">
              <div>
                <div className="word-big" lang="en">{word.w}</div>
                {revealed && <div className="ipa">{word.ipa} <span className="pos">{word.pos}</span></div>}
              </div>
              <SpeakBtn text={word.w} size="lg" auto key={item.id + queue.length} />
            </div>
            {!revealed ? (
              <Help>اول سعی کنید معنی را در ذهن‌تان به یاد بیاورید، بعد «Show answer» را بزنید. همین تلاش برای به‌خاطر آوردن، حافظه را قوی می‌کند.</Help>
            ) : (
              <>
                <Fa block className="meaning">{word.fa}</Fa>
                <div className="example">
                  <div className="row-between">
                    <p lang="en"><Highlight text={word.ex} word={word.w.split(' ')[0]} /></p>
                    <SpeakBtn text={word.ex} size="sm" />
                  </div>
                  {profile.persianHelp && <Fa block className="example-fa">{word.exFa}</Fa>}
                </div>
              </>
            )}
          </>
        ) : (
          <>
            <Fa block className="meaning">{word.fa}</Fa>
            {blank && (
              <div className="example">
                <p lang="en">{blank}</p>
                {profile.persianHelp && <Fa block className="example-fa">{word.exFa}</Fa>}
              </div>
            )}
            {!revealed ? (
              <form
                className="type-row"
                onSubmit={(e) => {
                  e.preventDefault();
                  check();
                }}
              >
                <input
                  ref={inputRef}
                  className="input"
                  value={typed}
                  onChange={(e) => setTyped(e.target.value)}
                  placeholder={hint ? `${word.w[0]}${'·'.repeat(Math.max(0, word.w.length - 1))}` : 'Type the English word'}
                  autoCapitalize="off"
                  autoCorrect="off"
                  autoComplete="off"
                  spellCheck={false}
                  lang="en"
                />
                <Btn variant="primary" type="submit">Check</Btn>
                {!hint && <Btn variant="ghost" onClick={() => setHint(true)}>Hint</Btn>}
              </form>
            ) : (
              <div className={`feedback ${checked ? 'good' : 'bad'}`}>
                <div className="row">
                  <strong>{checked ? 'Correct!' : 'The answer is:'}</strong>
                  <span className="word-mid" lang="en">{word.w}</span>
                  <SpeakBtn text={word.w} size="sm" />
                </div>
                <div className="ipa">{word.ipa}</div>
                {!checked && typed && <div className="small muted">You wrote: <s>{typed}</s></div>}
                <p lang="en" className="small">{word.ex}</p>
              </div>
            )}
          </>
        )}
      </Card>

      {!revealed && kind === 'r' && (
        <Btn variant="primary" size="lg" block onClick={() => setRevealed(true)}>
          Show answer
        </Btn>
      )}

      {revealed && item.practice && (
        <Btn variant="primary" size="lg" block onClick={() => advance(false)}>
          Got it <Icon name="arrow" size={18} />
        </Btn>
      )}

      {revealed && !item.practice && kind === 'r' && intervals && (
        <div className="grade-row">
          {GRADES.map(({ g, en, fa, variant }) => (
            <Btn key={g} variant={variant} onClick={() => grade(g)}>
              <span className="grade-label">{en}</span>
              {profile.persianHelp && <Fa className="grade-fa">{fa}</Fa>}
              <span className="grade-int">{formatInterval(intervals[g])}</span>
            </Btn>
          ))}
        </div>
      )}

      {revealed && !item.practice && kind === 'p' && intervals && (
        <div className="grade-row">
          {checked ? (
            <>
              <Btn variant="soft" onClick={() => grade(Rating.Hard)}>
                <span className="grade-label">Hard</span>
                <span className="grade-int">{formatInterval(intervals[Rating.Hard])}</span>
              </Btn>
              <Btn variant="good" onClick={() => grade(Rating.Good)}>
                <span className="grade-label">Good</span>
                <span className="grade-int">{formatInterval(intervals[Rating.Good])}</span>
              </Btn>
              <Btn variant="primary" onClick={() => grade(Rating.Easy)}>
                <span className="grade-label">Easy</span>
                <span className="grade-int">{formatInterval(intervals[Rating.Easy])}</span>
              </Btn>
            </>
          ) : (
            <>
              <Btn variant="bad" onClick={() => grade(Rating.Again)}>
                <span className="grade-label">I didn’t know</span>
                <span className="grade-int">{formatInterval(intervals[Rating.Again])}</span>
              </Btn>
              <Btn variant="soft" onClick={() => grade(Rating.Hard)}>
                <span className="grade-label">Small typo</span>
                <span className="grade-int">{formatInterval(intervals[Rating.Hard])}</span>
              </Btn>
            </>
          )}
        </div>
      )}
      {revealed && kind === 'r' && !item.practice && <div className="muted small center hide-mobile">Keys: 1 Forgot · 2 Hard · 3 Good · 4 Easy</div>}
    </div>
  );
}
