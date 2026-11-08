import { useMemo, useState } from 'react';
import type { Trap, TrapItem } from '../../types';
import { Btn, Card, Chip, Fa, Icon, Progress, SpeakBtn } from '../../components/ui';
import { recordSkill, useApp } from '../../lib/store';
import { speak } from '../../lib/speech';
import { sample } from '../../lib/util';

function correctSentence(item: TrapItem): string {
  const right = item.opts[item.a];
  return item.q.includes('___') ? item.q.replace('___', right) : right;
}

function Question({ q }: { q: string }) {
  if (!q.includes('___')) return <p className="quiz-text">{q}</p>;
  const [a, b] = q.split('___');
  return (
    <p className="quiz-text" lang="en">
      {a}
      <span className="blank">____</span>
      {b}
    </p>
  );
}

/** Persian-trap exercises: choose the correct English, then read why. */
export function TrapDrill({ trap, count, onDone }: { trap: Trap; count?: number; onDone: (correct: number, total: number) => void }) {
  const { profile } = useApp();
  const items = useMemo(() => sample(trap.items, count ?? trap.items.length), [trap, count]);
  const [i, setI] = useState(0);
  const [chosen, setChosen] = useState<number | null>(null);
  const [score, setScore] = useState(0);

  const item = items[i];
  if (!item) return null;
  const answered = chosen !== null;
  const ok = chosen === item.a;

  function choose(idx: number) {
    if (answered) return;
    setChosen(idx);
    const right = idx === item.a;
    if (right) setScore((n) => n + 1);
    recordSkill('traps', trap.id, right);
    speak(correctSentence(item));
  }

  function next() {
    if (i + 1 < items.length) {
      setI(i + 1);
      setChosen(null);
    } else onDone(score, items.length);
  }

  return (
    <div className="stack">
      <div className="row-between">
        <Chip tone="accent">{trap.title}</Chip>
        <span className="muted small">
          {i + 1} / {items.length}
        </span>
      </div>
      <Progress value={i} max={items.length} />
      <Card>
        <Question q={item.q} />
        <div className="options">
          {item.opts.map((o, idx) => {
            const state = !answered ? '' : idx === item.a ? 'is-right' : idx === chosen ? 'is-wrong' : 'is-dim';
            return (
              <button key={idx} type="button" className={`option option-left ${state}`} onClick={() => choose(idx)} lang="en">
                {o}
              </button>
            );
          })}
        </div>
        {answered && (
          <div className={`feedback ${ok ? 'good' : 'bad'}`}>
            <div className="row">
              <strong>{ok ? 'Correct!' : 'Not quite.'}</strong>
              <span lang="en">{correctSentence(item)}</span>
              <SpeakBtn text={correctSentence(item)} size="sm" />
            </div>
            <Fa block>{item.whyFa}</Fa>
            {!profile.persianHelp && <div className="small muted">{trap.rule}</div>}
          </div>
        )}
      </Card>
      {answered && (
        <Btn variant="primary" size="lg" block onClick={next} autoFocus>
          {i + 1 < items.length ? 'Next' : 'Finish'} <Icon name="arrow" size={18} />
        </Btn>
      )}
    </div>
  );
}
