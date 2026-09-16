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
| `/app` | Dashboard — live 58mm strip preview, print time, **Print now** |
| `/app/setup` | Create a kid (name + age band + modules) |
| `/app/modules` | Enable 3–5 modules, reorder |
| `/app/settings` | Timezone / print time, weather city or ZIP, stock watchlist, calendar events |

Aliases that redirect: `/dashboard` → `/app`, `/setup` → `/app/setup`, `/modules` → `/app/modules`, `/settings` → `/app/settings`.

## Firmware / print-job contract

The parent UI is not required for printing. Later firmware (ESP32 + Oreilet 58mm) can HTTP-fetch today’s strip.

| URL | What |
|-----|------|
| `GET /api/render?kid=<id>` | HTML of today’s strip (default `format=html`) |
| `GET /api/render?kid=<id>&format=png` | PNG, 384px wide (~58mm @ 203 dpi), variable height |
| `GET /api/render?kid=<id>&format=json` | Structured `PrintJob` (sections + meta; no HTML) |
| `GET /strip/<id>` | Same HTML strip in a page (iframe preview) |
| `GET /api/print-jobs/preview` | Generate for the **active** kid (does not persist) |
| `POST /api/print-jobs/print-now` | Generate + save as queued job |
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

Content is seeded by **date + kid first name** (plus an optional nonce). Same inputs → same strip.

| Module | Notes |
|--------|--------|
| Word of the Day | Age-banded definition + example |
| Fun Fact | Curated sample copy |
| This Day in History | Kid-appropriate local catalog |
| Maze | Perfect maze; size by age band |
| Number Puzzle | 4×4 / 6×6 / easy 9×9; parent key on-screen only |
| Weather | Open-Meteo + Zippopotam (no API key); mock if offline |
| Stock Watchlist | **Mocked** prices — not live market data |
| Calendar | Local events you edit in Settings |

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
- Marketplace packs (shown as “coming soon”)

## License

Private prototype — dad + kid project.
