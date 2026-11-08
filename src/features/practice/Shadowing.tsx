import { useState } from 'react';
import { Btn, Card, Chip, Fa, Icon, Progress } from '../../components/ui';
import { logDay, useApp } from '../../lib/store';
import { speak } from '../../lib/speech';
import { SayCheck } from './SayCheck';

export interface Sentence {
  en: string;
  fa?: string;
}

const STEPS = [
  { en: 'Listen', fa: 'فقط گوش کنید (دو بار). سعی کنید بفهمید.' },
  { en: 'Listen and read', fa: 'حالا با متن گوش کنید. به ریتم و جای تأکید کلمه‌ها دقت کنید.' },
  { en: 'Shadow', fa: 'سایه‌خوانی: همزمان با صدا، آهسته‌تر از عادی، با هم بگویید. درست مثل یک سایه دنبالش کنید.' },
  { en: 'Say it yourself', fa: 'حالا خودتان بگویید و ببینید کامپیوتر چه فهمید.' },
];

/**
 * Shadowing: listen, read, speak along with the audio, then say it alone.
 * Research suggests shadowing works best with sentences you already understand.
 */
export function Shadowing({ sentences, onDone }: { sentences: Sentence[]; onDone: () => void }) {
  const { profile } = useApp();
  const [i, setI] = useState(0);
  const [step, setStep] = useState(0);
  const s = sentences[i];
  if (!s) return null;

  function nextStep() {
    if (step + 1 < STEPS.length) {
      setStep(step + 1);
      if (step + 1 === 1) speak(s.en);
      if (step + 1 === 2) speak(s.en, { rate: 0.75 });
    } else {
      logDay({ shadow: 1 });
      if (i + 1 < sentences.length) {
        setI(i + 1);
        setStep(0);
      } else onDone();
    }
  }

  return (
    <div className="stack">
      <div className="row-between">
        <Chip tone="accent">Shadowing · {STEPS[step].en}</Chip>
        <span className="muted small">
          Sentence {i + 1} / {sentences.length}
        </span>
      </div>
      <Progress value={i * STEPS.length + step} max={sentences.length * STEPS.length} />
      <Card>
        <div className="steps">
          {STEPS.map((st, k) => (
            <span key={k} className={`step-dot ${k === step ? 'on' : k < step ? 'done' : ''}`}>
              {k + 1}. {st.en}
            </span>
          ))}
        </div>
        <Fa block className="help">{STEPS[step].fa}</Fa>
        {step === 0 && (
          <div className="center stack">
            <Btn variant="soft" size="lg" onClick={() => speak(s.en)}>
              <Icon name="speaker" size={22} /> Listen
            </Btn>
          </div>
        )}
        {step >= 1 && (
          <div className="example">
            <p lang="en" className="shadow-text">{s.en}</p>
            {s.fa && profile.persianHelp && <Fa block className="example-fa">{s.fa}</Fa>}
          </div>
        )}
        {step === 1 && (
          <Btn variant="soft" onClick={() => speak(s.en)}>
            <Icon name="speaker" size={18} /> Listen again
          </Btn>
        )}
        {step === 2 && (
          <div className="row">
            <Btn variant="primary" onClick={() => speak(s.en, { rate: 0.75 })}>
              <Icon name="play" size={18} /> Play slowly and speak along
            </Btn>
            <Btn variant="soft" onClick={() => speak(s.en, { rate: 0.95 })}>
              Normal speed
            </Btn>
          </div>
        )}
        {step === 3 && <SayCheck target={s.en} key={s.en} />}
      </Card>
      <Btn variant="primary" size="lg" block onClick={nextStep}>
        {step + 1 < STEPS.length ? 'Next step' : i + 1 < sentences.length ? 'Next sentence' : 'Finish'} <Icon name="arrow" size={18} />
      </Btn>
    </div>
  );
}
