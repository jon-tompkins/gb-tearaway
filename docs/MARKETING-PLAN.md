# Back of the Box (BotB) Marketing Plan

Status: draft for Jon, Oct 26 2026. Nothing here has been posted or sent.
Facts used: live at tearaway.vercel.app / www.backofthebox.xyz; 25+ modules; Letter; daily email with PDF + QR answer key; real kid-safe news; $5/mo after a free first month; billing and access codes built but enforcement OFF until Stripe keys are set.

## 1. Audiences (ranked)

1. **Alpha School NYC parents + similar "intentional parenting" private-school circles.** Warm, reachable via Jon's hub and Discord, high income, already screen-skeptical. Fastest feedback loop. Target: first 30 families.
2. **Screen-light / "analog childhood" parents (ages 5-11)** on X, Instagram, Substack, Reddit (r/Parenting, r/homeschool, r/ScreenFreeParenting). Biggest pool, needs proof content.
3. **Homeschool and microschool parents/teachers.** Daily morning-work habit fits perfectly; one family or a pod of 5-15 kids. Good for annual plan.
4. **Gifted/enrichment parents** (IQ-style reasoning puzzles, crosswords, sudoku, Battleship). Niche but loud and shareable.
5. **Grandparents and gift buyers.** Later; needs a gift flow. Skip for now.
6. Ink-free printer fans. Content angle ("no ink, ever"), not a target audience.

## 2. Positioning

**One-liner:** A fresh, age-tuned puzzle-and-news page for your kid, emailed every morning and printed on any home printer.

**Taglines**
- "Breakfast, with something to chew on."
- "A smarter breakfast, printed on paper."
- "Made for the fridge, not the feed."

**Proof points to repeat:** no kid account, no ads, no screen. Real news from NASA/Smithsonian, rewritten and fact-checked. New page daily. Letter works on any printer; no printer? see the supplies page (ink-free thermal). Answers behind a QR code so the kid solves first.

## 3. Launch offer mechanics

- **Free first month**, no card up front (trial starts at first app load). Then yearly: $20 (up to 2 kids), $30 (up to 5); $5/mo as the alternative.
- **Access codes** (already built: `BOX-XXXX-XXXX`, set months, max uses, once per user). Use three kinds:
  - `ALPHA-...` batch: 2 months free, capped ~40 uses, for Alpha/Discord families (seeds word of mouth and tells you which community converts).
  - **Referral codes:** each paying or active user gets one code worth +1 free month to a friend and +1 month to themselves. Needs a small build (per-user code generation + credit on redeem); until then Jon hand-issues codes from Admin to anyone who asks.
  - `FOUNDING-...`: 3 months, 20 uses, for the first creators/influencers and testimonial givers.
- **Annual-led plans:** $20/yr (up to 2 kids), $30/yr (up to 5); monthly stays at $5. Offer them at month-1 day 20 and on the paywall. Yearly billing cuts the Stripe per-charge fee.
- **Do not turn on enforcement until** Stripe keys are in and Checkout is tested in test mode. Announce "free month" in launch posts regardless; users already in trial keep the date they started.
- Pricing wording is in flux (see decision on annual-led pricing); keep landing, billing page and support bot in sync.

## 4. Channels ranked (effort vs payoff)

| # | Channel | Effort | Payoff | Notes |
|---|---------|--------|--------|-------|
| 1 | Alpha parent hub + Discord + parent group chats | Low | High (trust, first 30 users) | Personal ask, hand-issue codes |
| 2 | Short video of the page printing (TikTok/Reels/Shorts/X) | Medium | High, spiky | The product is visual; best top-of-funnel asset |
| 3 | X (@Jon account or product account) build-in-public | Low | Medium | Founder story, daily sample page, pairs with video |
| 4 | Reddit / Facebook parent + homeschool groups | Medium | Medium | Give a free sample, never spam; read each group's rules first |
| 5 | Product Hunt / Hacker News "Show HN" | Medium | Spike, mixed fit | Do after 20+ happy users and testimonials |
| 6 | Substack/newsletter parent bloggers (screen-free, homeschool) | Medium | Medium | Offer free year plus `FOUNDING` codes; ask for honest review |
| 7 | SEO: printable daily "Sample Page" + module pages (/modules/*) | Higher | Slow compounding | Index module pages; add a free "today's sample" public page |
| 8 | Paid ads | High | Low now | Skip until paid conversion is known |

### Week 1 (get 20-30 real families)
1. Mon: Enable a public **Try it free without signing up** path check; confirm landing sample, OG card, and signup work on iPhone.
2. Mon: Create the three code batches in Admin. Add a `?ref=` or `?code=` param to the landing URL if cheap, otherwise just give codes in text.
3. Tue: Post to Alpha hub + Discord (copy A). DM 10 parents Jon knows, with a code.
4. Tue-Wed: Record 3 print videos (see section 5). Post one to X, one to TikTok/Reels.
5. Wed-Fri: Ask each early user for one fridge photo and one sentence. Reply to every signup personally.
6. Fri: Add analytics events (section 6) so week 2 has data.

### Weeks 2-4
- **Wk 2:** Post X launch thread (copy B). Post to 3 parent/homeschool communities with the free sample, not a pitch. Publish a public "Today's Page" sample (daily, no signup).
- **Wk 2-3:** Email 5-10 screen-free/homeschool bloggers with a founding code. Start referral codes.
- **Wk 3:** Case study: "What a week of pages looks like for a 9-year-old" (real fridge photos, with parent permission). Test the annual offer on trial day 20.
- **Wk 4:** Review funnel. Double down on the one channel with the best signup-to-print rate. Decide on Product Hunt based on testimonials.
- Goal by day 30: 100 signups, 60% print at least one page, 15-25 paying after trial (rough targets, adjust to data).

## 5. Content ideas

- **Print video (hero):** phone view of printer chugging out the page, hand tears it off, kid starts the maze. 10-20 seconds, no voiceover needed. Variants: the 58mm strip unspooling (novelty, shareable) and a normal Letter printer.
- **Before/after:** "7:30am phone scroll" vs. "7:30am kid with pencil and crossword."
- **Sample pages:** daily public page as a PNG/PDF (Today's Page); module spotlights: Battleship, themed crossword, state outlines, cryptogram, Animal of the Day.
- **Founder angle:** "I built this for my kid" with the real page (Jon has approved using Max's real page; no name shown on Letter).
- **Kid reactions:** with consent only; face-free hand shots work as well.
- **Mini-posts:** "Today's riddle / sequence / scramble" with the answer in a reply. Cheap, daily, drives repeat visits.
- **Behind the scenes:** how real news is rewritten and fact-checked for kids (builds trust with skeptical parents).

## 6. Pre-written launch copy (drafts, unposted)

**A. Parent community (Alpha hub / Discord / group)**
> Hey parents. I built something for my kid and some of you asked about it. It's called Back of the Box: every morning it emails a fresh one-page puzzle sheet (maze, crossword, sudoku, a real kid-safe news story from NASA/Smithsonian, a joke, the weather) tuned to your kid's age. You print it on any normal printer, and answers sit behind a QR code so they solve first. No kid accounts, no ads, no screen. First month's free, then from $20 a year. Here's a code for Alpha families (2 months free): ALPHA-XXXX. I'd love honest feedback, especially on difficulty. Link: [url]

**B. X post (thread opener, then 3 follow-ups: sample image, how it works, offer)**
> I built a tiny daily newspaper for my kid.
> Every morning: maze, crossword, sudoku, a real news story rewritten for kids, weather. Prints on any home printer.
> No screens, no ads, no kid accounts.
> First month free. [url] 🧵

**C. Short-video script (15-20s)**
- 0-2s: Close-up of printer feeding paper. On screen: "My kid's morning paper."
- 2-6s: Page slides out. Hand tears it off, drops it by the cereal bowl.
- 6-12s: Quick cuts: kid's pencil on the maze, circled crossword answer, QR scan on parent's phone for the answer key.
- 12-17s: Text: "New page every day. Real news. No screen."
- 17-20s: "Back of the Box. First month free. Link in bio."
Caption: "Set up once, new page every morning. Works on any printer."

## 7. Funnel metrics and instrumentation

Funnel: **visit -> try/sample or signup -> dispatch created -> first PDF delivered -> first print -> day-7 active -> paid after trial.**

Already exists: `botb_events` table, PageTracker beacon -> /api/track, `email_sent` events, admin Usage tab, plan counts in Admin.

Add (small):
- `signup` (first sign-in) and `dispatch_created` events with `source` (utm_source / ?code= / ref).
- `pdf_opened` / `print_clicked` (render with `auto=1` or Save-as-PDF) and `qr_answers_viewed`. Email open tracking is unreliable; use link click as the first-print proxy.
- `code_redeemed` with code batch; `checkout_started`, `paid` (Stripe webhook), `churned`.
- UTM capture on landing stored with the user record; weekly Monday summary from the Admin Usage tab.

Targets to watch: visit->signup 5-10%; signup->dispatch created 70%; created->first print 60%; trial->paid 20-35% (small base, expect noise).

## 8. Risks

- **Kid privacy / COPPA:** Kids never log in; parents are the users; only a name and age range are collected for a kid; "no ads, no tracking" refers to the paper itself. Say this plainly on landing (a separate terms page isn't needed: parents only connect an email). Do not use kid names/photos in marketing without parent consent. Avoid wording like "collects child data"; say "profiles, not accounts."
- **Printer requirement:** the biggest perceived friction. Message: "Letter works with any printer, no special hardware. No printer? Point to the supplies page." Offer "email it, print it at the library/office" as fallback. Include a 1-line "no printer? read it on screen" if that holds.
- **Daily reliability:** a missed morning kills trust. Keep the outage monitor, send a status note when something fails.
- **News safety/accuracy:** one bad story is a screenshot on social media. Keep the fact-check pass; add a "report a story" link.
- **Ink/paper cost** and "one more thing to do every morning": counter with a "print 3 days at once" option.
- **Churn / novelty decay:** variety across 25+ modules and age-dial tuning are the defense; track day-30 retention.
- **Single founder bandwidth:** keep to 2 channels at a time.
- **Name/domain confusion:** repo and Vercel URL still say tearaway; ensure all public links use backofthebox.xyz.

## 9. Jon must decide

1. Go-live date and who is the "face": personal account vs. a @backofthebox account.
2. Final pricing: yearly tiers $20 (up to 2 kids) / $30 (up to 5) and whether to keep $5/mo, and whether free month needs a card (card up front lifts conversion but cuts signups).
3. Turn on Stripe enforcement: when, and grandfather rules for existing users.
4. Referral reward (+1 month each side?) and caps; approve building the referral code feature.
5. Which families/photos/videos you're comfortable showing (Max's page, photos of Max, fridge shots), and ask parents for consent.
6. Whether to post in the Alpha hub / school channels (check school's rules on promotion to parents) and tone, since you are a parent, not a vendor, there.
7. Whether to approach bloggers/influencers and what free-access you'll offer.
8. Optional later: a short privacy note.
9. Product Hunt/HN: yes or no, and when.
