import { useState } from 'react';
import { Btn, Card, Chip, Fa, Help, Icon, Progress } from '../../components/ui';
import { logDay, useApp } from '../../lib/store';
import { speak } from '../../lib/speech';
import { compareWords } from './SayCheck';
import type { Sentence } from './Shadowing';

/** Dictation: listen and type exactly what you hear. Trains listening and spelling (spelling counts in IELTS Listening). */
export function Dictation({ sentences, onDone }: { sentences: Sentence[]; onDone: (avg: number) => void }) {
  const { profile } = useApp();
  const [i, setI] = useState(0);
  const [typed, setTyped] = useState('');
  const [result, setResult] = useState<ReturnType<typeof compareWords> | null>(null);
  const [scores, setScores] = useState<number[]>([]);
  const s = sentences[i];
  if (!s) return null;

  function check() {
    const r = compareWords(s.en, typed);
    setResult(r);
    setScores((x) => [...x, r.score]);
    logDay({ dictation: 1 });
  }

  function next() {
    if (i + 1 < sentences.length) {
      setI(i + 1);
      setTyped('');
      setResult(null);
      setTimeout(() => speak(sentences[i + 1].en), 100);
    } else onDone(scores.reduce((a, b) => a + b, 0) / Math.max(1, scores.length));
  }

  return (
    <div className="stack">
      <div className="row-between">
        <Chip tone="accent">Dictation</Chip>
        <span className="muted small">
          {i + 1} / {sentences.length}
        </span>
      </div>
      <Progress value={i} max={sentences.length} />
      <Help>جمله را گوش کنید و دقیقاً همان را تایپ کنید. هر چند بار خواستید دوباره گوش کنید. در آزمون Listening آیلتس، املای غلط یعنی جواب غلط!</Help>
      <Card>
        <div className="row">
          <Btn variant="primary" onClick={() => speak(s.en)}>
            <Icon name="speaker" size={18} /> Play
          </Btn>
          <Btn variant="soft" onClick={() => speak(s.en, { rate: 0.7 })}>
            <Icon name="slow" size={18} /> Slow
          </Btn>
        </div>
        {!result ? (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              check();
            }}
            className="stack"
          >
            <textarea
              className="input"
              rows={3}
              value={typed}
              onChange={(e) => setTyped(e.target.value)}
              placeholder="Type what you hear…"
              spellCheck={false}
              autoCapitalize="sentences"
              autoCorrect="off"
              lang="en"
            />
            <Btn variant="primary" type="submit" disabled={!typed.trim()}>
              Check
            </Btn>
          </form>
        ) : (
          <div className={`feedback ${result.score >= 0.9 ? 'good' : 'bad'}`}>
            <strong>{Math.round(result.score * 100)}% correct</strong>
            <p lang="en" className="marks">
              {result.marks.map((m, k) => (
                <span key={k} className={m.ok ? 'm-ok' : 'm-miss'}>
                  {m.word}{' '}
                </span>
              ))}
            </p>
            <div className="small muted">
              You wrote: <span lang="en">{typed}</span>
            </div>
            {s.fa && profile.persianHelp && <Fa block className="example-fa">{s.fa}</Fa>}
          </div>
        )}
      </Card>
      {result && (
        <Btn variant="primary" size="lg" block onClick={next} autoFocus>
          {i + 1 < sentences.length ? 'Next sentence' : 'Finish'} <Icon name="arrow" size={18} />
        </Btn>
      )}
    </div>
  );
}
