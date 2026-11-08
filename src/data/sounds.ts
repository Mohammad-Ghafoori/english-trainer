export interface SoundSet {
  id: string;
  title: string;
  titleFa: string;
  sounds: [string, string];
  howFa: string;
  /** Minimal pairs: two words that differ in only this sound. */
  pairs: [string, string][];
  /** Extra words for speaking practice (used when there are no pairs). */
  words?: string[];
}

// Sounds that are hard for Persian speakers, ordered by how much they affect being understood.
export const SOUND_SETS: SoundSet[] = [
  {
    id: 'v-w',
    title: 'v or w',
    titleFa: 'v یا w',
    sounds: ['/v/', '/w/'],
    howFa:
      '/v/ همان «و» فارسی است: دندان‌های بالا روی لب پایین.\n/w/ در فارسی نیست: لب‌ها را مثل «او» گرد و جلو بیاورید، دندان به لب نخورد، بعد سریع لب‌ها را باز کنید. west = «اوِست» خیلی سریع.',
    pairs: [
      ['vest', 'west'],
      ['vine', 'wine'],
      ['vet', 'wet'],
      ['verse', 'worse'],
      ['vow', 'wow'],
      ['vile', 'while'],
      ['veal', 'wheel'],
      ['vary', 'wary'],
      ['viper', 'wiper'],
    ],
  },
  {
    id: 'th-t',
    title: 'th or t',
    titleFa: 'th (بی‌صدا) یا t',
    sounds: ['/θ/', '/t/'],
    howFa:
      '/θ/ در فارسی نیست. نوک زبان را کمی بین دندان‌های بالا و پایین بگذارید و فقط هوا بدهید (بدون صدای حنجره). /t/ همان «ت» است. three ≠ tree.',
    pairs: [
      ['three', 'tree'],
      ['thin', 'tin'],
      ['thank', 'tank'],
      ['thought', 'taught'],
      ['both', 'boat'],
      ['path', 'pat'],
      ['through', 'true'],
      ['theme', 'team'],
      ['thick', 'tick'],
    ],
  },
  {
    id: 'th-s',
    title: 'th or s',
    titleFa: 'th (بی‌صدا) یا s',
    sounds: ['/θ/', '/s/'],
    howFa: 'برای /θ/ زبان بین دندان‌هاست؛ برای /s/ زبان پشت دندان‌هاست و صدای «س» می‌دهد. think ≠ sink.',
    pairs: [
      ['think', 'sink'],
      ['thing', 'sing'],
      ['thumb', 'sum'],
      ['mouth', 'mouse'],
      ['path', 'pass'],
      ['faith', 'face'],
      ['thick', 'sick'],
      ['worth', 'worse'],
      ['myth', 'miss'],
    ],
  },
  {
    id: 'dh-d',
    title: 'th (voiced) or d / z',
    titleFa: 'th (باصدا) یا d / z',
    sounds: ['/ð/', '/d/ /z/'],
    howFa:
      '/ð/ مثل /θ/ است (زبان بین دندان‌ها) ولی با لرزش حنجره. در this, the, they, mother. فارسی‌زبان‌ها معمولاً «د» یا «ز» می‌گویند: «دیس» یا «زیس» به‌جای this.',
    pairs: [
      ['then', 'den'],
      ['they', 'day'],
      ['though', 'dough'],
      ['there', 'dare'],
      ['those', 'doze'],
      ['worthy', 'wordy'],
      ['breathe', 'breeze'],
      ['clothing', 'closing'],
    ],
  },
  {
    id: 'i-ee',
    title: 'short i or long ee',
    titleFa: 'i کوتاه یا ee بلند',
    sounds: ['/ɪ/', '/iː/'],
    howFa:
      '/iː/ بلند و کشیده است، مثل «ای» فارسی. /ɪ/ کوتاه و شل است، بین «ای» و «اِ». ship (کشتی) ≠ sheep (گوسفند)، live ≠ leave.',
    pairs: [
      ['ship', 'sheep'],
      ['sit', 'seat'],
      ['live', 'leave'],
      ['fill', 'feel'],
      ['hit', 'heat'],
      ['bit', 'beat'],
      ['chip', 'cheap'],
      ['still', 'steal'],
      ['rich', 'reach'],
      ['slip', 'sleep'],
    ],
  },
  {
    id: 'a-e',
    title: 'a (cat) or e (bed)',
    titleFa: 'a (مثل cat) یا e (مثل bed)',
    sounds: ['/æ/', '/e/'],
    howFa: '/æ/ دهان بازتر از «اَ» فارسی و کمی به «اِ» نزدیک. /e/ همان «اِ» است. bad ≠ bed، man ≠ men.',
    pairs: [
      ['bad', 'bed'],
      ['man', 'men'],
      ['sad', 'said'],
      ['pan', 'pen'],
      ['had', 'head'],
      ['sat', 'set'],
      ['bag', 'beg'],
      ['marry', 'merry'],
    ],
  },
  {
    id: 'u-a',
    title: 'u (cup) or a (cap)',
    titleFa: 'u (مثل cup) یا a (مثل cap)',
    sounds: ['/ʌ/', '/æ/'],
    howFa: '/ʌ/ یک «اَ» کوتاه و شل در وسط دهان است (cup، but، much). /æ/ دهان بازتر و جلوتر است (cap، bat).',
    pairs: [
      ['cup', 'cap'],
      ['cut', 'cat'],
      ['bug', 'bag'],
      ['hut', 'hat'],
      ['much', 'match'],
      ['fun', 'fan'],
      ['run', 'ran'],
      ['luck', 'lack'],
      ['uncle', 'ankle'],
    ],
  },
  {
    id: 'aw-oh',
    title: 'aw (law) or oh (low)',
    titleFa: 'aw (مثل law) یا oh (مثل low)',
    sounds: ['/ɔː/', '/əʊ/'],
    howFa: '/əʊ/ دو بخشی است: «اُ» که به «او» می‌لغزد (low، boat). /ɔː/ یک صدای بلند و ثابت است (law، caught). «او» فارسی را ساده نگویید.',
    pairs: [
      ['law', 'low'],
      ['saw', 'so'],
      ['caught', 'coat'],
      ['bought', 'boat'],
      ['walk', 'woke'],
      ['ball', 'bowl'],
      ['hall', 'hole'],
      ['raw', 'row'],
    ],
  },
  {
    id: 'e-ei',
    title: 'e (let) or ay (late)',
    titleFa: 'e (مثل let) یا ay (مثل late)',
    sounds: ['/e/', '/eɪ/'],
    howFa: '/eɪ/ دو بخشی است: «اِ» که به «ای» می‌لغزد (late، pain). فارسی‌زبان‌ها گاهی آن را «اِ» ساده می‌گویند.',
    pairs: [
      ['let', 'late'],
      ['pen', 'pain'],
      ['wet', 'wait'],
      ['test', 'taste'],
      ['sell', 'sale'],
      ['get', 'gate'],
      ['fell', 'fail'],
      ['west', 'waste'],
    ],
  },
  {
    id: 's-clusters',
    title: 'Words starting with s + consonant',
    titleFa: 'کلمه‌هایی که با s + صامت شروع می‌شوند',
    sounds: ['sp-', 'st-'],
    howFa:
      'فارسی‌زبان‌ها معمولاً قبل از s یک «اِ» اضافه می‌کنند: «اِسکول»، «اِستودنت». کلمه را مستقیم با «سسس» شروع کنید و بدون مکث صامت بعدی را بگویید: sss-chool.',
    pairs: [],
    words: ['school', 'student', 'sport', 'speak', 'street', 'spring', 'small', 'star', 'stop', 'Spain', 'snow', 'sleep', 'strong', 'screen', 'sky'],
  },
];
