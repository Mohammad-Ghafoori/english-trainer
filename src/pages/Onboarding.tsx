import { useMemo, useState } from 'react';
import { LEVELS, LEVEL_INFO, type Level } from '../types';
import { Btn, Card, Fa, Icon, Segmented } from '../components/ui';
import { WORDS_BY_LEVEL } from '../data/words';
import { updateProfile } from '../lib/store';
import { sample, shuffle } from '../lib/util';

const PER_LEVEL = 8;

export function Onboarding() {
  const [step, setStep] = useState(0);
  const [known, setKnown] = useState<Set<string>>(new Set());
  const [level, setLevel] = useState<Level>('A1');
  const [daily, setDaily] = useState(10);

  // A quick yes/no vocabulary check: 8 words from each level, mixed together.
  const test = useMemo(() => shuffle(LEVELS.flatMap((l) => sample(WORDS_BY_LEVEL[l].slice(0, 200), PER_LEVEL))), []);

  function scoreTest() {
    let suggested: Level = 'C1';
    for (const l of LEVELS) {
      const words = test.filter((w) => w.level === l);
      const ratio = words.length ? words.filter((w) => known.has(w.id)).length / words.length : 0;
      if (ratio < 0.75) {
        suggested = l;
        break;
      }
    }
    setLevel(suggested);
    setStep(2);
  }

  function finish() {
    updateProfile({ level, dailyNew: daily, onboarded: true });
    location.hash = '/today';
  }

  return (
    <div className="onboarding">
      {step === 0 && (
        <Card className="stack welcome">
          <img src="./icon.svg" alt="" width={72} height={72} />
          <h1>English Trainer</h1>
          <p className="muted">From beginner to IELTS — made for Persian speakers.</p>
          <Fa block className="lead">
            سلام! این برنامه برای فارسی‌زبان‌ها ساخته شده: کلمه‌ها با مرور هوشمند، تمرین اشتباه‌هایی که از فارسی می‌آیند، آموزش تلفظ صداهای سخت، و تمرین اسپیکینگ و رایتینگ آیلتس.
          </Fa>
          <Btn variant="primary" size="lg" block onClick={() => setStep(1)}>
            Let’s start <Icon name="arrow" size={18} />
          </Btn>
        </Card>
      )}

      {step === 1 && (
        <Card className="stack">
          <h2>Which words do you know?</h2>
          <Fa block className="help">
            روی کلمه‌هایی بزنید که معنی‌شان را <b>مطمئن</b> می‌دانید. صادق باشید؛ این فقط برای پیدا کردن نقطه‌ی شروع شماست.
          </Fa>
          <div className="chip-grid">
            {test.map((w) => (
              <button
                key={w.id}
                type="button"
                className={`pick ${known.has(w.id) ? 'on' : ''}`}
                onClick={() => {
                  const n = new Set(known);
                  if (n.has(w.id)) n.delete(w.id);
                  else n.add(w.id);
                  setKnown(n);
                }}
                lang="en"
              >
                {w.w}
              </button>
            ))}
          </div>
          <div className="small muted">{known.size} selected</div>
          <div className="row-between">
            <Btn
              variant="ghost"
              onClick={() => {
                setLevel('A1');
                setStep(2);
              }}
            >
              I’m a complete beginner
            </Btn>
            <Btn variant="primary" onClick={scoreTest}>
              Done <Icon name="arrow" size={18} />
            </Btn>
          </div>
        </Card>
      )}

      {step === 2 && (
        <Card className="stack">
          <h2>Your starting point</h2>
          <div className="result-level">
            <span>{level}</span>
            <div>
              <strong>{LEVEL_INFO[level].name}</strong>
              <Fa block className="muted">{LEVEL_INFO[level].fa}</Fa>
            </div>
          </div>
          <Fa block className="help">
            پیشنهاد ما شروع از این سطح است. اگر فکر می‌کنید آسان یا سخت است، تغییرش دهید (بعداً هم در تنظیمات قابل تغییر است).
          </Fa>
          <Segmented value={level} onChange={setLevel} options={LEVELS.map((l) => ({ value: l, label: l }))} />
          <h3>New words per day</h3>
          <Segmented value={daily} onChange={setDaily} options={[5, 10, 15, 20].map((n) => ({ value: n, label: String(n) }))} />
          <Fa block className="small muted">
            {daily <= 5 ? 'سبک: حدود ۱۰ تا ۱۵ دقیقه در روز.' : daily <= 10 ? 'متعادل (پیشنهادی): حدود ۲۰ دقیقه در روز. حدود ۳۰۰۰ کلمه در یک سال.' : daily <= 15 ? 'جدی: حدود ۳۰ دقیقه در روز.' : 'فشرده: ۴۰ دقیقه یا بیشتر. فقط اگر هر روز وقت دارید.'}
          </Fa>
          <Btn variant="primary" size="lg" block onClick={() => setStep(3)}>
            Next <Icon name="arrow" size={18} />
          </Btn>
        </Card>
      )}

      {step === 3 && (
        <Card className="stack">
          <h2>How it works</h2>
          <ol className="method-list">
            <li>
              <strong>Every day, one session (~20 min).</strong>
              <Fa block className="small">هر روز یک جلسه: مرور، کلمه‌ی جدید، تله‌ی فارسی، تمرین صدا. پیوستگی از همه چیز مهم‌تر است.</Fa>
            </li>
            <li>
              <strong>Try to remember before you check.</strong>
              <Fa block className="small">اول سعی کنید به یاد بیاورید، بعد جواب را ببینید. صادقانه جواب بدهید تا برنامه زمان مرور را درست تنظیم کند.</Fa>
            </li>
            <li>
              <strong>Say everything out loud.</strong>
              <Fa block className="small">کلمه‌ها و جمله‌ها را بلند تکرار کنید. صحبت کردن با تکرار یاد گرفته می‌شود.</Fa>
            </li>
            <li>
              <strong>Use it on your phone and computer.</strong>
              <Fa block className="small">پیشرفت روی هر دستگاه جداگانه ذخیره می‌شود؛ با Export/Import در صفحه‌ی Progress منتقلش کنید.</Fa>
            </li>
          </ol>
          <Btn variant="primary" size="lg" block onClick={finish}>
            Start learning <Icon name="arrow" size={18} />
          </Btn>
        </Card>
      )}
      <div className="dots">
        {[0, 1, 2, 3].map((i) => (
          <span key={i} className={i === step ? 'on' : ''} />
        ))}
      </div>
    </div>
  );
}
