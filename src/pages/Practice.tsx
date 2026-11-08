import { useState } from 'react';
import { LEVELS } from '../types';
import { BackLink, Btn, Card, Chip, Empty, Fa, Help, Icon, Progress, Segmented, SpeakBtn, Title } from '../components/ui';
import { currentLevel, recentWords, TRAPS, WORDS_BY_LEVEL } from '../data/words';
import { SOUND_SETS } from '../data/sounds';
import { TrapDrill } from '../features/practice/TrapDrill';
import { SoundListen, SoundSay } from '../features/practice/SoundDrill';
import { Shadowing, type Sentence } from '../features/practice/Shadowing';
import { Dictation } from '../features/practice/Dictation';
import { accuracy } from '../lib/plan';
import { getState, useApp } from '../lib/store';
import { go, href } from '../lib/router';
import { sample } from '../lib/util';

export function Practice({ route }: { route: string[] }) {
  const [section, id] = route;
  if (section === 'traps' && id) return <TrapPage id={id} />;
  if (section === 'sounds' && id) return <SoundPage id={id} />;
  if (section === 'shadowing') return <ShadowPage />;
  if (section === 'dictation') return <DictationPage />;
  return <PracticeHome tab={section === 'sounds' ? 'sounds' : section === 'traps' ? 'traps' : 'traps'} />;
}

function PracticeHome({ tab }: { tab: 'traps' | 'sounds' }) {
  const s = useApp();
  const lvl = LEVELS.indexOf(currentLevel(s));
  return (
    <div className="stack">
      <Title en="Practice" fa="تمرین" />
      <div className="row">
        <Btn variant={tab === 'traps' ? 'primary' : 'soft'} onClick={() => go('practice/traps')}>
          <Icon name="target" size={18} /> Persian traps
        </Btn>
        <Btn variant={tab === 'sounds' ? 'primary' : 'soft'} onClick={() => go('practice/sounds')}>
          <Icon name="ear" size={18} /> Sounds
        </Btn>
        <Btn onClick={() => go('practice/shadowing')}>
          <Icon name="mic" size={18} /> Shadowing
        </Btn>
        <Btn onClick={() => go('practice/dictation')}>
          <Icon name="pen" size={18} /> Dictation
        </Btn>
      </div>

      {tab === 'traps' ? (
        <>
          <Help>این‌ها اشتباه‌هایی هستند که از فارسی به انگلیسی منتقل می‌شوند. هر درس توضیح کوتاه + ۱۰ تمرین دارد. درس‌های سطح بالاتر را هم می‌توانید ببینید.</Help>
          {!TRAPS.length && <Empty>Grammar lessons are missing (src/data/traps.json).</Empty>}
          <div className="list">
            {TRAPS.map((t) => {
              const acc = accuracy(s.traps[t.id]);
              const locked = LEVELS.indexOf(t.level) > Math.max(lvl, 1);
              return (
                <a key={t.id} className={`list-item ${locked ? 'later' : ''}`} href={href(`practice/traps/${t.id}`)}>
                  <div className="list-main">
                    <div className="row">
                      <strong lang="en">{t.title}</strong>
                      <Chip>{t.level}</Chip>
                    </div>
                    <Fa className="small muted">{t.titleFa}</Fa>
                  </div>
                  <div className="list-side">
                    {acc === null ? <span className="small muted">Not started</span> : <span className="small">{Math.round(acc * 100)}%</span>}
                    {acc !== null && <Progress value={acc} tone={acc >= 0.8 ? 'good' : 'warn'} />}
                  </div>
                </a>
              );
            })}
          </div>
        </>
      ) : (
        <>
          <Help>
            صداهایی که در فارسی وجود ندارند. اول «گوش دادن» را تمرین کنید: تحقیقات نشان می‌دهد شنیدن صدا از صداهای (گوینده‌های) مختلف، هم شنیدن و هم تلفظ را بهتر می‌کند.
          </Help>
          <div className="list">
            {SOUND_SETS.map((x) => {
              const acc = accuracy(s.sounds[x.id]);
              return (
                <a key={x.id} className="list-item" href={href(`practice/sounds/${x.id}`)}>
                  <div className="list-main">
                    <div className="row">
                      <strong lang="en">{x.title}</strong>
                      <Chip>{x.sounds.join(' · ')}</Chip>
                    </div>
                    <Fa className="small muted">{x.titleFa}</Fa>
                  </div>
                  <div className="list-side">
                    {x.pairs.length === 0 ? (
                      <span className="small muted">Speaking</span>
                    ) : acc === null ? (
                      <span className="small muted">Not started</span>
                    ) : (
                      <>
                        <span className="small">{Math.round(acc * 100)}%</span>
                        <Progress value={acc} tone={acc >= 0.85 ? 'good' : 'warn'} />
                      </>
                    )}
                  </div>
                </a>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

function TrapPage({ id }: { id: string }) {
  const trap = TRAPS.find((t) => t.id === id);
  const [mode, setMode] = useState<'learn' | 'drill' | 'done'>('learn');
  const [score, setScore] = useState<[number, number]>([0, 0]);
  const [round, setRound] = useState(0);
  if (!trap) return <Empty>Lesson not found.</Empty>;
  return (
    <div className="stack">
      <BackLink to="practice/traps" label="Persian traps" />
      <Title en={trap.title} fa={trap.titleFa} />
      {mode === 'learn' && (
        <>
          <Card>
            <Fa block className="explain">
              {trap.explainFa.split('\n').map((p, i) => (
                <p key={i}>{p}</p>
              ))}
            </Fa>
            <p className="rule" lang="en">
              <Icon name="info" size={16} /> {trap.rule}
            </p>
          </Card>
          <Card>
            <div className="examples">
              {trap.examples.map((e, i) => (
                <div key={i} className="ex-pair">
                  <div className="ex-wrong" lang="en">
                    <Icon name="x" size={16} /> {e.wrong}
                  </div>
                  <div className="ex-right" lang="en">
                    <Icon name="check" size={16} /> {e.right} <SpeakBtn text={e.right} size="sm" />
                  </div>
                </div>
              ))}
            </div>
          </Card>
          <Btn variant="primary" size="lg" block onClick={() => setMode('drill')}>
            Practise (10 questions) <Icon name="arrow" size={18} />
          </Btn>
        </>
      )}
      {mode === 'drill' && (
        <TrapDrill
          key={round}
          trap={trap}
          onDone={(c, t) => {
            setScore([c, t]);
            setMode('done');
          }}
        />
      )}
      {mode === 'done' && (
        <Card className="celebrate">
          <h2>
            {score[0]} / {score[1]} correct
          </h2>
          <Fa block>{score[0] / score[1] >= 0.8 ? 'عالی! این تله را خوب می‌شناسید.' : 'این تله هنوز تمرین می‌خواهد. توضیح را دوباره بخوانید و تکرار کنید.'}</Fa>
          <div className="row">
            <Btn onClick={() => setMode('learn')}>Read again</Btn>
            <Btn
              variant="primary"
              onClick={() => {
                setRound((r) => r + 1);
                setMode('drill');
              }}
            >
              Practise again
            </Btn>
          </div>
        </Card>
      )}
    </div>
  );
}

function SoundPage({ id }: { id: string }) {
  const set = SOUND_SETS.find((x) => x.id === id);
  const [tab, setTab] = useState<'listen' | 'say'>(set?.pairs.length ? 'listen' : 'say');
  const [result, setResult] = useState<[number, number] | null>(null);
  const [round, setRound] = useState(0);
  if (!set) return <Empty>Not found.</Empty>;
  return (
    <div className="stack">
      <BackLink to="practice/sounds" label="Sounds" />
      <Title en={set.title} fa={set.titleFa} />
      {set.pairs.length > 0 && (
        <Segmented
          value={tab}
          onChange={(v) => {
            setTab(v);
            setResult(null);
          }}
          options={[
            { value: 'listen', label: '1. Listen' },
            { value: 'say', label: '2. Say' },
          ]}
        />
      )}
      {tab === 'listen' && !result && <SoundListen key={round} set={set} trials={12} onDone={(c, t) => setResult([c, t])} />}
      {tab === 'listen' && result && (
        <Card className="celebrate">
          <h2>
            {result[0]} / {result[1]}
          </h2>
          <Fa block>{result[0] / result[1] >= 0.85 ? 'گوش شما این دو صدا را خوب تشخیص می‌دهد. حالا «Say» را تمرین کنید.' : 'ادامه بدهید! چند روز تمرین کوتاه، گوش را آموزش می‌دهد.'}</Fa>
          <div className="row">
            <Btn
              onClick={() => {
                setResult(null);
                setRound((r) => r + 1);
              }}
            >
              Again
            </Btn>
            <Btn variant="primary" onClick={() => setTab('say')}>
              Practise saying <Icon name="arrow" size={18} />
            </Btn>
          </div>
        </Card>
      )}
      {tab === 'say' && (
        <>
          <Fa block className="help">{set.howFa}</Fa>
          <SoundSay set={set} />
        </>
      )}
    </div>
  );
}

function practiceSentences(n: number): Sentence[] {
  const s = getState();
  let pool = recentWords(s, 60).filter((w) => w.ex.split(' ').length >= 4);
  if (pool.length < n) pool = [...pool, ...WORDS_BY_LEVEL[currentLevel(s)].slice(0, 40)];
  return sample(pool, n).map((w) => ({ en: w.ex, fa: w.exFa }));
}

function ShadowPage() {
  const [round, setRound] = useState(0);
  const [done, setDone] = useState(false);
  const [sentences] = useState(() => practiceSentences(5));
  return (
    <div className="stack">
      <BackLink to="practice" label="Practice" />
      <Title en="Shadowing" fa="سایه‌خوانی" />
      <Help>سایه‌خوانی (shadowing): همزمان با گوینده صحبت کنید. این تمرین ریتم، تلفظ و سرعت شنیدن را بهتر می‌کند. جمله‌ها از کلمه‌هایی هستند که یاد گرفته‌اید، چون سایه‌خوانی با متنی که می‌فهمید بهتر جواب می‌دهد.</Help>
      {done ? (
        <Card className="celebrate">
          <h2>Well done!</h2>
          <Btn
            variant="primary"
            onClick={() => {
              setDone(false);
              setRound((r) => r + 1);
            }}
          >
            5 more sentences
          </Btn>
        </Card>
      ) : (
        <ShadowRound key={round} initial={round === 0 ? sentences : undefined} onDone={() => setDone(true)} />
      )}
    </div>
  );
}

function ShadowRound({ initial, onDone }: { initial?: Sentence[]; onDone: () => void }) {
  const [list] = useState(() => initial ?? practiceSentences(5));
  return <Shadowing sentences={list} onDone={onDone} />;
}

function DictationPage() {
  const [round, setRound] = useState(0);
  const [avg, setAvg] = useState<number | null>(null);
  return (
    <div className="stack">
      <BackLink to="practice" label="Practice" />
      <Title en="Dictation" fa="دیکته" />
      {avg !== null ? (
        <Card className="celebrate">
          <h2>{Math.round(avg * 100)}% average</h2>
          <Btn
            variant="primary"
            onClick={() => {
              setAvg(null);
              setRound((r) => r + 1);
            }}
          >
            5 more sentences
          </Btn>
        </Card>
      ) : (
        <DictationRound key={round} onDone={setAvg} />
      )}
    </div>
  );
}

function DictationRound({ onDone }: { onDone: (avg: number) => void }) {
  const [list] = useState(() => practiceSentences(5));
  return <Dictation sentences={list} onDone={onDone} />;
}
