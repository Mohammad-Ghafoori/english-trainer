import { useEffect, useRef, useState } from 'react';
import { getState, type Accent } from './store';

// ---------------- Text to speech (built into the browser / operating system) ----------------

let voices: SpeechSynthesisVoice[] = [];
const voiceListeners = new Set<() => void>();

const langOf = (v: SpeechSynthesisVoice) => v.lang.replace('_', '-').toLowerCase();

function loadVoices() {
  if (!('speechSynthesis' in window)) return;
  voices = speechSynthesis.getVoices().filter((v) => langOf(v).startsWith('en'));
  voiceListeners.forEach((l) => l());
}

if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
  loadVoices();
  speechSynthesis.addEventListener?.('voiceschanged', loadVoices);
}

export const canSpeak = typeof window !== 'undefined' && 'speechSynthesis' in window;

const quality = (v: SpeechSynthesisVoice) => (/natural|neural|google|premium|enhanced/i.test(v.name) ? 0 : 1);

export function englishVoices(accent: Accent = 'any'): SpeechSynthesisVoice[] {
  const list = accent === 'any' ? voices : voices.filter((v) => langOf(v) === accent.toLowerCase());
  return [...(list.length ? list : voices)].sort((a, b) => quality(a) - quality(b) || a.name.localeCompare(b.name));
}

export function useVoices(accent: Accent = 'any'): SpeechSynthesisVoice[] {
  const [, force] = useState(0);
  useEffect(() => {
    const l = () => force((n) => n + 1);
    voiceListeners.add(l);
    return () => {
      voiceListeners.delete(l);
    };
  }, []);
  return englishVoices(accent);
}

export function defaultVoice(): SpeechSynthesisVoice | null {
  const { voiceURI, accent } = getState().profile;
  if (voiceURI) {
    const v = voices.find((x) => x.voiceURI === voiceURI);
    if (v) return v;
  }
  return englishVoices(accent)[0] ?? null;
}

export interface SpeakOptions {
  voice?: SpeechSynthesisVoice | null;
  rate?: number;
  onEnd?: () => void;
}

export function speak(text: string, opts: SpeakOptions = {}): void {
  if (!canSpeak) {
    opts.onEnd?.();
    return;
  }
  speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  const voice = opts.voice === undefined ? defaultVoice() : opts.voice;
  if (voice) {
    u.voice = voice;
    u.lang = voice.lang;
  } else {
    u.lang = getState().profile.accent === 'en-US' ? 'en-US' : 'en-GB';
  }
  u.rate = opts.rate ?? getState().profile.rate;
  u.onend = () => opts.onEnd?.();
  u.onerror = () => opts.onEnd?.();
  speechSynthesis.speak(u);
}

export function stopSpeaking() {
  if (canSpeak) speechSynthesis.cancel();
}

/** Different voices for listening training (hearing many speakers helps you learn sounds). */
export function trainingVoices(): SpeechSynthesisVoice[] {
  return englishVoices('any');
}

// ---------------- Speech recognition (Chrome, Edge, Android; needs internet) ----------------

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const SR: any = typeof window !== 'undefined' ? (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition : null;

export const canRecognize = !!SR;

export interface RecognitionResult {
  text: string;
  alternatives: string[];
  error?: string;
}

export interface RecognitionHandle {
  stop(): void;
  result: Promise<RecognitionResult>;
}

export function startRecognition(opts: { continuous?: boolean; onText?: (t: string) => void } = {}): RecognitionHandle {
  if (!SR) {
    return { stop() {}, result: Promise.resolve({ text: '', alternatives: [], error: 'not-supported' }) };
  }
  const rec = new SR();
  const accent = getState().profile.accent;
  rec.lang = accent === 'any' ? 'en-US' : accent;
  rec.continuous = !!opts.continuous;
  rec.interimResults = true;
  rec.maxAlternatives = 5;
  let finalText = '';
  let alternatives: string[] = [];
  let error: string | undefined;

  const result = new Promise<RecognitionResult>((resolve) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    rec.onresult = (e: any) => {
      let interim = '';
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const r = e.results[i];
        if (r.isFinal) {
          finalText += r[0].transcript + ' ';
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          alternatives.push(...Array.from(r as ArrayLike<any>).map((a) => a.transcript as string));
        } else interim += r[0].transcript;
      }
      opts.onText?.((finalText + interim).trim());
    };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    rec.onerror = (e: any) => {
      if (e.error !== 'no-speech' && e.error !== 'aborted') error = e.error;
    };
    rec.onend = () => {
      const text = finalText.trim();
      if (!alternatives.length && text) alternatives = [text];
      resolve({ text, alternatives, error });
    };
  });

  try {
    rec.start();
  } catch {
    return { stop() {}, result: Promise.resolve({ text: '', alternatives: [], error: 'start-failed' }) };
  }
  return { stop: () => rec.stop(), result };
}

export function recognitionErrorFa(error?: string): string {
  switch (error) {
    case 'not-allowed':
    case 'service-not-allowed':
      return 'دسترسی به میکروفون داده نشد. در تنظیمات مرورگر اجازه‌ی میکروفون را بدهید.';
    case 'network':
      return 'تشخیص گفتار به اینترنت (سرور گوگل/مایکروسافت) نیاز دارد و الان در دسترس نیست. از «ضبط و مقایسه» استفاده کنید.';
    case 'audio-capture':
      return 'میکروفون پیدا نشد.';
    case 'not-supported':
      return 'این مرورگر تشخیص گفتار ندارد. از Chrome یا Edge استفاده کنید، یا «ضبط و مقایسه» را بزنید.';
    default:
      return error ? 'تشخیص گفتار کار نکرد. دوباره امتحان کنید یا از «ضبط و مقایسه» استفاده کنید.' : '';
  }
}

// ---------------- Voice recorder (works offline) ----------------

export function useRecorder() {
  const [recording, setRecording] = useState(false);
  const [url, setUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const mediaRef = useRef<MediaRecorder | null>(null);
  const chunks = useRef<Blob[]>([]);

  useEffect(
    () => () => {
      mediaRef.current?.stream.getTracks().forEach((t) => t.stop());
    },
    [],
  );

  useEffect(
    () => () => {
      if (url) URL.revokeObjectURL(url);
    },
    [url],
  );

  async function start() {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream);
      chunks.current = [];
      mr.ondataavailable = (e) => e.data.size && chunks.current.push(e.data);
      mr.onstop = () => {
        const blob = new Blob(chunks.current, { type: mr.mimeType || 'audio/webm' });
        setUrl(URL.createObjectURL(blob));
        stream.getTracks().forEach((t) => t.stop());
      };
      mr.start();
      mediaRef.current = mr;
      setRecording(true);
    } catch {
      setError('میکروفون در دسترس نیست. اجازه‌ی میکروفون را در مرورگر بدهید.');
    }
  }

  function stop() {
    if (mediaRef.current && mediaRef.current.state !== 'inactive') mediaRef.current.stop();
    setRecording(false);
  }

  function clear() {
    setUrl(null);
  }

  return { recording, url, error, start, stop, clear };
}
