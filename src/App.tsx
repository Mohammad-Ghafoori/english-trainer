import { useEffect } from 'react';
import { Fa, Icon } from './components/ui';
import { flushActivity, noteActivity, streak, useApp } from './lib/store';
import { href, useRoute } from './lib/router';
import { Today } from './pages/Today';
import { Words } from './pages/Words';
import { Practice } from './pages/Practice';
import { Ielts } from './pages/Ielts';
import { Me } from './pages/Me';
import { Method } from './pages/Method';
import { Onboarding } from './pages/Onboarding';
import { Login } from './pages/Login';
import { cloudEnabled } from './lib/supabase';
import { startSync, useSyncStatus } from './lib/sync';
import { SyncBadge } from './components/SyncBadge';

const NAV = [
  { id: 'today', en: 'Today', fa: 'امروز', icon: 'home' },
  { id: 'words', en: 'Words', fa: 'کلمه‌ها', icon: 'book' },
  { id: 'practice', en: 'Practice', fa: 'تمرین', icon: 'target' },
  { id: 'ielts', en: 'IELTS', fa: 'آیلتس', icon: 'award' },
  { id: 'me', en: 'Progress', fa: 'پیشرفت', icon: 'user' },
];

export default function App() {
  const s = useApp();
  const route = useRoute();
  const [page, ...rest] = route;
  const sync = useSyncStatus();

  // Logged in (now or earlier on this device): keep progress in sync with the cloud.
  useEffect(() => {
    if (cloudEnabled && s.owner) void startSync(s.owner);
  }, [s.owner]);

  // Theme
  useEffect(() => {
    const root = document.documentElement;
    if (s.profile.theme === 'auto') root.removeAttribute('data-theme');
    else root.setAttribute('data-theme', s.profile.theme);
  }, [s.profile.theme]);

  // Count active study time.
  useEffect(() => {
    const onAct = () => noteActivity();
    const onHide = () => document.visibilityState === 'hidden' && flushActivity();
    window.addEventListener('pointerdown', onAct);
    window.addEventListener('keydown', onAct);
    document.addEventListener('visibilitychange', onHide);
    window.addEventListener('pagehide', flushActivity);
    return () => {
      window.removeEventListener('pointerdown', onAct);
      window.removeEventListener('keydown', onAct);
      document.removeEventListener('visibilitychange', onHide);
      window.removeEventListener('pagehide', flushActivity);
    };
  }, []);

  if (cloudEnabled && !s.owner) return <Login />;
  if (cloudEnabled && page === 'login') return <Login relogin />;
  if (!s.profile.onboarded) return <Onboarding />;

  const active = page ?? 'today';
  let content;
  switch (active) {
    case 'words':
      content = <Words sub={rest[0]} />;
      break;
    case 'practice':
      content = <Practice route={rest} />;
      break;
    case 'ielts':
      content = <Ielts route={rest} />;
      break;
    case 'me':
      content = <Me />;
      break;
    case 'method':
      content = <Method />;
      break;
    default:
      content = <Today />;
  }

  const st = streak(s);
  return (
    <div className="app">
      <nav className="sidebar" aria-label="Main">
        <a className="brand" href={href('today')}>
          <img src="./icon.svg" alt="" width={32} height={32} />
          <span>English Trainer</span>
        </a>
        {NAV.map((n) => (
          <a key={n.id} href={href(n.id)} className={`nav-item ${active === n.id || (active === 'method' && n.id === 'me') ? 'on' : ''}`}>
            <Icon name={n.icon} />
            <span>{n.en}</span>
            {s.profile.persianHelp && <Fa className="nav-fa">{n.fa}</Fa>}
          </a>
        ))}
        <div className="sidebar-foot small muted">
          <SyncBadge status={sync} />
          <span>
            <Icon name="flame" size={14} /> {st} day streak
          </span>
        </div>
      </nav>
      <main className="main">
        {sync.state === 'auth' && (
          <a className="banner" href={href('login')}>
            <Icon name="info" size={18} /> Your login expired. Tap here to log in again — your progress on this device is safe.
          </a>
        )}
        {content}
      </main>
      <nav className="tabbar" aria-label="Main">
        {NAV.map((n) => (
          <a key={n.id} href={href(n.id)} className={`tab ${active === n.id || (active === 'method' && n.id === 'me') ? 'on' : ''}`}>
            <Icon name={n.icon} size={22} />
            <span>{n.en}</span>
          </a>
        ))}
      </nav>
    </div>
  );
}
