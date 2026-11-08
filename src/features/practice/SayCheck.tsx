import { useState } from 'react';
import { Btn, Fa, Icon, SpeakBtn } from '../../components/ui';
import { canRecognize, recognitionErrorFa, startRecognition, useRecorder, type RecognitionHandle } from '../../lib/speech';
import { normalize } from '../../lib/util';

export interface WordMark {
  word: string;
  ok: boolean;
}

/** Marks which words of the target were heard (in order), using longest common subsequence. */
export function compareWords(target: string, heard: string): { marks: WordMark[]; score: number } {
  const t = target.split(/\s+/).filter(Boolean);
  const tn = t.map(normalize);
  const h = normalize(heard).split(' ').filter(Boolean);
  const dp: number[][] = Array.from({ length: tn.length + 1 }, () => Array(h.length + 1).fill(0));
  for (let i = tn.length - 1; i >= 0; i--)
    for (let j = h.length - 1; j >= 0; j--) dp[i][j] = tn[i] === h[j] ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1]);
  const marks: WordMark[] = t.map((word) => ({ word, ok: false }));
  let i = 0;
  let j = 0;
  while (i < tn.length && j < h.length) {
    if (tn[i] === h[j]) {
      marks[i].ok = true;
      i++;
      j++;
    } else if (dp[i + 1][j] >= dp[i][j + 1]) i++;
    else j++;
  }
  const real = marks.filter((m) => normalize(m.word));
  return { marks, score: real.length ? real.filter((m) => m.ok).length / real.length : 0 };
}

/**
 * Speaking check: the browser's speech recognition tells you what it understood.
 * If recognition is not available (offline, Firefox, blocked), you record yourself and compare with the model.
 */
export function SayCheck({ target, onResult, compact }: { target: string; onResult?: (ok: boolean) => void; compact?: boolean }) {
  const [listening, setListening] = useState<RecognitionHandle | null>(null);
  const [heard, setHeard] = useState<string | null>(null);
  const [result, setResult] = useState<{ marks: WordMark[]; score: number } | null>(null);
  const [error, setError] = useState<string | undefined>();
  const [mode, setMode] = useState<'recognize' | 'record'>(canRecognize ? 'recognize' : 'record');
  const rec = useRecorder();
  const isSentence = target.trim().includes(' ');

  async function say() {
    setHeard(null);
    setResult(null);
    setError(undefined);
    const h = startRecognition({ onText: (t) => setHeard(t) });
    setListening(h);
    const r = await h.result;
    setListening(null);
    if (r.error) {
      setError(r.error);
      if (r.error === 'network' || r.error === 'not-supported' || r.error === 'start-failed') setMode('record');
      return;
    }
    // Pick the recognition alternative that best matches the target.
    let best = { marks: [] as WordMark[], score: 0 };
    let bestText = r.text;
    for (const alt of r.alternatives.length ? r.alternatives : [r.text]) {
      const c = compareWords(target, alt);
      if (c.score > best.score || !best.marks.length) {
        best = c;
        bestText = alt;
      }
    }
    setHeard(bestText);
    setResult(best);
    onResult?.(best.score >= (isSentence ? 0.8 : 1));
  }

  return (
    <div className={`saycheck ${compact ? 'saycheck-compact' : ''}`}>
      {mode === 'recognize' ? (
        <>
          <div className="row">
            <SpeakBtn text={target} />
            <SpeakBtn text={target} slow />
            {listening ? (
              <Btn variant="danger" onClick={() => listening.stop()}>
                <Icon name="stop" size={18} /> Stop
              </Btn>
            ) : (
              <Btn variant="primary" onClick={say}>
                <Icon name="mic" size={18} /> Say it
              </Btn>
            )}
            <Btn variant="ghost" size="sm" onClick={() => setMode('record')}>
              Record instead
            </Btn>
          </div>
          {listening && <div className="muted small pulse">Listening… {heard}</div>}
          {result && (
            <div className={`feedback ${result.score >= (isSentence ? 0.8 : 1) ? 'good' : 'bad'}`}>
              <div className="small muted">The computer heard:</div>
              <div lang="en" className="heard">“{heard || '…'}”</div>
              {isSentence ? (
                <p lang="en" className="marks">
                  {result.marks.map((m, i) => (
                    <span key={i} className={m.ok ? 'm-ok' : 'm-miss'}>
                      {m.word}{' '}
                    </span>
                  ))}
                </p>
              ) : (
                <strong>{result.score >= 1 ? 'Clear! ✓' : 'Try again — listen to the model first.'}</strong>
              )}
            </div>
          )}
          {error && <Fa block className="help warn">{recognitionErrorFa(error)}</Fa>}
        </>
      ) : (
        <>
          <div className="row">
            <SpeakBtn text={target} />
            <SpeakBtn text={target} slow />
            {rec.recording ? (
              <Btn variant="danger" onClick={rec.stop}>
                <Icon name="stop" size={18} /> Stop
              </Btn>
            ) : (
              <Btn variant="primary" onClick={rec.start}>
                <Icon name="mic" size={18} /> Record
              </Btn>
            )}
            {canRecognize && (
              <Btn variant="ghost" size="sm" onClick={() => setMode('recognize')}>
                Use speech check
              </Btn>
            )}
          </div>
          {rec.recording && <div className="muted small pulse">Recording…</div>}
          {rec.url && (
            <div className="compare">
              <div className="small muted">Listen to the model, then to yourself. Do they sound the same?</div>
              <audio src={rec.url} controls />
            </div>
          )}
          {rec.error && <Fa block className="help warn">{rec.error}</Fa>}
          {error && !rec.url && <Fa block className="help warn">{recognitionErrorFa(error)}</Fa>}
        </>
      )}
    </div>
  );
}
