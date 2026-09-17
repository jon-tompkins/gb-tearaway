# Tearaway

Every morning, something fun and a little smart waits for your kid on paper.

Tearaway is the **parent web app** for a 58mm kitchen thermal strip. Parents configure a kid profile (name, age band, modules, print time, weather, watchlist, calendar). Kids never log in — they are profiles, not accounts (COPPA).

This MVP is a **local demo**: no auth, no Stripe, no secrets, no real printer. Config lives in `data/store.json` (seeded from `data/store.sample.json`).

## Quick start

```bash
cd /workspace/tearaway-app
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Production build:

```bash
npm run build
npm start
```

## Parent UI routes

| Path | What |
|------|------|
| `/` | Marketing home |
| `/app` | Dashboard — live 58mm strip preview, **Generate new strip**, recent preview history, **Print now** |
| `/app/setup` | Create a kid (name + age band + modules) |
| `/app/modules` | Enable 3–5 modules, reorder |
| `/app/settings` | Timezone / print time, weather city or ZIP, stock watchlist, calendar events |

Aliases that redirect: `/dashboard` → `/app`, `/setup` → `/app/setup`, `/modules` → `/app/modules`, `/settings` → `/app/settings`.

### Generate new strip

On `/app`, **Generate new strip** bumps an explicit per-kid **nonce/seed** (stored in `nonceByKid`) and regenerates the preview immediately. Same calendar date + kid name, different content — so you can reshuffle and judge quality. The dashboard keeps the last **3–5** generated previews on-page for side-by-side comparison. **Print now** saves a job using the **current** seed (matches what you’re looking at). **Refresh preview** reloads without bumping the seed.

## Firmware / print-job contract

The parent UI is not required for printing. Later firmware (ESP32 + Oreilet 58mm) can HTTP-fetch today’s strip.

| URL | What |
|-----|------|
| `GET /api/render?kid=<id>` | HTML of today’s strip (default `format=html`) |
| `GET /api/render?kid=<id>&format=png` | PNG, 384px wide (~58mm @ 203 dpi), variable height |
| `GET /api/render?kid=<id>&format=json` | Structured `PrintJob` (sections + meta; no HTML) |
| `GET /strip/<id>` | Same HTML strip in a page (iframe preview) |
| `GET /api/print-jobs/preview` | Generate for the **active** kid (does not persist; uses current nonce) |
| `POST /api/print-jobs/reshuffle` | Bump nonce + return a fresh preview for the active kid |
| `POST /api/print-jobs/print-now` | Generate + save as queued job (current nonce) |
| `GET /api/print-jobs/latest` | Last queued job for the active kid |
| `GET` / `PUT /api/store` | Read / patch JSON store |
| `GET /api/weather` | Open-Meteo snapshot (falls back to mock offline) |

**Query params for `/api/render`**

- `kid` (required) — profile id, e.g. `demo-sam`
- `date` (optional) — `YYYY-MM-DD`. Default: today in the kid’s timezone
- `format` (optional) — `html` \| `png` \| `json`

Example: `/api/render?kid=demo-sam&date=2026-09-16&format=png`

No ESC/POS yet. No talk to a real printer. HTML/PNG/JSON is the handoff.

## Delivery / paper (GTM)

Software-first: web (and later email) delivery. Current layout is the **58mm kitchen strip** (~384px). Settings still offer 80mm thermal. **US Letter 8.5×11** for home Wi‑Fi printers is planned (not selectable yet). Thermal hardware is an upgrade later.

## Modules (deterministic content)

Content is seeded by **date + kid first name + nonce**. Same inputs → same strip. Bumping the nonce (Generate new strip) reshuffles without changing the day.

Parents pick **3–5 slots**. `/app/modules` groups first-party modules by category.

### Play / puzzles

| Module | Notes |
|--------|--------|
| Maze | Perfect maze; size by age band |
| **Word Find** | Tiny word-search (6×6–8×8) that fits 58mm |
| **Connect the Dots** | Funny numbered dots + silly caption (SVG) |
| Riddle | Question + answer on the strip (think first) |
| Number Puzzle | 4×4 / 6×6 / easy 9×9; parent key on-screen only |

### Words & language

| Module | Notes |
|--------|--------|
| Word of the Day | Age-banded definition + example |
| **Poem of the Day** | Short printable poem |
| Breakfast Joke | Age-banded groaners; kid-safe, no mean stuff |
| Spanish Word | Spanish + phonetic + English + try-it line |

### Curious facts

| Module | Notes |
|--------|--------|
| This Day in History | Kid-appropriate local catalog |
| Fun Fact | Curated sample copy |

### Kid-friendly news (static banks, not live scrapes)

Wonder + discovery tone. No violence / politics anxiety. City news is generic “hometown” style (no geo API yet).

| Module | Notes |
|--------|--------|
| World News | Animals, space, discoveries |
| National News | Parks, science fairs, kindness |
| Hometown News | Library, playground, neighbors |
| Tech News | Robots, code, gadgets |
| Gamer News | Games, makers, fair play |

### Today’s world

| Module | Notes |
|--------|--------|
| Weather | Open-Meteo + Zippopotam (no API key); mock if offline |
| Stock Watchlist | **Mocked** prices — not live market data |
| Calendar | Local events you edit in Settings |

### Create

| Module | Notes |
|--------|--------|
| Tiny Doodle | 30-second drawing prompt for the strip margin |
| Would You Rather | Two choices + a tiny debate nudge |

Demo kid defaults: word · joke · doodle · maze · spanish.

### Marketplace (coming soon — not built)

Space Week, Scorecard, Gratitude Note, Tongue Twister — shown in the modules UI as “coming soon.” First-party modules above are **not** duplicated here. No payments or pack install yet.

## Persistence

- Runtime store: `data/store.json` (gitignored)
- Seed / sample: `data/store.sample.json` (committed)
- No env vars required

## Stack

Next.js (App Router) · TypeScript · Tailwind CSS · local JSON store

## What’s not in this MVP

- Auth / OAuth / Stripe
- Real thermal printer / ESP32 firmware / ESC/POS
- Scheduled cloud print worker
- Live stock quotes
- Marketplace packs / payments / AI review pipeline

## License

Private prototype — dad + kid project.
