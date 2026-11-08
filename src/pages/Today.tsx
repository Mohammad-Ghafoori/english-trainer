import { useMemo, useState } from 'react';
import type { Trap, Word } from '../types';
import { LEVEL_INFO } from '../types';
import { Btn, Card, Chip, Fa, Help, Icon, Title } from '../components/ui';
import { currentLevel, dueCardIds, nextNewWords, recentWords } from '../data/words';
import type { SoundSet } from '../data/sounds';
import { PART1 } from '../data/ielts';
import { LearnNew } from '../features/vocab/LearnNew';
import { ReviewSession } from '../features/vocab/ReviewSession';
import { TrapDrill } from '../features/practice/TrapDrill';
import { SoundListen } from '../features/practice/SoundDrill';
import { Shadowing, type Sentence } from '../features/practice/Shadowing';
import { SpeakAnswer } from '../features/ielts/SpeakAnswer';
import { pickSoundSet, pickTrap } from '../lib/plan';
import { getState, logDay, streak, today, update, useApp } from '../lib/store';
import { dayKey, formatDuration, pick } from '../lib/util';
import { href } from '../lib/router';

type StepId = 'review' | 'new' | 'trap' | 'sound' | 'shadow' | 'ielts';

interface Plan {
  steps: StepId[];
  reviewIds: string[];
  newWords: Word[];
  trap: Trap | null;
  sound: SoundSet;
  shadow: Sentence[];
  ielts: string;
}

const STEP_INFO: Record<StepId, { en: string; fa: string; icon: string }> = {
  review: { en: 'Review words', fa: 'مرور کلمه‌ها', icon: 'book' },
  new: { en: 'New words', fa: 'کلمه‌های جدید', icon: 'sparkle' },
  trap: { en: 'Persian trap', fa: 'تله‌ی فارسی', icon: 'target' },
  sound: { en: 'Sound training', fa: 'تمرین شنیدن صداها', icon: 'ear' },
  shadow: { en: 'Shadowing', fa: 'سایه‌خوانی', icon: 'mic' },
  ielts: { en: 'IELTS speaking', fa: 'اسپیکینگ آیلتس', icon: 'award' },
};

const TIPS = [
  'هر روز کم ولی منظم، از چند ساعت در یک روز بهتر است. حافظه با «فاصله» قوی می‌شود.',
  'وقتی کلمه‌ای را مرور می‌کنید، اول واقعاً سعی کنید یادتان بیاید. همین تلاش، یادگیری است.',
  'هر روز ۲۰ دقیقه چیزی گوش کنید که حدود ۹۵٪ آن را می‌فهمید: پادکست آسان، کارتون، یوتیوب با زیرنویس انگلیسی.',
  'بلند صحبت کنید! حتی تنها. جمله‌های مثال را با صدای بلند بخوانید.',
  'برای مهاجرت معمولاً آیلتس جنرال لازم است، نه آکادمیک. حداقل رایج: ۶ در هر مهارت.',
  'اشتباه کردن بخشی از یادگیری است. هر اشتباه، فرصتی برای تمرین است.',
  'فیلم و سریال را اول با زیرنویس انگلیسی ببینید، نه فارسی.',
];

function buildPlan(): Plan {
  const s = getState();
  const k = dayKey();
  const newLeft = Math.max(0, s.profile.dailyNew - (s.days[k]?.newWords ?? 0));
  const reviewIds = dueCardIds(s, 150);
  const newWords = nextNewWords(s, newLeft);
  const trap = pickTrap(s);
  const sound = pickSoundSet(s);
  const shadow = recentWords(s, 12)
    .filter((w) => w.ex.split(' ').length >= 4)
    .slice(0, 2)
    .map((w) => ({ en: w.ex, fa: w.exFa }));
  const lvl = currentLevel(s);
  const ielts = pick(pick(PART1).questions);
  const steps: StepId[] = [];
  if (reviewIds.length) steps.push('review');
  if (newWords.length) steps.push('new');
  if (trap) steps.push('trap');
  steps.push('sound');
  if (shadow.length) steps.push('shadow');
  if (['B1', 'B2', 'C1'].includes(lvl)) steps.push('ielts');
  return { steps, reviewIds, newWords, trap, sound, shadow, ielts };
}

export function Today() {
  const s = useApp();
  const [plan, setPlan] = useState<Plan | null>(null);
  const [stepIdx, setStepIdx] = useState(0);
  const [finished, setFinished] = useState(false);
  const preview = useMemo(() => (plan ? null : buildPlan()), [plan, s]);

  const k = dayKey();
  const day = s.days[k];
  const st = streak(s);
  const lvl = currentLevel(s);
  const tip = TIPS[new Date().getDate() % TIPS.length];

  function start() {
    setPlan(buildPlan());
    setStepIdx(0);
    setFinished(false);
  }

  function nextStep() {
    if (!plan) return;
    if (stepIdx + 1 < plan.steps.length) setStepIdx(stepIdx + 1);
    else {
      update((d) => {
        today(d).sessionDone = true;
      });
      setFinished(true);
    }
  }

  function exit() {
    setPlan(null);
    setFinished(false);
  }

  // ---------- Session finished ----------
  if (plan && finished) {
    return (
      <div className="stack">
        <Card className="celebrate">
          <div className="big-emoji" aria-hidden="true">🎉</div>
          <h1>Session complete!</h1>
          <Fa block>آفرین! تمرین امروز تمام شد. فردا دوباره بیایید تا زنجیره قطع نشود.</Fa>
          <div className="stats-row">
            <div className="stat"><b>{streak(getState())}</b><span>day streak</span></div>
            <div className="stat"><b>{getState().days[k]?.reviews ?? 0}</b><span>reviews</span></div>
            <div className="stat"><b>{getState().days[k]?.newWords ?? 0}</b><span>new words</span></div>
            <div className="stat"><b>{formatDuration(getState().days[k]?.seconds ?? 0)}</b><span>today</span></div>
          </div>
          <Btn variant="primary" size="lg" onClick={exit}>Back to Today</Btn>
        </Card>
        <Help>
          کار بیشتر می‌خواهید؟ تمرین تله‌های فارسی، دیکته یا رایتینگ آیلتس را از منو انتخاب کنید. یا ۲۰ دقیقه چیزی به انگلیسی گوش کنید.
        </Help>
      </div>
    );
  }

  // ---------- Running a session ----------
  if (plan) {
    const id = plan.steps[stepIdx];
    const info = STEP_INFO[id];
    return (
      <div className="stack">
        <div className="session-head">
          <button type="button" className="icon-btn" onClick={exit} aria-label="Exit session">
            <Icon name="x" />
          </button>
          <div className="session-steps">
            {plan.steps.map((sid, i) => (
              <span key={sid} className={`seg ${i < stepIdx ? 'done' : i === stepIdx ? 'on' : ''}`} title={STEP_INFO[sid].en} />
            ))}
          </div>
          <span className="muted small">
            {stepIdx + 1}/{plan.steps.length}
          </span>
        </div>
        <Title en={info.en} fa={info.fa} level={2} />
        {id === 'review' && <ReviewSession ids={plan.reviewIds} onDone={nextStep} />}
        {id === 'new' && <LearnNew words={plan.newWords} onDone={nextStep} />}
        {id === 'trap' && plan.trap && (
          <>
            <Card>
              <div className="row-between">
                <strong>{plan.trap.title}</strong>
                <Chip>{plan.trap.level}</Chip>
              </div>
              <Fa block className="help">{plan.trap.explainFa}</Fa>
            </Card>
            <TrapDrill trap={plan.trap} count={5} onDone={nextStep} />
          </>
        )}
        {id === 'sound' && <SoundListen set={plan.sound} trials={8} onDone={nextStep} />}
        {id === 'shadow' && <Shadowing sentences={plan.shadow} onDone={nextStep} />}
        {id === 'ielts' && (
          <Card>
            <Help>به این سؤال پارت ۱ حدود ۲۰ تا ۳۰ ثانیه جواب بدهید: جواب + دلیل + مثال.</Help>
            <SpeakAnswer
              question={plan.ielts}
              maxSeconds={40}
              onDone={() => {
                logDay({ ielts: 1 });
                nextStep();
              }}
            />
          </Card>
        )}
        <div className="center">
          <button type="button" className="link small" onClick={nextStep}>
            Skip this step
          </button>
        </div>
      </div>
    );
  }

  // ---------- Home ----------
  const p = preview!;
  const done = day?.sessionDone;
  return (
    <div className="stack">
      <div className="today-head">
        <div>
          <h1>Today</h1>
          <Fa className="muted">امروز</Fa>
        </div>
        <div className="row">
          <Chip tone={st > 0 ? 'warn' : 'plain'}>
            <Icon name="flame" size={14} /> {st} day{st === 1 ? '' : 's'}
          </Chip>
          <Chip>
            <Icon name="clock" size={14} /> {formatDuration(day?.seconds ?? 0)}
          </Chip>
        </div>
      </div>

      <Card className="hero">
        <div className="row-between">
          <div>
            <div className="small muted">Learning now</div>
            <div className="hero-level">
              {lvl} · {LEVEL_INFO[lvl].name}
            </div>
          </div>
          {done && <Chip tone="good"><Icon name="check" size={14} /> Done today</Chip>}
        </div>
        <ul className="plan-list">
          {p.steps.map((sid) => (
            <li key={sid}>
              <span className="plan-icon"><Icon name={STEP_INFO[sid].icon} size={18} /></span>
              <span className="plan-name">
                {STEP_INFO[sid].en}
                {s.profile.persianHelp && (
                  <Fa block className="muted small plan-fa">
                    {STEP_INFO[sid].fa}
                  </Fa>
                )}
              </span>
              <span className="muted small">
                {sid === 'review' && `${p.reviewIds.length} cards`}
                {sid === 'new' && `${p.newWords.length} words`}
                {sid === 'trap' && p.trap?.title}
                {sid === 'sound' && p.sound.title}
                {sid === 'shadow' && `${p.shadow.length} sentences`}
                {sid === 'ielts' && 'Part 1'}
              </span>
            </li>
          ))}
        </ul>
        <Btn variant="primary" size="lg" block onClick={start}>
          {done ? 'Practise again' : 'Start today’s session'} <Icon name="arrow" size={18} />
        </Btn>
        <div className="small muted center">About {Math.max(10, Math.round(p.reviewIds.length * 0.15 + p.newWords.length * 1 + 8))} minutes</div>
      </Card>

      <Help>💡 {tip}</Help>

      <h2 className="section-title">Extra practice</h2>
      <div className="grid">
        <a className="tile" href={href('words')}><Icon name="book" /><span>Words</span><Fa className="small muted">کلمه‌ها</Fa></a>
        <a className="tile" href={href('practice/traps')}><Icon name="target" /><span>Persian traps</span><Fa className="small muted">تله‌های فارسی</Fa></a>
        <a className="tile" href={href('practice/sounds')}><Icon name="ear" /><span>Sounds</span><Fa className="small muted">تلفظ</Fa></a>
        <a className="tile" href={href('practice/shadowing')}><Icon name="mic" /><span>Shadowing</span><Fa className="small muted">سایه‌خوانی</Fa></a>
        <a className="tile" href={href('practice/dictation')}><Icon name="pen" /><span>Dictation</span><Fa className="small muted">دیکته</Fa></a>
        <a className="tile" href={href('ielts')}><Icon name="award" /><span>IELTS</span><Fa className="small muted">آیلتس</Fa></a>
      </div>
    </div>
  );
}
