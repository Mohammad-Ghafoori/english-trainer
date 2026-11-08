import { Fragment, useEffect, useState, type ButtonHTMLAttributes, type ReactNode } from 'react';
import { useApp } from '../lib/store';
import { canSpeak, speak } from '../lib/speech';

// ---------------- Icons (inline SVG, no network needed) ----------------
const PATHS: Record<string, string> = {
  home: 'M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z',
  book: 'M4 4.5A2.5 2.5 0 0 1 6.5 2H20v17H6.5A2.5 2.5 0 0 0 4 21.5zM4 21.5A2.5 2.5 0 0 1 6.5 19H20v3H6.5',
  target: 'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zm0-4a6 6 0 1 0 0-12 6 6 0 0 0 0 12zm0-4a2 2 0 1 0 0-4 2 2 0 0 0 0 4z',
  award: 'M12 15a6 6 0 1 0 0-12 6 6 0 0 0 0 12zM8.2 13.9 7 22l5-3 5 3-1.2-8.1',
  user: 'M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z',
  speaker: 'M11 5 6 9H2v6h4l5 4zM15.5 8.5a5 5 0 0 1 0 7M19 5a10 10 0 0 1 0 14',
  slow: 'M11 5 6 9H2v6h4l5 4zM16 12h5',
  mic: 'M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3zM19 10v2a7 7 0 0 1-14 0v-2M12 19v3',
  stop: 'M6 6h12v12H6z',
  check: 'M20 6 9 17l-5-5',
  x: 'M18 6 6 18M6 6l12 12',
  arrow: 'M5 12h14M13 6l6 6-6 6',
  back: 'M19 12H5M11 18l-6-6 6-6',
  flame: 'M12 2c1 4 5 6 5 11a5 5 0 0 1-10 0c0-2 1-3.5 2-4.5 0 2 1 3 2 3 0-3-1-6 1-9.5z',
  clock: 'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM12 6v6l4 2',
  play: 'M7 4v16l13-8z',
  sparkle: 'M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M6 18l2.5-2.5M15.5 8.5 18 6',
  pen: 'M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z',
  ear: 'M6 8.5a6 6 0 1 1 12 0c0 3.5-3 4.5-3 7.5a3 3 0 0 1-6 0M9 9a3 3 0 0 1 6 0',
  info: 'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM12 16v-4M12 8h.01',
};

export function Icon({ name, size = 20 }: { name: keyof typeof PATHS | string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={PATHS[name] ?? PATHS.info} />
    </svg>
  );
}

// ---------------- Basic building blocks ----------------
type BtnProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'soft' | 'ghost' | 'danger' | 'good' | 'bad';
  size?: 'sm' | 'md' | 'lg';
  block?: boolean;
};

export function Btn({ variant = 'soft', size = 'md', block, className = '', ...rest }: BtnProps) {
  return <button type="button" className={`btn btn-${variant} btn-${size} ${block ? 'btn-block' : ''} ${className}`} {...rest} />;
}

export function Card({ children, className = '', onClick }: { children: ReactNode; className?: string; onClick?: () => void }) {
  return (
    <div className={`card ${onClick ? 'card-click' : ''} ${className}`} onClick={onClick} role={onClick ? 'button' : undefined} tabIndex={onClick ? 0 : undefined}>
      {children}
    </div>
  );
}

// English words and IPA inside Persian text are isolated so they keep their order (e.g. «/v/ همان «و» است»).
const LATIN_RUN =
  /(\/?[A-Za-zɐ-ʯæðθŋ][A-Za-z0-9ɐ-˿æðθŋ'’\-/.()+ ]*[A-Za-z0-9ɐ-˿æðθŋ/)]|[A-Za-z])/;

function bidiSplit(text: string): ReactNode[] {
  return text.split('\n').flatMap((line, li) => {
    const nodes: ReactNode[] = line.split(LATIN_RUN).map((p, i) => (i % 2 === 1 ? <bdi key={`${li}-${i}`} dir="ltr">{p}</bdi> : p));
    return li > 0 ? [<br key={`br-${li}`} />, ...nodes] : nodes;
  });
}

/** Persian text, right-to-left. */
export function Fa({ children, className = '', block }: { children: ReactNode; className?: string; block?: boolean }) {
  const Tag = block ? 'div' : 'span';
  return (
    <Tag className={`fa ${className}`} dir="rtl" lang="fa">
      {typeof children === 'string'
        ? bidiSplit(children)
        : Array.isArray(children)
          ? children.map((c, i) => (typeof c === 'string' ? <Fragment key={i}>{bidiSplit(c)}</Fragment> : c))
          : children}
    </Tag>
  );
}

/** Persian help box — hidden when "Persian help" is switched off in settings. */
export function Help({ children, force }: { children: ReactNode; force?: boolean }) {
  const { profile } = useApp();
  if (!profile.persianHelp && !force) return null;
  return (
    <Fa block className="help">
      {children}
    </Fa>
  );
}

/** English title with an optional Persian subtitle. */
export function Title({ en, fa, level = 1 }: { en: string; fa?: string; level?: 1 | 2 | 3 }) {
  const { profile } = useApp();
  const H = `h${level}` as 'h1';
  return (
    <div className={`title title-${level}`}>
      <H>{en}</H>
      {fa && profile.persianHelp && <Fa className="title-fa">{fa}</Fa>}
    </div>
  );
}

export function SpeakBtn({ text, label, slow, size = 'md', auto }: { text: string; label?: string; slow?: boolean; size?: 'sm' | 'md' | 'lg'; auto?: boolean }) {
  const [playing, setPlaying] = useState(false);
  const play = () => {
    setPlaying(true);
    speak(text, { rate: slow ? 0.7 : undefined, onEnd: () => setPlaying(false) });
  };
  useEffect(() => {
    if (auto) {
      const t = setTimeout(play, 150);
      return () => clearTimeout(t);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [auto, text]);
  if (!canSpeak) return null;
  return (
    <button
      type="button"
      className={`icon-btn icon-btn-${size} ${playing ? 'is-playing' : ''}`}
      onClick={(e) => {
        e.stopPropagation();
        play();
      }}
      aria-label={label ?? (slow ? `Play slowly: ${text}` : `Play: ${text}`)}
      title={slow ? 'Slow' : 'Listen'}
    >
      <Icon name={slow ? 'slow' : 'speaker'} size={size === 'lg' ? 26 : size === 'sm' ? 16 : 20} />
    </button>
  );
}

export function Progress({ value, max = 1, tone = 'accent' }: { value: number; max?: number; tone?: 'accent' | 'good' | 'warn' }) {
  const pct = max > 0 ? Math.max(0, Math.min(100, (value / max) * 100)) : 0;
  return (
    <div className="progress" role="progressbar" aria-valuenow={Math.round(pct)} aria-valuemin={0} aria-valuemax={100}>
      <div className={`progress-bar progress-${tone}`} style={{ width: `${pct}%` }} />
    </div>
  );
}

export function Segmented<T extends string | number>({ value, options, onChange }: { value: T; options: { value: T; label: ReactNode }[]; onChange: (v: T) => void }) {
  return (
    <div className="segmented" role="radiogroup">
      {options.map((o) => (
        <button key={String(o.value)} type="button" role="radio" aria-checked={o.value === value} className={o.value === value ? 'on' : ''} onClick={() => onChange(o.value)}>
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function Chip({ children, tone = 'plain' }: { children: ReactNode; tone?: 'plain' | 'accent' | 'good' | 'bad' | 'warn' }) {
  return <span className={`chip chip-${tone}`}>{children}</span>;
}

export function BackLink({ to, label = 'Back' }: { to: string; label?: string }) {
  return (
    <a className="back-link" href={`#/${to}`}>
      <Icon name="back" size={18} /> {label}
    </a>
  );
}

/** Highlights the target word inside an example sentence. */
export function Highlight({ text, word }: { text: string; word: string }) {
  const re = new RegExp(`\\b(${word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\w*)`, 'i');
  const parts = text.split(re);
  return (
    <>
      {parts.map((p, i) => (i % 2 === 1 ? <mark key={i}>{p}</mark> : <span key={i}>{p}</span>))}
    </>
  );
}

export function Empty({ children }: { children: ReactNode }) {
  return <div className="empty">{children}</div>;
}
