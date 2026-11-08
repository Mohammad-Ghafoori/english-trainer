import { useMemo, useState } from 'react';
import type { SoundSet } from '../../data/sounds';
import { Btn, Card, Chip, Fa, Help, Icon, Progress } from '../../components/ui';
import { recordSkill } from '../../lib/store';
import { speak, trainingVoices } from '../../lib/speech';
import { pick, shuffle } from '../../lib/util';
import { SayCheck } from './SayCheck';

interface Trial {
  pair: [string, string];
  target: 0 | 1;
  voice: SpeechSynthesisVoice | null;
  rate: number;
}

function makeTrials(set: SoundSet, n: number): Trial[] {
  const voices = trainingVoices();
  const pairs = shuffle(set.pairs);
  return Array.from({ length: n }, (_, i) => ({
    pair: pairs[i % pairs.length],
    target: (Math.random() < 0.5 ? 0 : 1) as 0 | 1,
    voice: voices.length ? pick(voices) : null,
    rate: 0.85 + Math.random() * 0.2,
  }));
}

/**
 * Listening training with many voices (High-Variability Phonetic Training).
 * Hearing the two sounds from different speakers teaches your ear the difference — and that helps you say it.
 */
export function SoundListen({ set, trials = 10, onDone }: { set: SoundSet; trials?: number; onDone: (correct: number, total: number) => void }) {
  const list = useMemo(() => makeTrials(set, trials), [set, trials]);
  const [started, setStarted] = useState(false);
  const [i, setI] = useState(0);
  const [chosen, setChosen] = useState<0 | 1 | null>(null);
  const [score, setScore] = useState(0);
  const t = list[i];
  const voiceCount = new Set(list.map((x) => x.voice?.voiceURI)).size;

  const play = (word: string, tr = t) => speak(word, { voice: tr.voice, rate: tr.rate });

  if (!set.pairs.length || !t) return null;

  if (!started) {
    return (
      <Card>
        <div className="stack">
          <div className="row">
            <Chip tone="accent">{set.sounds[0]}</Chip> vs <Chip tone="accent">{set.sounds[1]}</Chip>
          </div>
          <Fa block className="help">{set.howFa}</Fa>
          <div className="small muted">
            {trials} rounds · {voiceCount > 1 ? `${voiceCount} different voices` : 'install more English voices for variety'}
          </div>
          <Btn
            variant="primary"
            size="lg"
            block
            onClick={() => {
              setStarted(true);
              play(t.pair[t.target]);
            }}
          >
            <Icon name="ear" size={18} /> Start listening
          </Btn>
        </div>
      </Card>
    );
  }

  const answered = chosen !== null;
  const ok = chosen === t.target;

  function choose(k: 0 | 1) {
    if (answered) return;
    setChosen(k);
    const right = k === t.target;
    if (right) setScore((n) => n + 1);
    recordSkill('sounds', set.id, right);
  }

  function next() {
    if (i + 1 < list.length) {
      const n = list[i + 1];
      setI(i + 1);
      setChosen(null);
      play(n.pair[n.target], n);
    } else onDone(score, list.length);
  }

  return (
    <div className="stack">
      <div className="row-between">
        <Chip tone="accent">{set.title}</Chip>
        <span className="muted small">
          {i + 1} / {list.length}
        </span>
      </div>
      <Progress value={i} max={list.length} />
      <Card>
        <div className="quiz-q center">
          <div className="muted small">Which word do you hear?</div>
          <Btn variant="soft" size="lg" onClick={() => play(t.pair[t.target])}>
            <Icon name="speaker" size={22} /> Play again
          </Btn>
        </div>
        <div className="options options-2">
          {([0, 1] as const).map((k) => {
            const state = !answered ? '' : k === t.target ? 'is-right' : k === chosen ? 'is-wrong' : 'is-dim';
            return (
              <button key={k} type="button" className={`option option-big ${state}`} onClick={() => choose(k)} lang="en">
                {t.pair[k]}
                <span className="small muted">{set.sounds[k]}</span>
              </button>
            );
          })}
        </div>
        {answered && (
          <div className={`feedback ${ok ? 'good' : 'bad'}`}>
            <strong>{ok ? 'Correct!' : `It was “${t.pair[t.target]}”.`}</strong>
            <div className="row">
              <Btn size="sm" onClick={() => play(t.pair[0])}>
                <Icon name="speaker" size={16} /> {t.pair[0]}
              </Btn>
              <Btn size="sm" onClick={() => play(t.pair[1])}>
                <Icon name="speaker" size={16} /> {t.pair[1]}
              </Btn>
            </div>
          </div>
        )}
      </Card>
      {answered && (
        <Btn variant="primary" size="lg" block onClick={next} autoFocus>
          {i + 1 < list.length ? 'Next' : 'Finish'} <Icon name="arrow" size={18} />
        </Btn>
      )}
    </div>
  );
}

/** Speaking practice for a sound: say each word; the app checks what it heard. */
export function SoundSay({ set }: { set: SoundSet }) {
  const words = useMemo(() => (set.pairs.length ? set.pairs.flat() : set.words ?? []), [set]);
  const [i, setI] = useState(0);
  const word = words[i];
  if (!word) return null;
  return (
    <div className="stack">
      <Help>اول مدل را گوش کنید، بعد بگویید. اگر کامپیوتر کلمه‌ی جفت را شنید (مثلاً tree به‌جای three)، یعنی صدا هنوز درست نیست.</Help>
      <Card>
        <div className="row-between">
          <div className="word-big" lang="en">{word}</div>
          <span className="muted small">
            {i + 1} / {words.length}
          </span>
        </div>
        <SayCheck target={word} key={word} />
      </Card>
      <div className="row-between">
        <Btn variant="ghost" disabled={i === 0} onClick={() => setI(i - 1)}>
          <Icon name="back" size={18} /> Previous
        </Btn>
        <Btn variant="primary" disabled={i + 1 >= words.length} onClick={() => setI(i + 1)}>
          Next word <Icon name="arrow" size={18} />
        </Btn>
      </div>
    </div>
  );
}
