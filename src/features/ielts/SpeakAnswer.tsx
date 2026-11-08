import { useEffect, useRef, useState } from 'react';
import { Btn, Fa, Icon, SpeakBtn } from '../../components/ui';
import { canRecognize, recognitionErrorFa, startRecognition, useRecorder, type RecognitionHandle } from '../../lib/speech';
import { countWords } from '../../lib/util';

const fmt = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;

/**
 * Answer a speaking question out loud: records your voice (works offline) and,
 * if available, shows a transcript of what the computer understood plus your speaking speed.
 */
export function SpeakAnswer({
  question,
  maxSeconds = 45,
  prepSeconds = 0,
  onDone,
  speakQuestion = true,
}: {
  question: string;
  maxSeconds?: number;
  prepSeconds?: number;
  onDone?: () => void;
  speakQuestion?: boolean;
}) {
  const rec = useRecorder();
  const [phase, setPhase] = useState<'ready' | 'prep' | 'speaking' | 'done'>('ready');
  const [secs, setSecs] = useState(0);
  const [transcript, setTranscript] = useState('');
  const [useTranscript, setUseTranscript] = useState(canRecognize);
  const [srError, setSrError] = useState<string | undefined>();
  const [notes, setNotes] = useState('');
  const speakingRef = useRef(false);
  const handleRef = useRef<RecognitionHandle | null>(null);
  const timerRef = useRef<number | undefined>(undefined);

  useEffect(
    () => () => {
      speakingRef.current = false;
      handleRef.current?.stop();
      window.clearInterval(timerRef.current);
    },
    [],
  );

  async function runRecognition() {
    let prefix = '';
    while (speakingRef.current) {
      const h = startRecognition({ continuous: true, onText: (t) => setTranscript((prefix + ' ' + t).trim()) });
      handleRef.current = h;
      const r = await h.result;
      prefix = (prefix + ' ' + r.text).trim();
      setTranscript(prefix);
      if (r.error) {
        setSrError(r.error);
        break;
      }
    }
  }

  function startTimer(limit: number, onEnd: () => void) {
    window.clearInterval(timerRef.current);
    setSecs(0);
    const t0 = Date.now();
    timerRef.current = window.setInterval(() => {
      const s = (Date.now() - t0) / 1000;
      setSecs(s);
      if (s >= limit) {
        window.clearInterval(timerRef.current);
        onEnd();
      }
    }, 250);
  }

  function startPrep() {
    setPhase('prep');
    startTimer(prepSeconds, () => startSpeaking());
  }

  async function startSpeaking() {
    setTranscript('');
    setSrError(undefined);
    await rec.start();
    setPhase('speaking');
    speakingRef.current = true;
    if (useTranscript) runRecognition();
    startTimer(maxSeconds, stop);
  }

  function stop() {
    speakingRef.current = false;
    window.clearInterval(timerRef.current);
    handleRef.current?.stop();
    rec.stop();
    setPhase('done');
  }

  const words = countWords(transcript);
  const wpm = secs > 5 ? Math.round(words / (secs / 60)) : 0;

  return (
    <div className="stack">
      {speakQuestion && (
        <div className="question-box">
          <p lang="en" className="question">{question}</p>
          <SpeakBtn text={question} auto={phase === 'ready'} key={question} />
        </div>
      )}

      {phase === 'ready' && (
        <div className="row">
          <Btn variant="primary" size="lg" onClick={prepSeconds ? startPrep : startSpeaking}>
            <Icon name={prepSeconds ? 'clock' : 'mic'} size={18} /> {prepSeconds ? `Prepare (${prepSeconds / 60} min)` : 'Start answering'}
          </Btn>
          {canRecognize && (
            <label className="check small">
              <input type="checkbox" checked={useTranscript} onChange={(e) => setUseTranscript(e.target.checked)} /> Show transcript
            </label>
          )}
        </div>
      )}

      {phase === 'prep' && (
        <div className="stack">
          <div className="timer">Preparation {fmt(Math.max(0, prepSeconds - secs))}</div>
          <textarea className="input" rows={4} placeholder="Write short notes (key words only)…" value={notes} onChange={(e) => setNotes(e.target.value)} lang="en" />
          <Btn variant="primary" onClick={startSpeaking}>
            <Icon name="mic" size={18} /> Start speaking now
          </Btn>
        </div>
      )}

      {phase === 'speaking' && (
        <div className="stack">
          <div className="timer recording">
            <span className="rec-dot" /> {fmt(secs)} / {fmt(maxSeconds)}
          </div>
          {notes && <pre className="notes">{notes}</pre>}
          {useTranscript && <p className="live-transcript" lang="en">{transcript || '…'}</p>}
          <Btn variant="danger" size="lg" onClick={stop}>
            <Icon name="stop" size={18} /> Stop
          </Btn>
        </div>
      )}

      {phase === 'done' && (
        <div className="stack">
          {rec.url && <audio src={rec.url} controls />}
          {useTranscript && transcript && (
            <div className="feedback">
              <div className="small muted">What the computer understood:</div>
              <p lang="en">{transcript}</p>
              <div className="row small">
                <span>{words} words</span>
                <span>·</span>
                <span>{fmt(secs)}</span>
                {wpm > 0 && (
                  <>
                    <span>·</span>
                    <span>{wpm} words/min</span>
                  </>
                )}
              </div>
              {wpm > 0 && (
                <Fa block className="small">
                  {wpm < 80
                    ? 'سرعت شما پایین است. برای نمره‌ی ۶ به بالا سعی کنید بدون مکث‌های طولانی صحبت کنید.'
                    : wpm > 170
                      ? 'خیلی سریع صحبت کردید؛ کمی آرام‌تر و واضح‌تر بگویید.'
                      : 'سرعت صحبت شما خوب و طبیعی است.'}
                </Fa>
              )}
            </div>
          )}
          {srError && <Fa block className="help warn">{recognitionErrorFa(srError)}</Fa>}
          {rec.error && <Fa block className="help warn">{rec.error}</Fa>}
          <div className="row">
            <Btn
              onClick={() => {
                rec.clear();
                setPhase('ready');
              }}
            >
              Try again
            </Btn>
            {onDone && (
              <Btn variant="primary" onClick={onDone}>
                Next <Icon name="arrow" size={18} />
              </Btn>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export const SPEAKING_CRITERIA = [
  { en: 'Fluency: I kept talking without long pauses and connected my ideas (and, because, so, however).', fa: 'روانی: بدون مکث طولانی صحبت کردم و ایده‌ها را به هم وصل کردم.' },
  { en: 'Vocabulary: I used some less common words or collocations, not only simple words.', fa: 'واژگان: از چند کلمه یا ترکیب کمتر رایج استفاده کردم.' },
  { en: 'Grammar: I used different tenses and some longer sentences (if, when, which, although).', fa: 'دستور: زمان‌های مختلف و جمله‌های بلندتر به کار بردم.' },
  { en: 'Pronunciation: th, w/v, word endings (-s, -ed) and word stress were clear.', fa: 'تلفظ: th، w/v، انتهای کلمه‌ها (-s، -ed) و تکیه‌ی کلمه واضح بود.' },
  { en: 'I answered the question fully and gave reasons or examples.', fa: 'به سؤال کامل جواب دادم و دلیل یا مثال آوردم.' },
];
