# English Trainer

An English-learning app for **Persian speakers**, from beginner (A1) to advanced (C1 / IELTS 7+).
It runs in the browser on a computer and a phone, and you can install it like a normal app. It works offline.

## What's inside

| Part | What it does |
|---|---|
| **Today** | One daily session (~20 min): review words → new words → a Persian trap → sound training → shadowing → IELTS speaking (from B1). |
| **Words** | 4,722 words and phrases from A1 to C1: the 2,500 most common English words (NGSL), about 850 academic words (NAWL), 400 phrasal verbs and spoken expressions, 400 IELTS topic words and collocations, plus formal-letter phrases. Each has British IPA, Persian meaning, an example sentence and its Persian translation, plus audio. The most frequent words come first. |
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

## Accounts and sync (optional)

With [Supabase](https://supabase.com) (free), each person logs in with a username and password, and their progress syncs across all their devices. It still works offline and syncs later. Only you create accounts; nobody can sign up alone. Without Supabase settings, the app runs in local-only mode.

### One-time setup

1. Create a free Supabase account and a **New project**. Pick a region close to you (for example Frankfurt), and save the database password somewhere safe.
2. **SQL Editor → New query**: paste the whole file [`supabase/schema.sql`](supabase/schema.sql) and click **Run**. This creates a private progress table; each user can only read and change their own row.
3. **Authentication → Sign In / Providers → Email**: turn **off** "Allow new users to sign up".
4. **Project Settings → API Keys**: copy the **Project URL** and the **Publishable key** (`sb_publishable_…`; older projects call it the `anon` `public` key).
   - Never share the **secret** / `service_role` key or the database password.
5. Add them to the app:
   - **Website:** GitHub repo → Settings → Secrets and variables → Actions → **Variables** → add `SUPABASE_URL` and `SUPABASE_KEY`, then re-run the deploy workflow.
   - **Local development:** create `.env.local` with `VITE_SUPABASE_URL=…` and `VITE_SUPABASE_KEY=…`. Git ignores this file.

### Add a friend (or yourself)

**Authentication → Users → Add user → Create new user**

- **Email:** `username@english-trainer.app`, for example `ali@english-trainer.app`. No email is sent; this is just how the username is stored.
- **Password:** choose one and tick **Auto Confirm User**.

Your friend logs in with just **`ali`** and that password, and can change the password later on the Progress page. To remove someone, delete the user; their progress is deleted with them.

## Notes

- **Voices:** the app uses the voices built into your system. More English voices give better listening practice.
  - Windows: Settings → Time & Language → Speech → Add voices.
  - Android: Settings → Text-to-speech → Google → Install voice data.
- **Speech recognition** needs internet (Google or Microsoft servers). If it's blocked or offline, the app switches to *record and compare*, which works offline.
- **Adding content:** word lists are in `src/data/words/*.json` (`a1.json`…`c1.json` take their level from the file name; any other file gives each entry an `lv`, and an optional NGSL frequency rank `r`). Grammar traps are in `src/data/traps.json`, sounds are in `src/data/sounds.ts`, and IELTS prompts are in `src/data/ielts.ts`.
- **Word selection** uses the [New General Service List and New Academic Word List](https://www.newgeneralservicelist.com/) by Browne, Culligan & Phillips, licensed CC BY-SA 4.0. The Persian meanings, IPA and example sentences were written for this app.
- The IELTS prompts are original practice prompts in IELTS style, not official test material. Before booking your test, check the official immigration websites for current score requirements (for example, Canada CLB 7 means IELTS General 6.0 in each skill).
