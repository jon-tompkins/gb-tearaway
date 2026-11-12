import { accessFor } from "@/lib/billing";
import { dateISOInZone } from "@/lib/dates";
import { INTERESTS, LEVELS, addIfFits, pickFromInterests } from "@/lib/interests";
import { MODULE_CATALOG, isModuleId, moduleAudience, moduleById } from "@/lib/modules";
import { moduleExample } from "@/lib/moduleExample";
import { createRun, runUrls } from "@/lib/runs";
import { renderPdfFromUrl } from "@/lib/pdf";
import { sendOneDispatch } from "@/lib/sendDispatch";
import { packModulesIntoSlots, flattenSlotModules } from "@/lib/slots";
import { patchStore, readStore } from "@/lib/store";
import { DEFAULT_SETTINGS, isKidActive, type AgeBand, type DeliveryMethod, type KidProfile, type ModuleId } from "@/lib/types";
import { getHiddenModules } from "@/lib/visibility";

/**
 * Tools the assistant can call. Plain words in/out; ids are stable so the model can chain calls.
 * MCP_REQUIRE_PLAN=1 gates the write tools behind an active plan (off while testing).
 */

export interface Ctx {
  userKey: string;
  email: string;
  origin: string;
}

type Json = Record<string, unknown>;
export interface Tool {
  name: string;
  title: string;
  description: string;
  inputSchema: Json;
  readOnly: boolean;
  run: (args: Json, ctx: Ctx) => Promise<unknown>;
}

const LEVEL_KEYS = LEVELS.map((l) => l.key);
const levelBand = (k: unknown): AgeBand | undefined => LEVELS.find((l) => l.key === k)?.id;
const levelKey = (b: AgeBand) => LEVELS.find((l) => l.id === b)?.key ?? "medium";
const str = (v: unknown, max = 80) => (typeof v === "string" ? v.trim().slice(0, max) : undefined);
const strList = (v: unknown) => (Array.isArray(v) ? v.filter((x): x is string => typeof x === "string") : []);

class ToolError extends Error {}
class Attach { constructor(public info: unknown, public extra: Json) {} }

async function requirePlan(ctx: Ctx) {
  if (process.env.MCP_REQUIRE_PLAN !== "1") return;
  const a = await accessFor(ctx.userKey);
  if (!a.active) throw new ToolError("This needs an active Back of the Box plan. Start one at https://www.backofthebox.xyz/app/billing");
}

function summary(k: KidProfile) {
  const ids = flattenSlotModules(k.slots);
  return {
    id: k.id,
    name: k.name,
    difficulty: levelKey(k.ageBand),
    daily_delivery: isKidActive(k) ? "on" : "off",
    delivery: k.deliveryMethod,
    send_to: k.deliveryEmail ?? null,
    time: k.printTime,
    timezone: k.timezone,
    cards: ids.map((id) => ({ id, name: moduleById(id).name })),
  };
}

async function findKid(ctx: Ctx, pageId: unknown) {
  const store = await readStore(ctx.userKey);
  const kid = typeof pageId === "string" && pageId ? store.kids.find((k) => k.id === pageId) : store.kids.find((k) => k.id === store.activeKidId) ?? store.kids[0];
  if (!kid) throw new ToolError(pageId ? `No page with id ${String(pageId)}. Use list_pages.` : "No pages yet. Use build_page to make one.");
  return { store, kid };
}

function resolveCards(args: Json, kidFriendly: boolean): { cards: ModuleId[]; unknown: string[] } {
  const unknown: string[] = [];
  const explicit: ModuleId[] = [];
  for (const id of strList(args.modules)) (isModuleId(id) ? explicit.push(id) : unknown.push(id));
  const chosen = INTERESTS.filter((i) => strList(args.interests).includes(i.id) && (kidFriendly || !i.kidsOnly));
  for (const i of strList(args.interests)) if (!INTERESTS.some((x) => x.id === i)) unknown.push(i);
  return { cards: pickFromInterests(chosen, explicit), unknown };
}

const deliveryOf = (v: unknown): DeliveryMethod | undefined => (v === "email" || v === "app" ? v : undefined);

export const TOOLS: Tool[] = [
  {
    name: "list_interests",
    title: "List interests and difficulty levels",
    description: "The plain-language interests (like 'Crosswords & word games') and difficulty levels you can use with build_page. Call this first when someone describes what they like.",
    inputSchema: { type: "object", properties: {} },
    readOnly: true,
    run: async () => ({
      interests: INTERESTS.map((i) => ({ id: i.id, title: i.title, includes: i.blurb, kids_only: !!i.kidsOnly })),
      difficulty_levels: LEVELS.map((l) => ({ id: l.key, title: l.title, meaning: l.blurb })),
      note: "Difficulty is about the puzzle level, not the person's age. Older adults may prefer 'easier'; never describe it as 'for kids'.",
    }),
  },
  {
    name: "list_modules",
    title: "List every card type",
    description: "All the card types (crossword, sudoku, poem, weather, …) with ids you can pass as `modules`.",
    inputSchema: { type: "object", properties: { audience: { type: "string", enum: ["all", "kids"], description: "'all' = suitable for adults and seniors." } } },
    readOnly: true,
    run: async (a) => {
      const hidden = new Set<string>(await getHiddenModules().catch(() => []));
      return MODULE_CATALOG.filter((m) => !hidden.has(m.id) && (a.audience !== "all" || moduleAudience(m.id) === "all")).map((m) => ({
        id: m.id, name: m.name, about: m.blurb, audience: moduleAudience(m.id), size: m.size,
      }));
    },
  },
  {
    name: "preview_card",
    title: "Preview a card",
    description: "Show a short text sample of one card type so the person can decide if they want it. Also returns a link with the full picture.",
    inputSchema: { type: "object", properties: { id: { type: "string" } }, required: ["id"] },
    readOnly: true,
    run: async (a, ctx) => {
      const id = str(a.id);
      if (!id || !isModuleId(id)) throw new ToolError("Unknown card id. Use list_modules.");
      let text: string[] | undefined;
      try { text = moduleExample(id).text?.slice(0, 8); } catch { /* picture-only card */ }
      return { id, name: moduleById(id).name, about: moduleById(id).blurb, sample_text: text ?? null, see_it: `${ctx.origin}/modules/${id}` };
    },
  },
  {
    name: "list_pages",
    title: "List their pages",
    description: "The person's Back of the Box pages (each is one daily page for one person), with cards, difficulty and delivery settings.",
    inputSchema: { type: "object", properties: {} },
    readOnly: true,
    run: async (_a, ctx) => {
      const store = await readStore(ctx.userKey);
      return { pages: store.kids.map(summary), weather_zip: store.settings.weatherZip ?? null };
    },
  },
  {
    name: "build_page",
    title: "Build a new page",
    description:
      "Create a new daily page from plain-language interests (see list_interests) and/or specific card ids. Fits as many cards as the page holds and adds the weather. It is created with daily delivery OFF; call update_page with active=true only after the person agrees to start receiving it.",
    inputSchema: {
      type: "object",
      properties: {
        name: { type: "string", description: "Who it's for, e.g. 'Grandpa Joe'. Use 'My page' for the user themselves." },
        interests: { type: "array", items: { type: "string" }, description: "Interest ids from list_interests." },
        modules: { type: "array", items: { type: "string" }, description: "Optional exact card ids from list_modules." },
        difficulty: { type: "string", enum: LEVEL_KEYS },
        for_child: { type: "boolean", description: "Allow kid-focused cards (mazes, animals, jokes). Default false." },
        zip: { type: "string", description: "US zip code, for the weather card." },
        delivery: { type: "string", enum: ["email", "app"], description: "email = PDF by email, app = wait in the dashboard." },
        email: { type: "string" },
        time: { type: "string", description: "Local delivery time HH:MM, e.g. 07:00" },
      },
      required: ["name"],
    },
    readOnly: false,
    run: async (a, ctx) => {
      await requirePlan(ctx);
      const name = str(a.name, 40);
      if (!name) throw new ToolError("name is required");
      const { cards, unknown } = resolveCards(a, a.for_child === true);
      if (!cards.length) throw new ToolError("Pick at least one interest or card. Call list_interests for options.");
      const zip = str(a.zip, 10);
      const time = str(a.time, 5);
      const store = await readStore(ctx.userKey);
      const next = await patchStore(ctx.userKey, {
        ...(zip ? { settings: { ...store.settings, weatherZip: zip } } : {}),
        createKid: {
          name,
          ageBand: levelBand(a.difficulty) ?? "7-9",
          paperSize: DEFAULT_SETTINGS.paperSize,
          slots: packModulesIntoSlots(cards, DEFAULT_SETTINGS.paperSize),
          printTime: time && /^\d{2}:\d{2}$/.test(time) ? time : DEFAULT_SETTINGS.printTime,
          deliveryMethod: deliveryOf(a.delivery) ?? "email",
          deliveryEmail: str(a.email, 120) || ctx.email,
          timezone: store.settings.timezone || DEFAULT_SETTINGS.timezone,
          status: "inactive",
        },
      });
      const kid = next.kids[next.kids.length - 1];
      return { created: summary(kid), ignored_unknown: unknown, next: "Show them get_todays_page to see it. Ask before turning on daily delivery." };
    },
  },
  {
    name: "update_page",
    title: "Change a page",
    description: "Change an existing page: rename, difficulty, add or remove cards, delivery time/email, or turn daily delivery on/off (active). Omit page_id to use the most recent page.",
    inputSchema: {
      type: "object",
      properties: {
        page_id: { type: "string" },
        name: { type: "string" },
        difficulty: { type: "string", enum: LEVEL_KEYS },
        add_modules: { type: "array", items: { type: "string" } },
        add_interests: { type: "array", items: { type: "string" } },
        remove_modules: { type: "array", items: { type: "string" } },
        delivery: { type: "string", enum: ["email", "app"] },
        email: { type: "string" },
        time: { type: "string" },
        zip: { type: "string" },
        active: { type: "boolean", description: "true starts daily delivery, false pauses it." },
      },
    },
    readOnly: false,
    run: async (a, ctx) => {
      await requirePlan(ctx);
      const { store, kid } = await findKid(ctx, a.page_id);
      const patch: Partial<KidProfile> & { id: string } = { id: kid.id };
      const name = str(a.name, 40); if (name) patch.name = name;
      const band = levelBand(a.difficulty); if (band) patch.ageBand = band;
      const d = deliveryOf(a.delivery); if (d) patch.deliveryMethod = d;
      const email = str(a.email, 120); if (email) patch.deliveryEmail = email;
      const time = str(a.time, 5); if (time && /^\d{2}:\d{2}$/.test(time)) patch.printTime = time;
      if (typeof a.active === "boolean") patch.status = a.active ? "active" : "inactive";

      const skipped: string[] = [];
      const remove = new Set(strList(a.remove_modules));
      const adds = resolveCards({ modules: a.add_modules, interests: a.add_interests }, true);
      if (remove.size || adds.cards.length) {
        const cards = flattenSlotModules(kid.slots).filter((id) => !remove.has(id));
        for (const id of adds.cards) if (!addIfFits(cards, id)) skipped.push(id);
        patch.slots = packModulesIntoSlots(cards, kid.paperSize || DEFAULT_SETTINGS.paperSize);
      }
      const zip = str(a.zip, 10);
      const next = await patchStore(ctx.userKey, { kid: patch, ...(zip ? { settings: { ...store.settings, weatherZip: zip } } : {}) });
      const updated = next.kids.find((k) => k.id === kid.id)!;
      return {
        page: summary(updated),
        not_added_page_full_or_duplicate: skipped,
        ignored_unknown: adds.unknown,
        ...(patch.status === "active" && !isKidActive(updated) ? { warning: "Could not start daily delivery. It needs an active plan." } : {}),
      };
    },
  },
  {
    name: "get_todays_page",
    title: "Get today's page",
    description: "Build today's page and return links: `view` to look at it, `print` to open the print dialog, `pdf` to download. Share these links with the person.",
    inputSchema: { type: "object", properties: { page_id: { type: "string" }, attach_pdf: { type: "boolean", description: "Attach the PDF file itself (default true)." } } },
    readOnly: false,
    run: async (a, ctx) => {
      const { store, kid } = await findKid(ctx, a.page_id);
      const date = dateISOInZone(kid.timezone || store.settings.timezone);
      const { token } = await createRun({ userKey: ctx.userKey, kidId: kid.id, date, kidName: kid.name, delivery: kid.deliveryMethod === "app" ? "app" : "email" });
      const u = runUrls(token);
      const info = { page: kid.name, date, view: u.view, print: u.print, pdf: u.pdf };
      // Also attach the PDF itself so clients that can show embedded files do, not just a link.
      const pdf = a.attach_pdf === false ? null : await renderPdfFromUrl(u.view).catch(() => null);
      if (!pdf) return info;
      const slug = kid.name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
      return new Attach(info, { type: "resource", resource: { uri: u.pdf, name: `back-of-the-box-${slug}-${date}.pdf`, mimeType: "application/pdf", blob: Buffer.from(pdf).toString("base64") } });
    },
  },
  {
    name: "email_todays_page",
    title: "Email today's page",
    description: "Email today's page (PDF attached) to the page's address. Use when the person wants it sent to them right now.",
    inputSchema: { type: "object", properties: { page_id: { type: "string" } } },
    readOnly: false,
    run: async (a, ctx) => {
      await requirePlan(ctx);
      const { kid } = await findKid(ctx, a.page_id);
      if (!kid.deliveryEmail && !ctx.email) throw new ToolError("No email on this page. Set one with update_page.");
      const r = await sendOneDispatch({ userKey: ctx.userKey, kidId: kid.id }, { force: true });
      if (r.status === "sent") return { sent_to: kid.deliveryEmail, pdf_attached: r.withPdf };
      if (r.status === "saved") return { saved: true, note: "This page is set to app delivery, so nothing was emailed. Use get_todays_page for links." };
      throw new ToolError(r.status === "skipped" ? `Not sent: ${r.reason}. Set an email or delivery with update_page.` : `Email failed: ${r.reason}`);
    },
  },
  {
    name: "make_booklet",
    title: "Puzzle booklet link",
    description: "A printable multi-page puzzle booklet. Returns a link (the person opens it while signed in to Back of the Box).",
    inputSchema: {
      type: "object",
      properties: {
        kinds: { type: "array", items: { type: "string" }, description: "Any of maze, sudoku, wordfind, crossword, logicgrid, numbercross, battleship, … Omit for a mix of all." },
        pages: { type: "number", description: "Pages, default 25." },
        difficulty: { type: "number", description: "1 (easiest) to 20." },
        doubled_up: { type: "boolean", description: "Two small puzzles per page." },
      },
    },
    readOnly: true,
    run: async (a, ctx) => {
      const q = new URLSearchParams({ format: "pdf" });
      const kinds = strList(a.kinds);
      if (kinds.length) q.set("kinds", kinds.join(","));
      if (typeof a.pages === "number") q.set("pages", String(Math.round(a.pages)));
      if (typeof a.difficulty === "number") q.set("d", String(Math.round(a.difficulty)));
      if (a.doubled_up === true) q.set("layout", "half");
      return { pdf: `${ctx.origin}/api/booklet?${q}`, preview: `${ctx.origin}/api/booklet?${q}`.replace("format=pdf", "format=html"), note: "Opens in their browser; they need to be signed in to Back of the Box." };
    },
  },
];

export async function callTool(name: string, args: Json, ctx: Ctx): Promise<{ content: Json[]; isError?: boolean }> {
  const tool = TOOLS.find((t) => t.name === name);
  if (!tool) return { content: [{ type: "text", text: `Unknown tool ${name}` }], isError: true };
  try {
    const out = await tool.run(args ?? {}, ctx);
    if (out instanceof Attach) return { content: [{ type: "text", text: JSON.stringify(out.info, null, 2) }, out.extra] };
    return { content: [{ type: "text", text: JSON.stringify(out, null, 2) }] };
  } catch (e) {
    const msg = e instanceof ToolError ? e.message : e instanceof Error ? e.message : "Something went wrong";
    return { content: [{ type: "text", text: msg }], isError: true };
  }
}
