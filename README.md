# Tearaway

Every morning, something fun and a little smart waits for your kid on paper.

Tearaway is the **parent web app** for a kitchen strip (58mm thermal today; US Letter / N80 next). Parents configure a kid profile (name, age band, **paper size → slots**, print time, weather, watchlist, calendar). Kids never log in — they are profiles, not accounts (COPPA).

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
| `/app` | Dashboard — live strip/letter preview, **Generate new strip**, recent preview history, **Print now** |
| `/app/setup` | Create a kid (name + age band + paper size + starter modules) |
| `/app/modules` | **Paper size** → fixed **slots**; add modules into slots; in-order / random when a slot has 2+ |
| `/app/settings` | Timezone / print time, weather, watchlist, calendar; tier stub (`modulePoolLimit`) |

Aliases that redirect: `/dashboard` → `/app`, `/setup` → `/app/setup`, `/modules` → `/app/modules`, `/settings` → `/app/settings`.

### Paper size → slots (per kid)

**`paperSize` and `slots` live on each kid** (not global kitchen settings). Kitchen `settings.paperSize` is only the default for newly created kids.

| Paper size | Slots | Preview |
|------------|-------|---------|
| `strip58` | **4** | Classic ~384px thermal strip |
| `letter` | **7** | Wider ~612px letter-ish page (2-column body) |

Flow on `/app/modules`:

1. Choose paper size → slot count updates
2. Select a slot → click modules in the library to add
3. If a slot has **2+** modules, pick mode **in order** or **random**
4. Each generate / print resolves **one** module per non-empty slot from that mode

Empty slots are skipped at generate time; save requires at least one filled slot.

### Slot resolution

- **0 modules** → skip
- **1 module** (or mode `single`) → that module
- **many + `in_order`** → `moduleIds[cursor % length]`; cursor advances after each successful **Generate** / **Print now** (persisted in `store.json`)
- **many + `random`** → seeded RNG from `date + kid first name + nonce + slotId` (reshuffle changes outcome)

Legacy flat `kid.modules: ModuleId[]` is still written (unique pool across slots) and migrated into slots on read if `slots` is missing.

### Generate new strip

On `/app`, **Generate new strip** bumps the per-kid **nonce**, regenerates the preview (random slots reshuffle; in-order slots use the current cursor then advance), and keeps the last **3–5** previews for comparison. **Print now** saves a job using the **current** seed and slot picks, then advances in-order cursors. **Refresh preview** reloads without bumping the seed or cursors.

### Subscription / pool limit (stub only)

`settings.modulePoolLimit: number | null` — `null` unlocks all first-party modules (MVP). Later tiers can cap how many unique modules sit in a kid’s pool. **No Stripe / payments** in this build. Settings shows a short note.

## Firmware / print-job contract

The parent UI is not required for printing. Later firmware (ESP32 + Oreilet 58mm) can HTTP-fetch today’s strip.

| URL | What |
|-----|------|
| `GET /api/render?kid=<id>` | HTML of today’s strip (default `format=html`) |
| `GET /api/render?kid=<id>&format=png` | PNG preview (strip width today) |
| `GET /api/render?kid=<id>&format=json` | Structured `PrintJob` (sections + meta; no HTML) |
| `GET /strip/<id>` | Same HTML strip in a page (iframe preview) |
| `GET /api/print-jobs/preview` | Generate for the **active** kid (no persist; no cursor advance) |
| `POST /api/print-jobs/reshuffle` | Bump nonce + preview + advance in-order cursors |
| `POST /api/print-jobs/print-now` | Generate + save queued job + advance in-order cursors |
| `GET /api/print-jobs/latest` | Last queued job for the active kid |
| `GET` / `PUT /api/store` | Read / patch JSON store |
| `GET /api/weather` | Open-Meteo snapshot (falls back to mock offline) |

**Query params for `/api/render`**

- `kid` (required) — profile id, e.g. `demo-sam`
- `date` (optional) — `YYYY-MM-DD`. Default: today in the kid’s timezone
- `format` (optional) — `html` \| `png` \| `json`

Example: `/api/render?kid=demo-sam&date=2026-09-16&format=png`

No ESC/POS yet. No talk to a real printer. HTML/PNG/JSON is the handoff.

## Modules (deterministic content)

Content is seeded by **date + kid first name + nonce**. Same inputs → same strip. Bumping the nonce (Generate new strip) reshuffles without changing the day. Multi-module slots add another layer of pick resolution (above).

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

Demo kid (`data/store.sample.json`): strip58 with four slots — word · joke/riddle (in order) · doodle/wyr/poem (random) · maze/spanish (in order).

### Marketplace (coming soon — not built)

Space Week, Scorecard, Gratitude Note, Tongue Twister — shown in the modules UI as “coming soon.” First-party modules above are **not** duplicated here. No payments or pack install yet.

## Persistence

- Runtime store: `data/store.json` (gitignored)
- Seed / sample: `data/store.sample.json` (committed)
- No env vars required

### Store shape (slots)

```ts
kid.paperSize: "strip58" | "letter"
kid.slots: Array<{
  id: string
  moduleIds: ModuleId[]
  mode: "single" | "in_order" | "random"
  cursor?: number  // in_order only
}>
settings.modulePoolLimit: number | null  // null = all unlocked
```

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
