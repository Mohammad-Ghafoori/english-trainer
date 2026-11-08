import { useEffect, useMemo, useRef, useState } from 'react';
import { BackLink, Btn, Card, Chip, Empty, Fa, Help, Icon, Segmented, Title } from '../components/ui';
import { CUE_CARDS, LETTER_PHRASES, LINKERS, PART1, WRITING, WRITING_RULES, type WritingPrompt } from '../data/ielts';
import { SpeakAnswer, SPEAKING_CRITERIA } from '../features/ielts/SpeakAnswer';
import { logDay, update, useApp } from '../lib/store';
import { go, href } from '../lib/router';
import { countWords, pick, uid } from '../lib/util';

export function Ielts({ route }: { route: string[] }) {
  const [section, a, b] = route;
  if (section === 'speaking') return <Speaking part={a} />;
  if (section === 'writing') return a ? <WritingTask id={a} view={b} /> : <WritingList />;
  return <IeltsHome />;
}

function IeltsHome() {
  const s = useApp();
  const daysLeft = s.profile.examDate ? Math.ceil((new Date(s.profile.examDate).getTime() - Date.now()) / 86_400_000) : null;
  return (
    <div className="stack">
      <Title en="IELTS" fa="آیلتس" />
      <Card className="hero">
        <div className="row-between">
          <div>
            <div className="small muted">Your target</div>
            <div className="hero-level">Band {s.profile.targetBand} · General Training</div>
          </div>
          {daysLeft !== null && daysLeft >= 0 && <Chip tone="warn">{daysLeft} days to exam</Chip>}
        </div>
        <Fa block className="help">
          برای مهاجرت معمولاً <b>IELTS General Training</b> لازم است (نه Academic). مثال‌ها: کانادا (Express Entry) حداقل CLB 7 یعنی ۶ در هر چهار مهارت؛ نمره‌ی بالاتر (مثلاً L8 R7 W7 S7 = CLB 9) امتیاز خیلی بیشتری می‌دهد. استرالیا: Competent = ۶، Proficient = ۷، Superior = ۸ در هر مهارت. قوانین تغییر می‌کنند؛ قبل از ثبت‌نام، سایت رسمی اداره‌ی مهاجرت را چک کنید.
        </Fa>
      </Card>

      <h2 className="section-title">Speaking</h2>
      <div className="grid">
        <a className="tile" href={href('ielts/speaking/1')}>
          <Icon name="mic" />
          <span>Part 1</span>
          <span className="small muted">Short questions · 4–5 min</span>
        </a>
        <a className="tile" href={href('ielts/speaking/2')}>
          <Icon name="clock" />
          <span>Part 2</span>
          <span className="small muted">1 min prep · 2 min talk</span>
        </a>
        <a className="tile" href={href('ielts/speaking/3')}>
          <Icon name="sparkle" />
          <span>Part 3</span>
          <span className="small muted">Discussion</span>
        </a>
      </div>

      <h2 className="section-title">Writing</h2>
      <div className="grid">
        <a className="tile" href={href('ielts/writing')}>
          <Icon name="pen" />
          <span>Task 1 · Letter</span>
          <span className="small muted">150+ words · 20 min</span>
        </a>
        <a className="tile" href={href('ielts/writing')}>
          <Icon name="book" />
          <span>Task 2 · Essay</span>
          <span className="small muted">250+ words · 40 min</span>
        </a>
      </div>

      <h2 className="section-title">Listening & Reading</h2>
      <Card>
        <div className="stack">
          <a className="list-item" href={href('practice/dictation')}>
            <div className="list-main">
              <strong>Dictation</strong>
              <Fa className="small muted">دیکته: شنیدن دقیق + املای درست (در Listening املای غلط = جواب غلط)</Fa>
            </div>
            <Icon name="arrow" />
          </a>
          <Help>
            برای Reading و Listening، تست‌های نمونه‌ی رایگان را از سایت‌های رسمی IELTS (ielts.org، British Council، IDP) تمرین کنید. هر هفته حداقل یک تست کامل با زمان واقعی. مهم‌تر از تست زدن: هر روز متن و فایل صوتی در سطح خودتان (بیش از ۹۵٪ آشنا) بخوانید و گوش کنید.
          </Help>
        </div>
      </Card>
    </div>
  );
}

// ---------------- Speaking ----------------

function Speaking({ part }: { part?: string }) {
  const [round, setRound] = useState(0);
  return (
    <div className="stack">
      <BackLink to="ielts" label="IELTS" />
      {part === '2' ? <Part2 key={round} onAgain={() => setRound((r) => r + 1)} /> : part === '3' ? <Part3 key={round} onAgain={() => setRound((r) => r + 1)} /> : <Part1 key={round} onAgain={() => setRound((r) => r + 1)} />}
    </div>
  );
}

function SelfCheck({ onAgain }: { onAgain: () => void }) {
  const [checked, setChecked] = useState<Set<number>>(new Set());
  useEffect(() => logDay({ ielts: 1 }), []);
  return (
    <Card>
      <h3>Check yourself</h3>
      <Fa block className="small muted">ضبط خودتان را گوش کنید و هر موردی را که درست انجام دادید تیک بزنید. این همان معیارهای نمره‌دهی آیلتس است.</Fa>
      <div className="stack">
        {SPEAKING_CRITERIA.map((c, i) => (
          <label key={i} className="check">
            <input
              type="checkbox"
              checked={checked.has(i)}
              onChange={() => {
                const n = new Set(checked);
                if (n.has(i)) n.delete(i);
                else n.add(i);
                setChecked(n);
              }}
            />
            <span>
              {c.en}
              <Fa block className="small muted">{c.fa}</Fa>
            </span>
          </label>
        ))}
      </div>
      <Btn variant="primary" onClick={onAgain}>
        New questions
      </Btn>
    </Card>
  );
}

function Part1({ onAgain }: { onAgain: () => void }) {
  const [topic] = useState(() => pick(PART1));
  const [i, setI] = useState(0);
  const done = i >= topic.questions.length;
  return (
    <>
      <Title en="Speaking Part 1" fa="اسپیکینگ پارت ۱" />
      <Help>جواب‌های کوتاه ولی کامل (۲ تا ۳ جمله): جواب مستقیم + دلیل + مثال. فقط «Yes» یا «No» نگویید.</Help>
      <Chip tone="accent">Topic: {topic.topic}</Chip>
      {!done ? (
        <Card>
          <div className="small muted">
            Question {i + 1} of {topic.questions.length}
          </div>
          <SpeakAnswer key={i} question={topic.questions[i]} maxSeconds={40} onDone={() => setI(i + 1)} />
        </Card>
      ) : (
        <SelfCheck onAgain={onAgain} />
      )}
    </>
  );
}

function Part2({ onAgain }: { onAgain: () => void }) {
  const [card] = useState(() => pick(CUE_CARDS));
  const [done, setDone] = useState(false);
  return (
    <>
      <Title en="Speaking Part 2" fa="اسپیکینگ پارت ۲" />
      <Help>۱ دقیقه وقت دارید یادداشت بنویسید (فقط کلمه‌های کلیدی)، بعد ۱ تا ۲ دقیقه بدون توقف صحبت کنید. به همه‌ی بندها جواب بدهید.</Help>
      <Card>
        <div className="cue-card">
          <strong lang="en">{card.title}</strong>
          <div className="small muted">You should say:</div>
          <ul lang="en">
            {card.bullets.map((b) => (
              <li key={b}>{b}</li>
            ))}
          </ul>
        </div>
        {!done ? <SpeakAnswer question={card.title} prepSeconds={60} maxSeconds={120} speakQuestion={false} onDone={() => setDone(true)} /> : <SelfCheck onAgain={onAgain} />}
      </Card>
    </>
  );
}

function Part3({ onAgain }: { onAgain: () => void }) {
  const [card] = useState(() => pick(CUE_CARDS));
  const [i, setI] = useState(0);
  const done = i >= card.part3.length;
  return (
    <>
      <Title en="Speaking Part 3" fa="اسپیکینگ پارت ۳" />
      <Help>
        سؤال‌های کلی و بحثی. جواب‌های طولانی‌تر (۴ تا ۶ جمله): نظر + دلیل + مثال + طرف مقابل. عبارت‌های مفید: It depends on… / On the one hand… / I’d say that… / For instance…
      </Help>
      {!done ? (
        <Card>
          <div className="small muted">
            Question {i + 1} of {card.part3.length}
          </div>
          <SpeakAnswer key={i} question={card.part3[i]} maxSeconds={75} onDone={() => setI(i + 1)} />
        </Card>
      ) : (
        <SelfCheck onAgain={onAgain} />
      )}
    </>
  );
}

// ---------------- Writing ----------------

function WritingList() {
  const s = useApp();
  const [task, setTask] = useState<'task1' | 'task2'>('task1');
  const list = WRITING.filter((w) => w.task === task);
  const history = s.writing.filter((w) => w.task === task);
  return (
    <div className="stack">
      <BackLink to="ielts" label="IELTS" />
      <Title en="IELTS Writing" fa="رایتینگ آیلتس" />
      <Segmented
        value={task}
        onChange={setTask}
        options={[
          { value: 'task1', label: 'Task 1 · Letter' },
          { value: 'task2', label: 'Task 2 · Essay' },
        ]}
      />
      <Help>
        {task === 'task1'
          ? 'نامه: حداقل ۱۵۰ کلمه در ۲۰ دقیقه. به هر سه بند جواب بدهید. لحن نامه (رسمی/نیمه‌رسمی/دوستانه) را از مخاطب تشخیص دهید.'
          : 'مقاله: حداقل ۲۵۰ کلمه در ۴۰ دقیقه. ساختار ساده: مقدمه (نظر شما) + ۲ پاراگراف بدنه (هر کدام یک ایده + مثال) + نتیجه‌گیری.'}
      </Help>
      <div className="list">
        {list.map((p) => (
          <a key={p.id} className="list-item" href={href(`ielts/writing/${p.id}`)}>
            <div className="list-main">
              <span lang="en">{p.prompt}</span>
              {p.tone && <Chip>{p.tone}</Chip>}
            </div>
            <Icon name="arrow" />
          </a>
        ))}
      </div>
      {history.length > 0 && (
        <>
          <h2 className="section-title">Your writing</h2>
          <div className="list">
            {history.slice(0, 20).map((h) => (
              <a key={h.id} className="list-item" href={href(`ielts/writing/${h.promptId}/${h.id}`)}>
                <div className="list-main">
                  <span className="small">{new Date(h.date).toLocaleDateString()}</span>
                  <span className="small muted">
                    {WRITING.find((w) => w.id === h.promptId)?.prompt.slice(0, 60)}…
                  </span>
                </div>
                <span className="small">
                  {h.words} words · {h.minutes} min
                </span>
              </a>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

interface Finding {
  en: string;
  fa: string;
  examples: string[];
}

function analyse(text: string, prompt: WritingPrompt) {
  const formal = prompt.task === 'task2' || prompt.tone === 'formal' || prompt.tone === 'semi-formal';
  const findings: Finding[] = [];
  for (const r of WRITING_RULES) {
    if (r.formalOnly && !formal) continue;
    const m = [...text.matchAll(r.re)].map((x) => x[0].replace(/^[.!?\s]+/, '').trim());
    if (m.length) findings.push({ en: r.en, fa: r.fa, examples: [...new Set(m)].slice(0, 4) });
  }
  const lower = ' ' + text.toLowerCase().replace(/\s+/g, ' ') + ' ';
  const linkers = LINKERS.filter((l) => lower.includes(' ' + l + ' ') || lower.includes(' ' + l + ','));
  const paragraphs = text.split(/\n\s*\n|\n/).filter((p) => p.trim().length > 20).length;
  const sentences = text.split(/[.!?]+/).filter((x) => x.trim().split(/\s+/).length > 2);
  const avgLen = sentences.length ? countWords(text) / sentences.length : 0;
  const STOP = new Set('the a an and or but to of in on at for with is are was were be been it this that these those i you he she we they my your their our its as by from not have has had do does did can will would should could more most very also there which who what when so if than then some many much such about into because people'.split(' '));
  const freq = new Map<string, number>();
  for (const w of text.toLowerCase().match(/[a-z']+/g) ?? []) if (!STOP.has(w) && w.length > 3) freq.set(w, (freq.get(w) ?? 0) + 1);
  const repeated = [...freq.entries()].filter(([, n]) => n >= (prompt.task === 'task2' ? 5 : 4)).sort((a, b) => b[1] - a[1]).slice(0, 5);
  return { findings, linkers, paragraphs, avgLen, repeated };
}

const WRITING_CHECKLIST: Record<'task1' | 'task2', { en: string; fa: string }[]> = {
  task1: [
    { en: 'I answered all three bullet points.', fa: 'به هر سه بند جواب دادم.' },
    { en: 'The tone fits the reader (formal / semi-formal / informal).', fa: 'لحن نامه با مخاطب جور است.' },
    { en: 'I used a correct opening and closing.', fa: 'شروع و پایان نامه درست است.' },
    { en: 'Each paragraph has one purpose.', fa: 'هر پاراگراف یک هدف دارد.' },
  ],
  task2: [
    { en: 'My opinion is clear in the introduction and conclusion.', fa: 'نظرم در مقدمه و نتیجه‌گیری واضح است.' },
    { en: 'Each body paragraph has one main idea with an explanation and an example.', fa: 'هر پاراگراف بدنه یک ایده‌ی اصلی + توضیح + مثال دارد.' },
    { en: 'I answered every part of the question.', fa: 'به همه‌ی بخش‌های سؤال جواب دادم.' },
    { en: 'I used a range of vocabulary and did not repeat the same words.', fa: 'واژگان متنوع استفاده کردم و کلمه‌ها را تکرار نکردم.' },
  ],
};

function WritingTask({ id, view }: { id: string; view?: string }) {
  const s = useApp();
  const prompt = WRITING.find((w) => w.id === id);
  const saved = view ? s.writing.find((w) => w.id === view) : undefined;
  const draftKey = `et-draft-${id}`;
  const [text, setText] = useState(() => saved?.text ?? safeGet(draftKey) ?? '');
  const [submitted, setSubmitted] = useState(!!saved);
  const [started] = useState(() => Date.now());
  const [now, setNow] = useState(Date.now());
  const [showPhrases, setShowPhrases] = useState(false);
  const savedRef = useRef(false);

  useEffect(() => {
    if (submitted) return;
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [submitted]);

  useEffect(() => {
    if (!submitted) safeSet(draftKey, text);
  }, [text, submitted, draftKey]);

  const words = countWords(text);
  const analysis = useMemo(() => (submitted && prompt ? analyse(text, prompt) : null), [submitted, text, prompt]);

  if (!prompt) return <Empty>Prompt not found.</Empty>;
  const limit = prompt.task === 'task1' ? 20 : 40;
  const minWords = prompt.task === 'task1' ? 150 : 250;
  const elapsed = Math.floor((now - started) / 1000);
  const left = limit * 60 - elapsed;
  const phrases = prompt.tone ? LETTER_PHRASES[prompt.tone] : null;

  function submit() {
    setSubmitted(true);
    if (savedRef.current || saved) return;
    savedRef.current = true;
    update((d) => {
      d.writing.unshift({ id: uid(), date: new Date().toISOString(), task: prompt!.task, promptId: prompt!.id, text, words, minutes: Math.max(1, Math.round(elapsed / 60)) });
      d.writing = d.writing.slice(0, 50);
    });
    logDay({ ielts: 1 });
    safeSet(draftKey, '');
  }

  return (
    <div className="stack">
      <BackLink to="ielts/writing" label="Writing" />
      <Card>
        <div className="row-between">
          <Chip tone="accent">{prompt.task === 'task1' ? `Task 1 · ${prompt.tone} letter` : 'Task 2 · Essay'}</Chip>
          {!submitted && <span className={`timer-sm ${left < 0 ? 'over' : ''}`}>{left >= 0 ? `${Math.floor(left / 60)}:${String(left % 60).padStart(2, '0')} left` : `${Math.floor(-left / 60)} min over`}</span>}
        </div>
        <p lang="en" className="prompt">{prompt.prompt}</p>
        {prompt.bullets && (
          <>
            <div className="small muted" lang="en">In your letter:</div>
            <ul lang="en">
              {prompt.bullets.map((b) => (
                <li key={b}>{b}</li>
              ))}
            </ul>
          </>
        )}
        <div className="small muted">Write at least {minWords} words.</div>
      </Card>

      {!submitted ? (
        <>
          <textarea className="input editor" value={text} onChange={(e) => setText(e.target.value)} placeholder={prompt.task === 'task1' ? 'Dear …' : 'Start your essay here…'} spellCheck={false} lang="en" />
          <div className="row-between">
            <span className={words >= minWords ? 'good-text' : 'muted'}>
              {words} / {minWords} words
            </span>
            <Btn variant="ghost" size="sm" onClick={() => setShowPhrases(!showPhrases)}>
              {showPhrases ? 'Hide' : 'Show'} useful phrases
            </Btn>
          </div>
          {showPhrases && (
            <Card>
              {phrases && (
                <>
                  <div className="small muted">Start: {phrases.open.join(' / ')}</div>
                  <div className="small muted">End: {phrases.close.join(' / ')}</div>
                  <ul lang="en" className="small">
                    {phrases.useful.map((p) => (
                      <li key={p}>{p}</li>
                    ))}
                  </ul>
                </>
              )}
              <div className="phrase-cloud" lang="en">
                {LINKERS.slice(0, 28).map((l) => (
                  <span key={l} className="chip">{l}</span>
                ))}
              </div>
            </Card>
          )}
          <Fa block className="small muted">غلط‌یاب مرورگر خاموش است، مثل آزمون واقعی. پیش‌نویس شما خودکار ذخیره می‌شود.</Fa>
          <Btn variant="primary" size="lg" block onClick={submit} disabled={words < 20}>
            Finish and check
          </Btn>
        </>
      ) : (
        analysis && (
          <>
            <Card>
              <h3>Your text</h3>
              <div className="essay" lang="en">
                {text.split('\n').map((p, i) => (
                  <p key={i}>{p}</p>
                ))}
              </div>
            </Card>
            <Card>
              <h3>Automatic check</h3>
              <div className="stats-row">
                <div className={`stat ${words >= minWords ? 'ok' : 'bad'}`}>
                  <b>{words}</b>
                  <span>words (min {minWords})</span>
                </div>
                <div className={`stat ${analysis.paragraphs >= (prompt.task === 'task1' ? 3 : 4) ? 'ok' : 'bad'}`}>
                  <b>{analysis.paragraphs}</b>
                  <span>paragraphs</span>
                </div>
                <div className={`stat ${analysis.linkers.length >= 5 ? 'ok' : 'bad'}`}>
                  <b>{analysis.linkers.length}</b>
                  <span>linking words</span>
                </div>
                <div className="stat">
                  <b>{analysis.avgLen.toFixed(0)}</b>
                  <span>words / sentence</span>
                </div>
              </div>
              {words < minWords && <Fa block className="help warn">کمتر از حد لازم نوشتید. در آیلتس این باعث کم شدن نمره‌ی Task Achievement می‌شود.</Fa>}
              {analysis.linkers.length > 0 && (
                <div className="small">
                  Linking words used: <span lang="en">{analysis.linkers.join(', ')}</span>
                </div>
              )}
              {analysis.repeated.length > 0 && (
                <div className="small">
                  Repeated often (try synonyms):{' '}
                  <span lang="en">
                    {analysis.repeated.map(([w, n]) => `${w} ×${n}`).join(', ')}
                  </span>
                </div>
              )}
              <h4>Possible mistakes</h4>
              {analysis.findings.length === 0 ? (
                <div className="small good-text">No common mistakes found. (This checker only knows common patterns — it can’t catch everything.)</div>
              ) : (
                <div className="stack">
                  {analysis.findings.map((f, i) => (
                    <div key={i} className="finding">
                      <div>
                        <strong>{f.en}</strong>{' '}
                        <span lang="en" className="small muted">
                          — found: “{f.examples.join('”, “')}”
                        </span>
                      </div>
                      <Fa block className="small">{f.fa}</Fa>
                    </div>
                  ))}
                </div>
              )}
            </Card>
            <Card>
              <h3>Check yourself</h3>
              {WRITING_CHECKLIST[prompt.task].map((c, i) => (
                <label key={i} className="check">
                  <input type="checkbox" />
                  <span>
                    {c.en}
                    <Fa block className="small muted">{c.fa}</Fa>
                  </span>
                </label>
              ))}
            </Card>
            <div className="row">
              <Btn onClick={() => go('ielts/writing')}>Back to prompts</Btn>
            </div>
          </>
        )
      )}
    </div>
  );
}

function safeGet(k: string): string | null {
  try {
    return localStorage.getItem(k);
  } catch {
    return null;
  }
}

function safeSet(k: string, v: string) {
  try {
    if (v) localStorage.setItem(k, v);
    else localStorage.removeItem(k);
  } catch {
    /* ignore */
  }
}
