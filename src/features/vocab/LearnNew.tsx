import { useMemo, useState } from 'react';
import type { Word } from '../../types';
import { Btn, Card, Chip, Fa, Help, Highlight, Icon, Progress, SpeakBtn } from '../../components/ui';
import { distractors } from '../../data/words';
import { gradeCard, newCard, Rating, recId } from '../../lib/srs';
import { today, update, useApp } from '../../lib/store';
import { speak } from '../../lib/speech';
import { shuffle } from '../../lib/util';

const CHUNK = 5;

interface QuizItem {
  word: Word;
  type: 'meaning' | 'listen';
  options: string[];
  answer: string;
}

function makeQuiz(words: Word[]): QuizItem[] {
  return shuffle(
    words.map((word, i) => {
      const type = i % 2 === 0 ? 'meaning' : 'listen';
      const answer = type === 'meaning' ? word.fa : word.w;
      const options = shuffle([answer, ...distractors(word, 3, type === 'meaning' ? 'fa' : 'w')]);
      return { word, type, options, answer } as QuizItem;
    }),
  );
}

/**
 * Learning new words: see each word in a sentence (with sound and Persian meaning),
 * then a short quiz straight away (massed practice), then the word goes into spaced review.
 */
export function LearnNew({ words, onDone }: { words: Word[]; onDone: (count: number) => void }) {
  const { profile } = useApp();
  const chunks = useMemo(() => {
    const out: Word[][] = [];
    for (let i = 0; i < words.length; i += CHUNK) out.push(words.slice(i, i + CHUNK));
    return out;
  }, [words]);

  const [chunkIdx, setChunkIdx] = useState(0);
  const [phase, setPhase] = useState<'present' | 'quiz'>('present');
  const [i, setI] = useState(0);
  const [skipped, setSkipped] = useState<Set<string>>(new Set());
  const [quiz, setQuiz] = useState<QuizItem[]>([]);
  const [chosen, setChosen] = useState<string | null>(null);
  const [missed, setMissed] = useState<Set<string>>(new Set());
  const [learnedTotal, setLearnedTotal] = useState(0);

  const chunk = chunks[chunkIdx] ?? [];
  const totalWords = words.length;
  const doneBefore = chunks.slice(0, chunkIdx).reduce((n, c) => n + c.length, 0);

  if (!words.length) return null;

  function finishChunk(missedSet: Set<string>) {
    const toLearn = chunk.filter((w) => !skipped.has(w.id));
    update((s) => {
      const now = new Date();
      for (const w of toLearn) {
        const grade = missedSet.has(w.id) ? Rating.Again : Rating.Good;
        s.cards[recId(w.id)] = gradeCard(newCard(now), grade, now);
        s.queue = s.queue.filter((q) => q !== w.id);
      }
      today(s).newWords += toLearn.length;
    });
    const total = learnedTotal + toLearn.length;
    setLearnedTotal(total);
    if (chunkIdx + 1 < chunks.length) {
      setChunkIdx(chunkIdx + 1);
      setPhase('present');
      setI(0);
      setMissed(new Set());
    } else onDone(total);
  }

  function nextPresent() {
    if (i + 1 < chunk.length) setI(i + 1);
    else startQuiz(skipped);
  }

  function startQuiz(skip: Set<string>) {
    const toQuiz = chunk.filter((w) => !skip.has(w.id));
    if (!toQuiz.length) {
      finishChunk(new Set());
      return;
    }
    setQuiz(makeQuiz(toQuiz));
    setPhase('quiz');
    setChosen(null);
  }

  function markKnown(w: Word) {
    update((s) => {
      s.known[w.id] = true;
      s.queue = s.queue.filter((q) => q !== w.id);
    });
    const next = new Set(skipped).add(w.id);
    setSkipped(next);
    if (i + 1 < chunk.length) setI(i + 1);
    else startQuiz(next);
  }

  // ---------- Presentation ----------
  if (phase === 'present') {
    const w = chunk[i];
    return (
      <div className="stack">
        <div className="row-between">
          <Chip tone="accent">New word {doneBefore + i + 1} / {totalWords}</Chip>
          <Chip>{w.level}</Chip>
        </div>
        <Progress value={doneBefore + i} max={totalWords} />
        <Card className="word-card">
          <div className="word-head">
            <div>
              <div className="word-big" lang="en">{w.w}</div>
              <div className="ipa">
                {w.ipa} <span className="pos">{w.pos}</span>
              </div>
            </div>
            <div className="row">
              <SpeakBtn text={w.w} size="lg" auto key={w.id} />
              <SpeakBtn text={w.w} slow size="md" />
            </div>
          </div>
          <Fa block className="meaning">{w.fa}</Fa>
          <div className="example">
            <div className="row-between">
              <p lang="en">
                <Highlight text={w.ex} word={w.w.split(' ')[0]} />
              </p>
              <SpeakBtn text={w.ex} size="sm" />
            </div>
            {profile.persianHelp && <Fa block className="example-fa">{w.exFa}</Fa>}
          </div>
        </Card>
        <Help>کلمه را بلند تکرار کنید و جمله‌ی مثال را یک بار با صدا بخوانید. دیدن کلمه در جمله، یادگیری را عمیق‌تر می‌کند.</Help>
        <div className="row-between">
          <Btn variant="ghost" onClick={() => markKnown(w)}>
            I already know this
          </Btn>
          <Btn variant="primary" size="lg" onClick={nextPresent}>
            {i + 1 < chunk.length ? 'Next word' : 'Quick check'} <Icon name="arrow" size={18} />
          </Btn>
        </div>
      </div>
    );
  }

  // ---------- Quick check ----------
  const q = quiz[0];
  if (!q) return null;
  const answered = chosen !== null;
  const correct = chosen === q.answer;

  function choose(opt: string) {
    if (answered) return;
    setChosen(opt);
    const ok = opt === q.answer;
    if (!ok) setMissed((m) => new Set(m).add(q.word.id));
    if (q.type === 'listen' || ok) speak(q.word.w);
  }

  function next() {
    const rest = quiz.slice(1);
    // Missed items come back at the end of the quiz until answered correctly.
    if (!correct) rest.push({ ...q, options: shuffle(q.options) });
    setChosen(null);
    if (rest.length) setQuiz(rest);
    else finishChunk(missed);
  }

  return (
    <div className="stack">
      <div className="row-between">
        <Chip tone="accent">Quick check</Chip>
        <span className="muted small">{quiz.length} left</span>
      </div>
      <Card>
        {q.type === 'meaning' ? (
          <div className="quiz-q">
            <div className="muted small">What does this mean?</div>
            <div className="row">
              <span className="word-big" lang="en">{q.word.w}</span>
              <SpeakBtn text={q.word.w} auto key={q.word.id + chosen} />
            </div>
          </div>
        ) : (
          <div className="quiz-q">
            <div className="muted small">Listen. Which word do you hear?</div>
            <div className="row">
              <SpeakBtn text={q.word.w} size="lg" auto key={q.word.id} />
              <SpeakBtn text={q.word.w} slow />
            </div>
          </div>
        )}
        <div className="options">
          {q.options.map((o) => {
            const state = !answered ? '' : o === q.answer ? 'is-right' : o === chosen ? 'is-wrong' : 'is-dim';
            return (
              <button key={o} type="button" className={`option ${state}`} onClick={() => choose(o)} dir={q.type === 'meaning' ? 'rtl' : 'ltr'} lang={q.type === 'meaning' ? 'fa' : 'en'}>
                {o}
              </button>
            );
          })}
        </div>
        {answered && (
          <div className={`feedback ${correct ? 'good' : 'bad'}`}>
            <div className="row">
              <strong>{correct ? 'Correct!' : 'Not quite.'}</strong>
              <span lang="en" className="word-mid">{q.word.w}</span>
              <span className="muted">{q.word.ipa}</span>
            </div>
            <Fa block>{q.word.fa}</Fa>
          </div>
        )}
      </Card>
      {answered && (
        <Btn variant="primary" size="lg" block onClick={next} autoFocus>
          Continue <Icon name="arrow" size={18} />
        </Btn>
      )}
    </div>
  );
}
