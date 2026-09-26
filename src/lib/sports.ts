import { loadPayload, savePayload } from "./persist";

/**
 * Favorite-team sports results via TheSportsDB (free tier key "3" by default;
 * set SPORTSDB_KEY for a paid key). A team's last result + next fixture, cached
 * per day. Returns nothing (never fabricates) when a team can't be resolved or
 * the API is unavailable.
 */
export interface SportsTeamResult {
  team: string;
  league: string;
  sport: string;
  /** e.g. "Arsenal 2–1 Chelsea · Sep 6" */
  last?: string;
  /** e.g. "vs Leeds United · Oct 10" */
  next?: string;
}

function key(): string {
  return process.env.SPORTSDB_KEY || "3";
}
function utcDate(): string {
  return new Date().toISOString().slice(0, 10);
}
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
function shortDate(iso?: string): string {
  if (!iso) return "";
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso);
  if (!m) return "";
  return `${MONTHS[Number(m[2]) - 1] ?? ""} ${Number(m[3])}`.trim();
}

interface TeamRef {
  id: string;
  team: string;
  league: string;
  sport: string;
}

async function resolveTeam(name: string): Promise<TeamRef | null> {
  const norm = name.trim();
  if (!norm) return null;
  const cacheKey = `sportsteam:${norm.toLowerCase()}`;
  const cached = await loadPayload<TeamRef | { none: true }>(cacheKey);
  if (cached) return "none" in cached ? null : (cached as TeamRef);
  try {
    const res = await fetch(
      `https://www.thesportsdb.com/api/v1/json/${key()}/searchteams.php?t=${encodeURIComponent(norm)}`,
    );
    if (!res.ok) return null;
    const data = (await res.json()) as { teams?: Record<string, string>[] };
    const t = data.teams?.[0];
    // Guard against fuzzy mis-matches (e.g. "LA Lakers" → some unrelated team):
    // require the query to overlap the returned name, else treat as not found.
    const returned = (t?.strTeam || "").toLowerCase();
    const q = norm.toLowerCase();
    const overlaps =
      returned.includes(q) ||
      q.split(/\s+/).filter((w) => w.length >= 3).some((w) => returned.includes(w));
    if (!t?.idTeam || !overlaps) {
      await savePayload(cacheKey, { none: true });
      return null;
    }
    const ref: TeamRef = {
      id: String(t.idTeam),
      team: t.strTeam || norm,
      league: t.strLeague || "",
      sport: t.strSport || "",
    };
    await savePayload(cacheKey, ref);
    return ref;
  } catch {
    return null;
  }
}

async function fetchJson<T>(url: string): Promise<T | null> {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

async function getTeamResult(ref: TeamRef): Promise<SportsTeamResult> {
  const out: SportsTeamResult = { team: ref.team, league: ref.league, sport: ref.sport };
  const base = `https://www.thesportsdb.com/api/v1/json/${key()}`;
  const last = await fetchJson<{ results?: Record<string, string>[] }>(
    `${base}/eventslast.php?id=${ref.id}`,
  );
  const e = last?.results?.[0];
  if (e) {
    // From the team's own perspective — the header already names the team, so
    // the line stays short: "2–1 vs Chelsea · Sep 6".
    const weHome = e.strHomeTeam === ref.team;
    const opp = (weHome ? e.strAwayTeam : e.strHomeTeam) ?? "";
    const os = weHome ? e.intHomeScore : e.intAwayScore;
    const ts = weHome ? e.intAwayScore : e.intHomeScore;
    const head = os != null && ts != null ? `${os}–${ts} vs ${opp}` : `vs ${opp}`;
    out.last = `${head}${shortDate(e.dateEvent) ? ` · ${shortDate(e.dateEvent)}` : ""}`;
  }
  const next = await fetchJson<{ events?: Record<string, string>[] }>(
    `${base}/eventsnext.php?id=${ref.id}`,
  );
  const n = next?.events?.[0];
  if (n) {
    const opp = n.strHomeTeam === ref.team ? n.strAwayTeam : n.strHomeTeam;
    out.next = `vs ${opp ?? ""}${shortDate(n.dateEvent) ? ` · ${shortDate(n.dateEvent)}` : ""}`.trim();
  }
  return out;
}

/** Resolve + fetch results for a kid's favorite teams (cap 3), cached per day. */
export async function gatherSports(teams: string[]): Promise<SportsTeamResult[] | undefined> {
  const list = teams.map((t) => t.trim()).filter(Boolean).slice(0, 3);
  if (list.length === 0) return undefined;
  const date = utcDate();
  const out: SportsTeamResult[] = [];
  for (const name of list) {
    const ck = `sports:${name.toLowerCase()}:${date}`;
    const cached = await loadPayload<SportsTeamResult>(ck);
    if (cached) {
      out.push(cached);
      continue;
    }
    const ref = await resolveTeam(name);
    if (!ref) continue;
    const r = await getTeamResult(ref);
    await savePayload(ck, r);
    out.push(r);
  }
  return out.length ? out : undefined;
}
