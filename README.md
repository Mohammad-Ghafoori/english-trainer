# English Trainer

An English-learning app for **Persian speakers**, from beginner (A1) to advanced (C1 / IELTS 7+).
It runs in the browser on a computer and a phone, and you can install it like a normal app. It works offline.

## What's inside

| Part | What it does |
|---|---|
| **Today** | One daily session (~20 min): review words → new words → a Persian trap → sound training → shadowing → IELTS speaking (from B1). |
| **Words** | 1,500 words and phrases from A1 to C1 (IELTS vocabulary, letter phrases, collocations). Each has British IPA, Persian meaning, an example sentence and its Persian translation, plus audio. |
| **Smart review** | FSRS spaced repetition (more accurate than Anki's old SM-2). You first recognise a word (English → Persian), and later you have to produce it (Persian → type the English). |
| **Persian traps** | 15 lessons × 10 exercises on mistakes that come from Persian: he/she (او), a/the, "three book", "the book that I bought it", "Nobody didn't come", learn/teach, married *to*, and more. |
| **Sounds** | Listening training with many voices (HVPT) for sounds Persian doesn't have: v/w, th, ship/sheep, cat/bed, cup/cap, law/low, late/let. Then speaking practice with speech recognition, or record and compare. |
| **Shadowing & dictation** | Built from sentences you've already learned. |
| **IELTS** | Speaking Parts 1–3 with timers, recording, a transcript and words per minute. Writing Task 1 (letters) and Task 2 (essays) with a timer, word count and an automatic checker for common Persian-speaker mistakes. |
| **Progress** | Streak, study time, vocabulary per level, accuracy on each trap and sound, and export/import to move progress between devices. |

## The learning method (research summary)

1. **Spaced retrieval practice.** A meta-analysis of 48 experiments found that spacing has a medium-to-large effect on second-language learning (Kim & Webb, 2022). The app schedules reviews with FSRS.
2. **New words: massed first, then spaced.** You get a short quiz right away, then reviews spread over the following days.
3. **High-variability phonetic training.** Meta-analyses show that hearing minimal pairs from many speakers improves perception and helps pronunciation (Uchihara et al.).
4. **Shadowing with content you understand.** This improves listening (Hamada).
5. **Focus on first-language transfer.** You get an explicit explanation, practice and immediate feedback for each Persian trap.
6. **Lots of input.** You need about 95–98% known words to understand comfortably. That is about 3,000 word families for everyday listening and 8,000–9,000 for comfortable reading (Nation, 2006). The app gives you the core; daily reading and listening outside the app does the rest.
7. **Realistic time.** Cambridge's guided-hours guide gives about 200 h for A2, 400 h for B1, 600 h for B2 and 800 h for C1, counted from zero. Daily consistency is what matters.

The full explanation, in Persian, is on the app's **Progress → How this app teaches** page.

## Run it on your computer

Install [Node.js](https://nodejs.org) 20 or newer, then run:

```bash
npm install
```

```bash
npm run dev
```

Open http://localhost:5173 in **Chrome or Edge**. Speech recognition only works in Chromium browsers.

## Use it on your phone

The app is a PWA, so it needs to be served over **HTTPS** to install on a phone and to use the microphone. The simplest options are:

1. Build it with `npm run build` and upload the `dist` folder to any free static host (GitHub Pages, Netlify, Cloudflare Pages, Vercel).
2. Open the site on your phone in Chrome, then tap **⋮ → Add to Home screen / Install app**.

Progress is stored **on each device** (in the browser). To move it, use **Progress → Export progress** on one device and **Import progress** on the other.

## Notes

- **Voices:** the app uses the voices built into your system. More English voices give better listening practice.
  - Windows: Settings → Time & Language → Speech → Add voices.
  - Android: Settings → Text-to-speech → Google → Install voice data.
- **Speech recognition** needs internet (Google or Microsoft servers). If it's blocked or offline, the app switches to *record and compare*, which works offline.
- **Adding content:** word lists are in `src/data/words/*.json`, grammar traps are in `src/data/traps.json`, sounds are in `src/data/sounds.ts`, and IELTS prompts are in `src/data/ielts.ts`.
- The IELTS prompts are original practice prompts in IELTS style, not official test material. Before booking your test, check the official immigration websites for current score requirements (for example, Canada CLB 7 means IELTS General 6.0 in each skill).
