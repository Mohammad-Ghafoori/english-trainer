import { BackLink, Card, Fa, Title } from '../components/ui';

const POINTS: { en: string; fa: string }[] = [
  {
    en: 'Spaced repetition: review each word just before you would forget it.',
    fa: 'مرور با فاصله: هر کلمه درست قبل از اینکه فراموشش کنید دوباره نشان داده می‌شود. یک فراتحلیل (۴۸ آزمایش) نشان داد فاصله‌گذاری اثر متوسط تا بزرگی بر یادگیری زبان دوم دارد. این برنامه از الگوریتم FSRS استفاده می‌کند که دقیق‌تر از الگوریتم قدیمی Anki است.',
  },
  {
    en: 'Retrieval: try to remember before you see the answer.',
    fa: 'به یاد آوردن فعال: اول سعی کنید جواب را به یاد بیاورید، بعد ببینید. همین تلاش ذهنی حافظه را قوی می‌کند. برای همین کلمه‌ها هم از انگلیسی به فارسی و هم (بعداً) از فارسی به انگلیسی تمرین می‌شوند.',
  },
  {
    en: 'New words: first practise them together, then spread out the reviews.',
    fa: 'کلمه‌ی جدید: اول همان لحظه چند بار تمرین می‌شود (کوییز کوتاه)، بعد مرورها در روزهای بعد پخش می‌شوند. هر کلمه با صدا، جمله‌ی مثال و ترجمه آموزش داده می‌شود.',
  },
  {
    en: 'Persian traps: focus on the mistakes that come from Persian.',
    fa: 'تله‌های فارسی: بسیاری از اشتباه‌ها از فارسی می‌آیند (او برای he و she، نبودن the، «سه کتاب»، «کتابی که خریدمش»). توضیح کوتاه + تمرین + بازخورد فوری، این اشتباه‌ها را کم می‌کند.',
  },
  {
    en: 'Train your ear with many voices.',
    fa: 'آموزش گوش با صداهای مختلف: تحقیقات (فراتحلیل‌های HVPT) نشان می‌دهد شنیدن جفت‌کلمه‌ها (مثل three/tree، vest/west) از گوینده‌های مختلف، تشخیص صدا را بهتر می‌کند و به تلفظ هم کمک می‌کند.',
  },
  {
    en: 'Shadowing: speak along with the audio, using sentences you understand.',
    fa: 'سایه‌خوانی: همزمان با گوینده صحبت کنید. مطالعات نشان می‌دهد این کار شنیدار را بهتر می‌کند، به‌خصوص وقتی متن را از قبل فهمیده باشید.',
  },
  {
    en: 'Lots of input: read and listen to English you mostly understand.',
    fa: 'ورودی زیاد: برای فهم راحت باید حدود ۹۵ تا ۹۸٪ کلمه‌های یک متن را بدانید. یعنی حدود ۳۰۰۰ خانواده‌ی کلمه برای مکالمه‌ی روزمره و ۸۰۰۰ تا ۹۰۰۰ برای خواندن راحت. کلمه‌های این برنامه پایه است؛ بقیه را از خواندن و گوش دادن زیاد یاد می‌گیرید.',
  },
  {
    en: 'Speak and write, then get feedback.',
    fa: 'تولید + بازخورد: فقط با گوش دادن، صحبت کردن یاد نمی‌گیرید. هر روز بلند صحبت کنید، صدایتان را ضبط کنید و با معیارهای آیلتس مقایسه کنید. بخش رایتینگ اشتباه‌های رایج را خودکار پیدا می‌کند.',
  },
];

const ROUTINE: { en: string; fa: string }[] = [
  { en: '20–30 min: today’s session in this app (every day, even when busy).', fa: '۲۰ تا ۳۰ دقیقه: جلسه‌ی امروز در همین برنامه — هر روز، حتی روزهای شلوغ.' },
  { en: '20–30 min: listen or read something easy and interesting (podcasts, YouTube, series with English subtitles, graded readers).', fa: '۲۰ تا ۳۰ دقیقه: گوش دادن یا خواندن چیزی آسان و جذاب (پادکست، یوتیوب، سریال با زیرنویس انگلیسی، کتاب‌های داستان سطح‌بندی‌شده).' },
  { en: 'A few times a week: speak with a real person (language exchange, a tutor, friends).', fa: 'چند بار در هفته: صحبت با یک آدم واقعی (تبادل زبان، معلم آنلاین، دوستان).' },
  { en: 'From B1 level: one IELTS writing task and one speaking part each week. From B2: one full timed practice test every 1–2 weeks.', fa: 'از سطح B1: هر هفته یک رایتینگ و یک اسپیکینگ آیلتس. از B2: هر ۱ تا ۲ هفته یک تست کامل با زمان واقعی.' },
];

const SOURCES = [
  { t: 'Kim & Webb (2022), The effects of spaced practice on second language learning: a meta-analysis — Language Learning', u: 'https://onlinelibrary.wiley.com/doi/10.1111/lang.12479' },
  { t: 'Uchihara, Karas & Thomson (2025), High variability phonetic training: a meta-analysis — SSLA', u: 'https://www.cambridge.org/core/journals/studies-in-second-language-acquisition/article/high-variability-phonetic-training-hvpt-a-metaanalysis-of-l2-perceptual-training-studies/6ABB8C1F32D88D53EA8D05A4565E76F6' },
  { t: 'Nation (2006), How large a vocabulary is needed for reading and listening?', u: 'https://www.wgtn.ac.nz/__data/assets/pdf_file/0018/1626120/2006-How-large-a-vocab.pdf' },
  { t: 'Hamada (2019), Shadowing: What is it? How to use it. Where will it go? — RELC Journal', u: 'https://journals.sagepub.com/doi/10.1177/0033688218771380' },
  { t: 'Cambridge English: Guided learning hours', u: 'https://support.cambridgeenglish.org/hc/en-gb/articles/202838506-Guided-learning-hours' },
  { t: 'FSRS spaced repetition algorithm (open source)', u: 'https://github.com/open-spaced-repetition' },
];

export function Method() {
  return (
    <div className="stack">
      <BackLink to="me" label="Progress" />
      <Title en="How to learn English well" fa="چطور انگلیسی را خوب یاد بگیریم" />
      <Card>
        <h3>What research says — and how this app uses it</h3>
        <ol className="method-list">
          {POINTS.map((p) => (
            <li key={p.en}>
              <strong>{p.en}</strong>
              <Fa block className="small">{p.fa}</Fa>
            </li>
          ))}
        </ol>
      </Card>
      <Card>
        <h3>Your daily routine</h3>
        <ul className="method-list">
          {ROUTINE.map((p) => (
            <li key={p.en}>
              <span>{p.en}</span>
              <Fa block className="small muted">{p.fa}</Fa>
            </li>
          ))}
        </ul>
      </Card>
      <Card>
        <h3>Sources</h3>
        <ul className="small sources">
          {SOURCES.map((s) => (
            <li key={s.u}>
              <a href={s.u} target="_blank" rel="noreferrer">
                {s.t}
              </a>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
