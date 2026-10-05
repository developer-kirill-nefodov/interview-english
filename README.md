# Interview English

Practice tech job interviews and live coding in English. The idea: 10 minutes a day, no cramming and no guilt.

## How it works

- **Daily mission (Today).** A short warm-up with flashcards, one main task, and a review of your two biggest mistakes. The mistakes become cards automatically.
- **Storyline.** You go through the hiring process at a fictional company: recruiter screen → technical screen → live coding → system design → a final round with a "hire / no hire" decision. Then the next company. Offers add up.
- **7 formats**, so it doesn't get boring: Blitz (30 seconds per question), Deep question, Approach only (explain a solution without code), Mini live coding, Shadowing (repeat a strong answer sentence by sentence), My story (a STAR story), and Final interview. The same format never comes twice in a row, and "Boring, swap it" hides a format for a week.
- **Gentle motivation.** The goal is 4 days a week, and skipping a day is fine. After a break of 4+ days the mission is lighter. Four skills level up: Fluency, Clarity, Algorithms, Vocabulary.
- **Spaced repetition cards** (1, 3, 7, 16, 35, 80 days): your own mistakes, algorithm patterns, and useful phrases.
- **Free practice:** Mock interview (20 questions), Live coding (6 problems, tests run in a web worker), Phrasebook, Progress.
- **Hints in your language.** Questions, phrases and problems have translations, and feedback can add short hints. Pick Russian, Ukrainian, or English only in Today, Phrasebook or Progress. The practice itself stays in English.
- **Feedback without an API key:** filler words, pace, common mistakes of non-native speakers ("I am agree", "depends of", "3 years experience"), coverage of key ideas, and a checklist for explaining a solution.
- **AI interviewer:** with `ANTHROPIC_API_KEY` set, Claude reviews your answers: English and content scored separately, corrections, a better version of your answer, and a follow-up question.

## Getting started

Requires Node.js 20.19+.

```bash
npm install
npm run dev                  # http://localhost:5173
npm run build && npm start   # production
```

Voice input works in Chrome and Edge.

### AI interviewer

1. Get a key at https://console.anthropic.com/settings/keys.
2. In the project folder, create a `.env` file (copy `.env.example`; files starting with a dot are hidden in Finder and Explorer).
3. Add one line: `ANTHROPIC_API_KEY=sk-ant-...`
4. Restart `npm run dev`. The sidebar shows "AI interviewer on".
5. Check that the key works: `npm run check:ai`.

`.env` is in `.gitignore`, so the key never gets committed. The server listens on localhost only; set `HOST=0.0.0.0` to open it to your network on purpose.

## Checks

```bash
npm run typecheck   # TypeScript
npm test            # unit tests for the logic and content (reference solutions run against every problem's tests)
npm run e2e         # real browser + real server: every format, the mission, the storyline, phone, dark mode
npm run check:ai    # a real request to the Claude API (needs ANTHROPIC_API_KEY)
```

The e2e test types answers instead of speaking, because speech recognition doesn't run headless.

## Adding a hint language

Add the language to `HINT_LANGS` in `src/lib/i18n.ts`, then add a translation next to every `tr` in `src/data` and `src/lib/mission.ts`. `npm test` lists any text that is still missing a translation.

## Stack

React 19 + TypeScript + Vite, CodeMirror 6, Express 5 (one server for the API and the frontend), Anthropic SDK (`claude-opus-5-5`, structured outputs), Web Speech API, lucide-react, Inter and JetBrains Mono served locally. Progress is stored in the browser's localStorage.

## Project structure

```
server/              Express server and the prompts for Claude
src/data/            Questions, problems, patterns, phrasebook
src/lib/             Spaced repetition, mission planning, storage, offline checks, speech, test runner, i18n
src/mission/         The daily mission and its formats
src/pages/           Screens
tests/e2e.mjs        Browser test
scripts/check-ai.ts  Real AI check
```
