import { useState } from 'react';
import { Btn, Card, Fa, Icon } from '../components/ui';
import { lastUsername, login, loginErrorFa } from '../lib/auth';

/** Login screen. Accounts are created by the app owner (no public sign-up). */
export function Login({ relogin }: { relogin?: boolean }) {
  const [username, setUsername] = useState(lastUsername);
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!username.trim() || !password) return;
    setBusy(true);
    setError(null);
    try {
      await login(username, password);
      if (relogin) location.hash = '/today';
    } catch (err) {
      setError(loginErrorFa(err));
      setBusy(false);
    }
  }

  return (
    <div className="onboarding">
      <Card className="stack welcome">
        <img src="./icon.svg" alt="" width={64} height={64} />
        <h1>English Trainer</h1>
        <p className="muted">{relogin ? 'Please log in again to keep syncing.' : 'Log in to start learning.'}</p>
        <Fa block className="help">
          {relogin
            ? 'نشست شما منقضی شده است. دوباره وارد شوید؛ پیشرفت شما روی این دستگاه حفظ می‌شود.'
            : 'با نام کاربری و رمزی که از صاحب برنامه گرفته‌اید وارد شوید. پیشرفت شما روی همه‌ی دستگاه‌هایتان همگام می‌شود.'}
        </Fa>
        <form className="stack login-form" onSubmit={submit}>
          <label className="field">
            <span>Username</span>
            <input
              className="input"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoCapitalize="off"
              autoCorrect="off"
              autoComplete="username"
              spellCheck={false}
              required
              dir="ltr"
            />
          </label>
          <label className="field">
            <span>Password</span>
            <input className="input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" required dir="ltr" />
          </label>
          {error && (
            <Fa block className="help warn">
              {error}
            </Fa>
          )}
          <Btn variant="primary" size="lg" block type="submit" disabled={busy}>
            {busy ? 'Loading your progress…' : 'Log in'} {!busy && <Icon name="arrow" size={18} />}
          </Btn>
        </form>
        {relogin && (
          <a className="small muted" href="#/today">
            Continue offline
          </a>
        )}
      </Card>
    </div>
  );
}
