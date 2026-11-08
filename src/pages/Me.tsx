import { useMemo, useRef, useState } from 'react';
import { LEVELS, LEVEL_INFO, type Level } from '../types';
import { Btn, Card, Chip, Fa, Icon, Progress, Segmented, Title } from '../components/ui';
import { ALL_WORDS, levelStats, TRAPS, vocabLevel } from '../data/words';
import { SOUND_SETS } from '../data/sounds';
import { accuracy } from '../lib/plan';
import { exportJSON, importJSON, resetAll, streak, updateProfile, useApp, type Accent, type Theme } from '../lib/store';
import { canRecognize, canSpeak, speak, useVoices } from '../lib/speech';
import { addDays, dayKey, formatDuration } from '../lib/util';
import { href } from '../lib/router';
import { cloudEnabled, displayName } from '../lib/supabase';
import { changePassword, logout, useAccountEmail } from '../lib/auth';
import { syncNow, useSyncStatus } from '../lib/sync';
import { SyncBadge } from '../components/SyncBadge';

export function Me() {
  const s = useApp();
  const stats = useMemo(() => levelStats(s), [s]);
  const vl = vocabLevel(s);
  const totalSeconds = Object.values(s.days).reduce((n, d) => n + d.seconds, 0);
  const learned = LEVELS.reduce((n, l) => n + stats[l].known + stats[l].learning, 0);
  const known = LEVELS.reduce((n, l) => n + stats[l].known, 0);
  const last14 = Array.from({ length: 14 }, (_, i) => addDays(dayKey(), i - 13));
  const maxMin = Math.max(10, ...last14.map((k) => (s.days[k]?.seconds ?? 0) / 60));

  return (
    <div className="stack">
      <Title en="Progress" fa="پیشرفت" />
      <div className="stats-row">
        <div className="stat"><b>{streak(s)}</b><span>day streak</span></div>
        <div className="stat"><b>{learned}</b><span>words learned</span></div>
        <div className="stat"><b>{known}</b><span>strong words</span></div>
        <div className="stat"><b>{formatDuration(totalSeconds)}</b><span>total time</span></div>
      </div>

      <Card>
        <div className="row-between">
          <h3>Study time · last 14 days</h3>
          <span className="small muted">minutes</span>
        </div>
        <div className="bars">
          {last14.map((k) => {
            const m = (s.days[k]?.seconds ?? 0) / 60;
            return (
              <div key={k} className="bar-col" title={`${k}: ${Math.round(m)} min`}>
                <div className="bar" style={{ height: `${(m / maxMin) * 100}%` }} />
                <span className="tiny muted">{Number(k.slice(8))}</span>
              </div>
            );
          })}
        </div>
      </Card>

      <Card>
        <h3>Vocabulary by level</h3>
        <div className="small muted">Vocabulary level: {vl ? `${vl} · ${LEVEL_INFO[vl].name}` : 'starting'} · {ALL_WORDS.length} words in the app</div>
        <div className="stack">
          {LEVELS.map((l) => (
            <div key={l}>
              <div className="row-between small">
                <span>
                  <b>{l}</b> {LEVEL_INFO[l].name} · IELTS ≈ {LEVEL_INFO[l].ielts}
                </span>
                <span className="muted">
                  {stats[l].known} strong · {stats[l].learning} learning / {stats[l].total}
                </span>
              </div>
              <div className="stacked">
                <div className="stacked-good" style={{ width: `${(stats[l].known / Math.max(1, stats[l].total)) * 100}%` }} />
                <div className="stacked-accent" style={{ width: `${(stats[l].learning / Math.max(1, stats[l].total)) * 100}%` }} />
              </div>
            </div>
          ))}
        </div>
        <Fa block className="small muted">
          مدت تقریبی لازم برای رسیدن به هر سطح از صفر (با معلم، طبق کمبریج): A2 ≈ ۲۰۰ ساعت، B1 ≈ ۴۰۰، B2 ≈ ۶۰۰، C1 ≈ ۸۰۰ ساعت. یعنی برای رسیدن به آیلتس ۶ تا ۷ باید ماه‌ها هر روز تمرین کنید — پیوستگی مهم‌ترین چیز است.
        </Fa>
      </Card>

      <Card>
        <h3>Persian traps</h3>
        <div className="mini-grid">
          {TRAPS.map((t) => {
            const a = accuracy(s.traps[t.id]);
            return (
              <a key={t.id} href={href(`practice/traps/${t.id}`)} className="mini">
                <span className="small" lang="en">{t.title}</span>
                {a === null ? <span className="tiny muted">—</span> : <Progress value={a} tone={a >= 0.8 ? 'good' : 'warn'} />}
              </a>
            );
          })}
        </div>
        <h3>Sounds</h3>
        <div className="mini-grid">
          {SOUND_SETS.filter((x) => x.pairs.length).map((x) => {
            const a = accuracy(s.sounds[x.id]);
            return (
              <a key={x.id} href={href(`practice/sounds/${x.id}`)} className="mini">
                <span className="small" lang="en">{x.title}</span>
                {a === null ? <span className="tiny muted">—</span> : <Progress value={a} tone={a >= 0.85 ? 'good' : 'warn'} />}
              </a>
            );
          })}
        </div>
      </Card>

      <a className="card card-click method-link" href={href('method')}>
        <Icon name="info" />
        <div>
          <strong>How this app teaches (and how to learn best)</strong>
          <Fa block className="small muted">روش یادگیری و دلایل علمی آن</Fa>
        </div>
      </a>

      <Settings />
    </div>
  );
}

function Account() {
  const email = useAccountEmail();
  const sync = useSyncStatus();
  const [pw, setPw] = useState('');
  const [pwMsg, setPwMsg] = useState('');
  const [showPw, setShowPw] = useState(false);
  const ago = sync.lastSync ? Math.max(0, Math.round((Date.now() - sync.lastSync) / 60000)) : null;

  async function savePassword(e: React.FormEvent) {
    e.preventDefault();
    if (pw.length < 6) {
      setPwMsg('At least 6 characters.');
      return;
    }
    try {
      await changePassword(pw);
      setPw('');
      setShowPw(false);
      setPwMsg('Password changed ✓');
    } catch (err) {
      setPwMsg((err as Error).message);
    }
  }

  return (
    <>
      <Title en="Account" fa="حساب کاربری" level={2} />
      <Card>
        <div className="row-between">
          <div>
            <div className="small muted">Logged in as</div>
            <strong className="account-name">{displayName(email) || '…'}</strong>
          </div>
          <SyncBadge status={sync} />
        </div>
        <Fa block className="small muted">
          پیشرفت شما خودکار در فضای ابری ذخیره می‌شود و روی همه‌ی دستگاه‌هایی که با این حساب وارد شوید یکسان است. بدون اینترنت هم می‌توانید تمرین کنید؛ بعداً همگام می‌شود.
          {ago !== null && ` (آخرین همگام‌سازی: ${ago === 0 ? 'همین الان' : `${ago} دقیقه پیش`})`}
        </Fa>
        <div className="row">
          <Btn onClick={() => void syncNow()} disabled={sync.state === 'syncing'}>
            Sync now
          </Btn>
          <Btn variant="ghost" onClick={() => setShowPw(!showPw)}>
            Change password
          </Btn>
          <Btn variant="danger" onClick={() => void logout()}>
            Log out
          </Btn>
        </div>
        {showPw && (
          <form className="type-row" onSubmit={savePassword}>
            <input className="input" type="password" placeholder="New password" value={pw} onChange={(e) => setPw(e.target.value)} autoComplete="new-password" dir="ltr" />
            <Btn variant="primary" type="submit">
              Save
            </Btn>
          </form>
        )}
        {pwMsg && <Chip tone="accent">{pwMsg}</Chip>}
      </Card>
    </>
  );
}

function Settings() {
  const s = useApp();
  const p = s.profile;
  const voices = useVoices(p.accent);
  const fileRef = useRef<HTMLInputElement>(null);
  const [msg, setMsg] = useState('');
  const set = (patch: Partial<typeof p>) => updateProfile(patch);

  function download() {
    const blob = new Blob([exportJSON()], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `english-trainer-progress-${dayKey()}.json`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  }

  async function upload(file: File) {
    try {
      const ok = importJSON(await file.text());
      setMsg(ok ? 'Progress imported ✓' : 'This file is not an English Trainer backup.');
    } catch {
      setMsg('Could not read this file.');
    }
  }

  return (
    <>
      {cloudEnabled && <Account />}
      <Title en="Settings" fa="تنظیمات" level={2} />
      <Card>
        <div className="setting">
          <div>
            <strong>New words per day</strong>
            <Fa block className="small muted">هر کلمه‌ی جدید حدود ۱ دقیقه وقت می‌گیرد، به‌علاوه‌ی مرورهای روزهای بعد.</Fa>
          </div>
          <Segmented value={p.dailyNew} onChange={(v) => set({ dailyNew: v })} options={[5, 10, 15, 20, 30].map((n) => ({ value: n, label: String(n) }))} />
        </div>
        <div className="setting">
          <div>
            <strong>Start level for new words</strong>
            <Fa block className="small muted">کلمه‌های جدید از این سطح شروع می‌شوند و خودکار بالا می‌روند.</Fa>
          </div>
          <Segmented value={p.level} onChange={(v: Level) => set({ level: v })} options={LEVELS.map((l) => ({ value: l, label: l }))} />
        </div>
        <div className="setting">
          <div>
            <strong>Persian help</strong>
            <Fa block className="small muted">نمایش توضیح و ترجمه‌ی فارسی. وقتی پیشرفت کردید خاموشش کنید.</Fa>
          </div>
          <Segmented value={p.persianHelp ? 'on' : 'off'} onChange={(v) => set({ persianHelp: v === 'on' })} options={[{ value: 'on', label: 'On' }, { value: 'off', label: 'Off' }]} />
        </div>
        <div className="setting">
          <div>
            <strong>IELTS target band</strong>
          </div>
          <Segmented value={p.targetBand} onChange={(v) => set({ targetBand: v })} options={[6, 6.5, 7, 7.5, 8].map((n) => ({ value: n, label: String(n) }))} />
        </div>
        <div className="setting">
          <div>
            <strong>Exam date</strong> <span className="small muted">(optional)</span>
          </div>
          <input type="date" className="input input-sm" value={p.examDate ?? ''} onChange={(e) => set({ examDate: e.target.value || null })} />
        </div>
        <div className="setting">
          <div>
            <strong>Theme</strong>
          </div>
          <Segmented value={p.theme} onChange={(v: Theme) => set({ theme: v })} options={[{ value: 'auto', label: 'Auto' }, { value: 'light', label: 'Light' }, { value: 'dark', label: 'Dark' }]} />
        </div>
      </Card>

      <Card>
        <h3>Voice</h3>
        {!canSpeak && <Fa block className="help warn">این مرورگر صدای انگلیسی ندارد.</Fa>}
        <div className="setting">
          <strong>Accent</strong>
          <Segmented value={p.accent} onChange={(v: Accent) => set({ accent: v, voiceURI: null })} options={[{ value: 'en-GB', label: 'British' }, { value: 'en-US', label: 'American' }, { value: 'any', label: 'Any' }]} />
        </div>
        <div className="setting">
          <strong>Voice</strong>
          <div className="row">
            <select className="input input-sm" value={p.voiceURI ?? ''} onChange={(e) => set({ voiceURI: e.target.value || null })}>
              <option value="">Automatic</option>
              {voices.map((v) => (
                <option key={v.voiceURI} value={v.voiceURI}>
                  {v.name} ({v.lang})
                </option>
              ))}
            </select>
            <Btn size="sm" onClick={() => speak('Hello! This is how I sound. Let’s practise English together.')}>
              <Icon name="speaker" size={16} /> Test
            </Btn>
          </div>
        </div>
        <div className="setting">
          <strong>Speed</strong>
          <Segmented value={p.rate} onChange={(v) => set({ rate: v })} options={[{ value: 0.8, label: 'Slow' }, { value: 0.95, label: 'Normal' }, { value: 1.1, label: 'Fast' }]} />
        </div>
        <Fa block className="small muted">
          {voices.length <= 2
            ? 'صداهای انگلیسی کمی روی این دستگاه نصب است. در ویندوز: Settings › Time & Language › Speech › Add voices. در اندروید: Settings › Text-to-speech › Google › Install voice data. صداهای بیشتر = تمرین شنیداری بهتر.'
            : `${voices.length} صدای انگلیسی پیدا شد.`}{' '}
          {canRecognize ? 'تشخیص گفتار در این مرورگر فعال است (به اینترنت نیاز دارد).' : 'این مرورگر تشخیص گفتار ندارد؛ برای تمرین صحبت از Chrome یا Edge استفاده کنید.'}
        </Fa>
      </Card>

      <Card>
        <h3>Your data</h3>
        <Fa block className="small muted">
          {cloudEnabled
            ? 'پیشرفت شما خودکار همگام می‌شود. «Export» یک فایل پشتیبان روی همین دستگاه می‌سازد. «Reset everything» پیشرفت را روی همه‌ی دستگاه‌های این حساب پاک می‌کند.'
            : 'پیشرفت شما فقط روی همین دستگاه ذخیره می‌شود. برای انتقال بین گوشی و کامپیوتر: اینجا «Export» بزنید، فایل را به دستگاه دیگر بفرستید و آنجا «Import» کنید.'}
        </Fa>
        <div className="row">
          <Btn onClick={download}>
            Export progress
          </Btn>
          <Btn onClick={() => fileRef.current?.click()}>Import progress</Btn>
          <input ref={fileRef} type="file" accept="application/json,.json" hidden onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])} />
          <Btn
            variant="danger"
            onClick={() => {
              if (confirm(cloudEnabled ? 'Delete ALL progress for this account, on every device? This cannot be undone. (Export a backup first.)' : 'Delete ALL progress on this device? This cannot be undone. (Export a backup first.)')) resetAll();
            }}
          >
            Reset everything
          </Btn>
        </div>
        {msg && <Chip tone="accent">{msg}</Chip>}
      </Card>
    </>
  );
}
