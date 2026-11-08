// Original practice prompts in IELTS style (not taken from official tests).

export interface Part1Topic {
  id: string;
  topic: string;
  questions: string[];
}

export interface CueCard {
  id: string;
  title: string;
  bullets: string[];
  part3: string[];
}

export interface WritingPrompt {
  id: string;
  task: 'task1' | 'task2';
  /** For letters: formal, semi-formal or informal. */
  tone?: 'formal' | 'semi-formal' | 'informal';
  prompt: string;
  bullets?: string[];
}

export const PART1: Part1Topic[] = [
  { id: 'home-town', topic: 'Your hometown', questions: ['Where is your hometown?', 'What do you like most about it?', 'Has it changed much in recent years?', 'Would you like to live there in the future? Why or why not?'] },
  { id: 'work-study', topic: 'Work or studies', questions: ['Do you work or are you a student?', 'Why did you choose this job or subject?', 'What is the most difficult part of it?', 'What would you like to do in the future?'] },
  { id: 'home', topic: 'Your home', questions: ['Do you live in a house or an apartment?', 'Which room do you spend the most time in?', 'What would you like to change about your home?', 'Is it a good place for children? Why?'] },
  { id: 'free-time', topic: 'Free time', questions: ['What do you usually do in your free time?', 'Did you have the same hobbies when you were a child?', 'Is there a new hobby you would like to try?', 'Do you prefer spending free time alone or with others?'] },
  { id: 'food', topic: 'Food', questions: ['What kind of food do you like?', 'Do you prefer eating at home or in restaurants?', 'Can you cook? What do you cook?', 'Is there any food you disliked as a child but like now?'] },
  { id: 'technology', topic: 'Phones and the internet', questions: ['How often do you use your phone?', 'Which apps do you use the most?', 'Do you think people spend too much time online?', 'Could you live without the internet for a week?'] },
  { id: 'weather', topic: 'Weather and seasons', questions: ['What is the weather like where you live?', 'What is your favourite season? Why?', 'Does the weather change your mood?', 'Would you like to live in a colder or a warmer country?'] },
  { id: 'english', topic: 'Learning English', questions: ['Why are you learning English?', 'What is the most difficult thing about English for you?', 'How do you practise English every day?', 'Would you like to learn another language?'] },
  { id: 'friends', topic: 'Friends', questions: ['Do you have many close friends?', 'How often do you see your friends?', 'What do you usually do together?', 'Is it easy to make new friends as an adult?'] },
  { id: 'travel', topic: 'Travel', questions: ['Do you like travelling?', 'Where did you go on your last trip?', 'Do you prefer travelling alone or with other people?', 'Which country would you most like to visit?'] },
];

export const CUE_CARDS: CueCard[] = [
  {
    id: 'helper',
    title: 'Describe a person who has helped you in your life.',
    bullets: ['who this person is', 'how you know them', 'what they did to help you', 'and explain why their help was important to you'],
    part3: ['What qualities make someone a good teacher or mentor?', 'Do people help their neighbours less today than in the past? Why?', 'Should schools encourage young people to do volunteer work?'],
  },
  {
    id: 'place',
    title: 'Describe a place you would like to visit in the future.',
    bullets: ['where it is', 'how you know about it', 'what you would do there', 'and explain why you want to go there'],
    part3: ['Why do people like to travel to other countries?', 'Can tourism damage the places people visit?', 'How might travel change in the next twenty years?'],
  },
  {
    id: 'skill',
    title: 'Describe a skill that was difficult for you to learn.',
    bullets: ['what the skill is', 'when and how you learned it', 'what was difficult about it', 'and explain how you felt when you succeeded'],
    part3: ['Is it better to learn new skills at school or by yourself?', 'Which skills will be most important for jobs in the future?', 'Do older people find it harder to learn new things? Why?'],
  },
  {
    id: 'decision',
    title: 'Describe an important decision you made.',
    bullets: ['what the decision was', 'when you made it', 'who helped you decide', 'and explain why it was important'],
    part3: ['Do young people and older people make decisions differently?', 'Should parents make important decisions for their children?', 'Do people today have too many choices?'],
  },
  {
    id: 'technology',
    title: 'Describe a piece of technology that you find very useful.',
    bullets: ['what it is', 'when you started using it', 'how you use it', 'and explain why it is so useful for you'],
    part3: ['Has technology made people’s lives better or worse?', 'What are the risks of depending too much on technology?', 'How will technology change the way people work?'],
  },
  {
    id: 'celebration',
    title: 'Describe a celebration or festival that is important in your country.',
    bullets: ['what it is called', 'when it happens', 'what people do', 'and explain why it is important to people'],
    part3: ['Why are traditional festivals important for a society?', 'Are traditions disappearing in the modern world?', 'Should governments spend money on public celebrations?'],
  },
  {
    id: 'story',
    title: 'Describe a book, film or series that you enjoyed.',
    bullets: ['what it was', 'what it was about', 'when you read or watched it', 'and explain why you enjoyed it'],
    part3: ['Do people read fewer books than they did in the past?', 'Should films and series try to teach people something?', 'Why do some stories become popular all over the world?'],
  },
  {
    id: 'goal',
    title: 'Describe a goal you hope to achieve in the next five years.',
    bullets: ['what the goal is', 'why you chose it', 'what you are doing to achieve it', 'and explain how you will feel when you achieve it'],
    part3: ['Why is it important for people to set goals?', 'Do people achieve more when they have a deadline?', 'What challenges do people face when they move to a new country?'],
  },
];

export const WRITING: WritingPrompt[] = [
  {
    id: 'heating',
    task: 'task1',
    tone: 'formal',
    prompt: 'You have recently moved into a rented apartment, and there is a problem with the heating. Write a letter to your landlord.',
    bullets: ['describe the problem', 'explain how it is affecting you', 'say what you would like the landlord to do'],
  },
  {
    id: 'damaged',
    task: 'task1',
    tone: 'formal',
    prompt: 'You ordered something online, but it arrived damaged. Write a letter to the company.',
    bullets: ['say what you ordered and when', 'describe the damage', 'explain what you want the company to do'],
  },
  {
    id: 'course',
    task: 'task1',
    tone: 'formal',
    prompt: 'You saw an advertisement for an evening English course at a local college. Write a letter to the college.',
    bullets: ['give some information about your English level and goals', 'say what you would like to know about the course', 'ask about the fees and the timetable'],
  },
  {
    id: 'absence',
    task: 'task1',
    tone: 'semi-formal',
    prompt: 'You need to take a week off work for a family reason. Write a letter to your manager.',
    bullets: ['explain why you need the time off', 'say what work you will finish before you leave', 'suggest how colleagues can manage while you are away'],
  },
  {
    id: 'neighbour',
    task: 'task1',
    tone: 'semi-formal',
    prompt: 'Your neighbour often plays loud music late at night. Write a letter to your neighbour.',
    bullets: ['introduce yourself', 'explain the problem and how it affects you', 'suggest a solution'],
  },
  {
    id: 'visit',
    task: 'task1',
    tone: 'informal',
    prompt: 'An English-speaking friend wants to visit your country next year. Write a letter to your friend.',
    bullets: ['suggest the best time of year to visit', 'recommend some places to see', 'tell them what they should bring'],
  },
  {
    id: 'new-city',
    task: 'task1',
    tone: 'informal',
    prompt: 'You have recently moved to a new city. Write a letter to an English-speaking friend.',
    bullets: ['describe the city', 'tell them what you have been doing', 'invite them to come and visit you'],
  },
  { id: 'unpaid-work', task: 'task2', prompt: 'Some people think that all young people should be required to do unpaid work in their local community. To what extent do you agree or disagree?' },
  { id: 'cities', task: 'task2', prompt: 'In many countries, more and more people are moving from the countryside to big cities. What problems does this cause, and what solutions can you suggest?' },
  { id: 'languages', task: 'task2', prompt: 'Some people believe that children should start learning a foreign language at primary school rather than secondary school. Discuss both views and give your own opinion.' },
  { id: 'remote', task: 'task2', prompt: 'Nowadays many people work from home using modern technology. Do the advantages of this outweigh the disadvantages?' },
  { id: 'transport', task: 'task2', prompt: 'Governments should spend more money on public transport rather than on building new roads. To what extent do you agree or disagree?' },
  { id: 'brain-drain', task: 'task2', prompt: 'Many skilled workers leave their home country to work abroad. Is this a positive or a negative development for their home countries?' },
  { id: 'health', task: 'task2', prompt: 'Some people say that the best way to improve public health is to build more sports facilities. Others believe that other measures are needed. Discuss both views and give your own opinion.' },
  { id: 'screens', task: 'task2', prompt: 'Children today spend more time in front of screens than ever before. What are the causes of this, and what can parents and schools do about it?' },
];

export const LINKERS = [
  'firstly', 'secondly', 'finally', 'in addition', 'moreover', 'furthermore', 'however', 'on the other hand', 'nevertheless',
  'although', 'whereas', 'while', 'therefore', 'as a result', 'consequently', 'for example', 'for instance', 'such as',
  'in conclusion', 'to sum up', 'overall', 'in my opinion', 'i believe', 'because', 'since', 'due to', 'in contrast',
  'similarly', 'despite', 'in spite of', 'not only', 'as well as', 'this means that', 'it is clear that',
];

export const LETTER_PHRASES: Record<'formal' | 'semi-formal' | 'informal', { open: string[]; close: string[]; useful: string[] }> = {
  formal: {
    open: ['Dear Sir or Madam,', 'Dear Mr Smith,'],
    close: ['Yours faithfully, (if you started with Dear Sir or Madam)', 'Yours sincerely, (if you used their name)'],
    useful: ['I am writing to complain about…', 'I am writing to enquire about…', 'I would be grateful if you could…', 'I would appreciate it if…', 'Please find attached…', 'I look forward to hearing from you.'],
  },
  'semi-formal': {
    open: ['Dear Mr Brown,', 'Dear Sarah,'],
    close: ['Kind regards,', 'Best regards,'],
    useful: ['I am writing to let you know that…', 'I hope you don’t mind me writing to you about…', 'Would it be possible to…?', 'Thank you for your understanding.'],
  },
  informal: {
    open: ['Dear Alex,', 'Hi Alex,'],
    close: ['Best wishes,', 'Love,', 'Take care,'],
    useful: ['It was great to hear from you!', 'Sorry I haven’t written for so long.', 'Guess what?', 'Can’t wait to see you!', 'Write back soon.'],
  },
};

/** Common mistakes the writing checker looks for (many come from Persian). */
export const WRITING_RULES: { re: RegExp; en: string; fa: string; formalOnly?: boolean }[] = [
  { re: /\b(informations|advices|furnitures|luggages|homeworks|equipments|knowledges|evidences|feedbacks)\b/gi, en: 'This noun is uncountable — no -s.', fa: 'این اسم غیرقابل‌شمارش است و -s نمی‌گیرد.' },
  { re: /\bmarried with\b/gi, en: 'Use "married to".', fa: 'در انگلیسی married to درست است، نه with.' },
  { re: /\bdepends? (to|from|of)\b/gi, en: 'Use "depend on".', fa: 'depend on درست است.' },
  { re: /\bexplain(s|ed|ing)? (me|him|her|us|them)\b/gi, en: 'Use "explain to me / explain something to someone".', fa: 'explain به to نیاز دارد: explain to me.' },
  { re: /\bsa(y|ys|id) (me|him|her|us|them)\b/gi, en: 'Use "tell me" (or "say to me").', fa: 'بعد از say مستقیم مفعول نمی‌آید؛ tell me بگویید.' },
  { re: /\bdiscuss(es|ed|ing)? about\b/gi, en: '"discuss" has no "about".', fa: 'discuss بدون about می‌آید.' },
  { re: /\bin the other hand\b/gi, en: 'Use "on the other hand".', fa: 'on the other hand درست است.' },
  { re: /\barrive(s|d)? to\b/gi, en: 'Use "arrive in" (city/country) or "arrive at" (place).', fa: 'arrive in / arrive at درست است، نه to.' },
  { re: /\bmore (better|worse|easier|bigger|cheaper)\b/gi, en: 'Do not use "more" with -er comparatives.', fa: 'more را با صفت‌های -er استفاده نکنید.' },
  { re: /\b(people|children|police) (is|was|has)\b/gi, en: 'This noun is plural — use are/were/have.', fa: 'این اسم جمع است؛ فعل جمع بیاورید.' },
  { re: /\bsince (\d+|two|three|four|five|six|ten|many|several) (years|months|weeks|days)\b/gi, en: 'Use "for" with a period of time (since + a point in time).', fa: 'برای مدت زمان از for استفاده کنید؛ since برای نقطه‌ی شروع است.' },
  { re: /\baccording to me\b/gi, en: 'Say "In my opinion" or "I believe".', fa: 'according to me طبیعی نیست؛ In my opinion بگویید.' },
  { re: /\b(learn(s|ed|t)?) (me|him|her|us|them)\b/gi, en: 'Use "teach" (teach me), not "learn me".', fa: 'یاد دادن = teach؛ learn یعنی یاد گرفتن.' },
  { re: /(^|[.!?]\s+)the (life|society|nature|money|happiness|education) (is|has|was|can)\b/gi, en: 'For general ideas, do not use "the" (Life is…, Society has…).', fa: 'برای مفهوم کلی the نمی‌آید.' },
  { re: /\b(nobody|nothing|no one|never)\b[^.!?]{0,25}\b(didn't|don't|doesn't|not|can't|won't)\b/gi, en: 'Only one negative word per clause.', fa: 'در انگلیسی فقط یک منفی در هر جمله می‌آید.' },
  { re: /\b(which|who|whom) (I|we|you|they|he|she) (\w+ ){1,2}(it|him|her|them)\b/gi, en: 'Remove the extra pronoun in the relative clause (the book that I bought ~~it~~).', fa: 'ضمیر اضافه در جمله‌ی موصولی نیاورید.' },
  { re: /\bi\b/g, en: 'Always write "I" as a capital letter.', fa: 'I همیشه با حرف بزرگ نوشته می‌شود.' },
  { re: /\b(don't|can't|won't|isn't|aren't|doesn't|didn't|I'm|it's|I've|I'd|wasn't|couldn't|wouldn't|shouldn't)\b/gi, en: 'Avoid contractions in formal writing.', fa: 'در نوشته‌ی رسمی از شکل کوتاه (don’t) استفاده نکنید.', formalOnly: true },
];
