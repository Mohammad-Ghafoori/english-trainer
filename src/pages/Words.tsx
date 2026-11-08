import { useMemo, useState } from 'react';
import { LEVELS, LEVEL_INFO, type Level, type WordStatus } from '../types';
import { BackLink, Btn, Card, Chip, Empty, Fa, Icon, Progress, SpeakBtn, Title } from '../components/ui';
import { ALL_WORDS, dueCardIds, levelStats, nextNewWords, wordStatus } from '../data/words';
import { LearnNew } from '../features/vocab/LearnNew';
import { ReviewSession } from '../features/vocab/ReviewSession';
import { getState, update, useApp } from '../lib/store';
import { go } from '../lib/router';
import { normalize } from '../lib/util';

const STATUS_LABEL: Record<WordStatus, { en: string; tone: 'plain' | 'warn' | 'good' }> = {
  new: { en: 'New', tone: 'plain' },
  learning: { en: 'Learning', tone: 'warn' },
  known: { en: 'Known', tone: 'good' },
};

export function Words({ sub }: { sub?: string }) {
  if (sub === 'review') return <StudyReview />;
  if (sub === 'learn') return <StudyNew />;
  return <WordList />;
}

function StudyReview() {
  const [ids] = useState(() => dueCardIds(getState(), 200));
  const [done, setDone] = useState(false);
  return (
    <div className="stack">
      <BackLink to="words" label="Words" />
      <Title en="Review" fa="مرور" level={2} />
      {done || !ids.length ? (
        <Empty>
          <Icon name="check" size={28} />
          <p>No more reviews for today. Come back tomorrow!</p>
          <Btn onClick={() => go('words')}>Back</Btn>
        </Empty>
      ) : (
        <ReviewSession ids={ids} onDone={() => setDone(true)} />
      )}
    </div>
  );
}

function StudyNew() {
  const [round, setRound] = useState(0);
  return <StudyNewRound key={round} onMore={() => setRound((r) => r + 1)} />;
}

function StudyNewRound({ onMore }: { onMore: () => void }) {
  const [words] = useState(() => nextNewWords(getState(), 5));
  const [done, setDone] = useState(false);
  return (
    <div className="stack">
      <BackLink to="words" label="Words" />
      <Title en="Learn 5 more words" fa="۵ کلمه‌ی بیشتر" level={2} />
      {done || !words.length ? (
        <Empty>
          <Icon name="check" size={28} />
          <p>{words.length ? 'Great — 5 more words learned!' : 'You have learned every word in the list!'}</p>
          <div className="row">
            <Btn onClick={() => go('words')}>Back</Btn>
            {words.length > 0 && (
              <Btn variant="primary" onClick={onMore}>
                5 more
              </Btn>
            )}
          </div>
        </Empty>
      ) : (
        <LearnNew words={words} onDone={() => setDone(true)} />
      )}
    </div>
  );
}

function WordList() {
  const s = useApp();
  const [level, setLevel] = useState<Level | 'all'>('all');
  const [status, setStatus] = useState<WordStatus | 'all'>('all');
  const [q, setQ] = useState('');
  const [limit, setLimit] = useState(60);
  const [open, setOpen] = useState<string | null>(null);
  const stats = useMemo(() => levelStats(s), [s]);
  const due = useMemo(() => dueCardIds(s, 1000).length, [s]);

  const filtered = useMemo(() => {
    const nq = normalize(q);
    return ALL_WORDS.filter(
      (w) =>
        (level === 'all' || w.level === level) &&
        (status === 'all' || wordStatus(s, w.id) === status) &&
        (!nq || normalize(w.w).includes(nq) || w.fa.includes(q.trim())),
    );
  }, [s, level, status, q]);

  return (
    <div className="stack">
      <Title en="Words" fa="کلمه‌ها" />
      <div className="row">
        <Btn variant="primary" onClick={() => go('words/review')} disabled={!due}>
          <Icon name="book" size={18} /> Review ({due})
        </Btn>
        <Btn onClick={() => go('words/learn')}>
          <Icon name="sparkle" size={18} /> Learn 5 more
        </Btn>
      </div>

      <Card>
        <div className="level-bars">
          {LEVELS.map((l) => {
            const st = stats[l];
            return (
              <button key={l} type="button" className={`level-bar ${level === l ? 'on' : ''}`} onClick={() => setLevel(level === l ? 'all' : l)}>
                <div className="row-between small">
                  <strong>{l}</strong>
                  <span className="muted">
                    {st.known + st.learning}/{st.total}
                  </span>
                </div>
                <Progress value={st.known + st.learning} max={st.total} tone={st.known > st.learning ? 'good' : 'accent'} />
                <div className="tiny muted">{LEVEL_INFO[l].name}</div>
              </button>
            );
          })}
        </div>
      </Card>

      <div className="filters">
        <input className="input" placeholder="Search (English / Persian)" value={q} onChange={(e) => setQ(e.target.value)} />
        <select className="input" value={status} onChange={(e) => setStatus(e.target.value as WordStatus | 'all')}>
          <option value="all">All</option>
          <option value="new">New</option>
          <option value="learning">Learning</option>
          <option value="known">Known</option>
        </select>
      </div>
      <div className="muted small">
        {filtered.length} words{level !== 'all' && ` · ${level}`}
      </div>

      <div className="word-list">
        {filtered.slice(0, limit).map((w) => {
          const st = wordStatus(s, w.id);
          const isOpen = open === w.id;
          return (
            <div key={w.id} className={`word-row ${isOpen ? 'open' : ''}`}>
              <button type="button" className="word-row-main" onClick={() => setOpen(isOpen ? null : w.id)}>
                <span className={`dot dot-${st}`} aria-label={STATUS_LABEL[st].en} />
                <span className="word-row-en" lang="en">{w.w}</span>
                <Fa className="word-row-fa">{w.fa}</Fa>
              </button>
              <SpeakBtn text={w.w} size="sm" />
              {isOpen && (
                <div className="word-row-more">
                  <div className="ipa">
                    {w.ipa} <span className="pos">{w.pos}</span> <Chip>{w.level}</Chip> <Chip tone={STATUS_LABEL[st].tone}>{STATUS_LABEL[st].en}</Chip>
                  </div>
                  <div className="row-between">
                    <p lang="en">{w.ex}</p>
                    <SpeakBtn text={w.ex} size="sm" />
                  </div>
                  <Fa block className="example-fa">{w.exFa}</Fa>
                  {st === 'new' && (
                    <div className="row">
                      <Btn
                        size="sm"
                        variant="primary"
                        onClick={() =>
                          update((d) => {
                            d.queue = [w.id, ...d.queue.filter((x) => x !== w.id)];
                          })
                        }
                        disabled={s.queue.includes(w.id)}
                      >
                        {s.queue.includes(w.id) ? 'Will learn next ✓' : 'Learn this next'}
                      </Btn>
                      <Btn
                        size="sm"
                        variant="ghost"
                        onClick={() =>
                          update((d) => {
                            d.known[w.id] = true;
                          })
                        }
                      >
                        I know it
                      </Btn>
                    </div>
                  )}
                  {s.known[w.id] && (
                    <Btn
                      size="sm"
                      variant="ghost"
                      onClick={() =>
                        update((d) => {
                          delete d.known[w.id];
                        })
                      }
                    >
                      Undo “I know it”
                    </Btn>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
      {filtered.length > limit && (
        <Btn block onClick={() => setLimit(limit + 100)}>
          Show more
        </Btn>
      )}
      {!filtered.length && <Empty>No words found.</Empty>}
    </div>
  );
}
