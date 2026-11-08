import type { SyncStatus } from '../lib/sync';

const LABELS: Record<string, { text: string; cls: string }> = {
  idle: { text: 'Synced', cls: 'ok' },
  syncing: { text: 'Syncing…', cls: 'busy' },
  offline: { text: 'Offline — will sync later', cls: 'warn' },
  auth: { text: 'Log in again to sync', cls: 'bad' },
  error: { text: 'Sync problem', cls: 'bad' },
};

/** Small status pill: Synced / Syncing / Offline / Log in again. */
export function SyncBadge({ status }: { status: SyncStatus }) {
  const m = LABELS[status.state];
  if (!m) return null;
  return (
    <span className={`sync-badge sync-${m.cls}`} title={status.message}>
      <span className="sync-dot" /> {m.text}
    </span>
  );
}
