/**
 * Coloring-page line art for Animal of the Day. Each animal is drawn from a
 * handful of parameterised body plans (four-legged, bird, fish, …) so one
 * template covers a whole family. Black outlines on white, thick round strokes —
 * made to be colored in with crayons, so the shapes are simple and cartoon-like.
 */
export type Ears = "none" | "point" | "round" | "long" | "floppy" | "small";
export type Tail = "none" | "curl" | "thin" | "bushy" | "tuft" | "stub" | "long";

export interface QuadSpec {
  plan: "quad";
  /** body half-width / half-height */
  rx: number;
  ry: number;
  legH: number;
  legW?: number;
  headR: number;
  /** neck rises by neckUp px and sticks out neckOut px in front of the body */
  neckUp?: number;
  neckOut?: number;
  ears?: Ears;
  tail?: Tail;
  snout?: "none" | "short" | "long" | "pig" | "trunk" | "duck";
  horns?: "none" | "horns" | "antlers" | "single" | "ossicones" | "small";
  mane?: boolean;
  stripes?: boolean;
  spots?: boolean;
  hump?: number;
  tusks?: boolean;
  whiskers?: boolean;
  patch?: "panda" | "mask";
  wool?: boolean;
}
export interface BirdSpec {
  plan: "bird";
  beak: "short" | "hook" | "flat" | "long" | "big" | "pointy";
  legs: "short" | "long" | "none";
  crest?: boolean;
  tail?: "fan" | "short";
  wings?: "folded" | "wide";
  penguin?: boolean;
  owl?: boolean;
  longNeck?: boolean;
}
export interface FishSpec {
  plan: "fish";
  kind: "fish" | "shark" | "whale" | "dolphin" | "clown" | "seahorse";
}
export interface MiscSpec {
  plan: "octopus" | "jelly" | "crab" | "star" | "turtle" | "frog" | "snake" | "butterfly" | "ladybug" | "bee" | "spider" | "snail";
}
export type AnimalSpec = QuadSpec | BirdSpec | FishSpec | MiscSpec;

const S = `fill="#fff" stroke="#111" stroke-width="2.4" stroke-linejoin="round" stroke-linecap="round"`;
const SK = `fill="none" stroke="#111" stroke-width="2.4" stroke-linejoin="round" stroke-linecap="round"`;
const F = `fill="#111"`;
const f = (n: number) => Math.round(n * 10) / 10;
const ell = (cx: number, cy: number, rx: number, ry: number, extra = "") =>
  `<ellipse cx="${f(cx)}" cy="${f(cy)}" rx="${f(rx)}" ry="${f(ry)}" ${S} ${extra}/>`;
const circ = (cx: number, cy: number, r: number) => `<circle cx="${f(cx)}" cy="${f(cy)}" r="${f(r)}" ${S}/>`;
const eye = (x: number, y: number, r = 2.6) => `<circle cx="${f(x)}" cy="${f(y)}" r="${r}" ${F}/>`;
const path = (d: string, fill = false) => `<path d="${d}" ${fill ? S : SK}/>`;
const poly = (pts: number[][], fill = true) =>
  `<polygon points="${pts.map(([x, y]) => `${f(x)},${f(y)}`).join(" ")}" ${fill ? S : SK}/>`;
const rrect = (x: number, y: number, w: number, h: number, r: number) =>
  `<rect x="${f(x)}" y="${f(y)}" width="${f(w)}" height="${f(h)}" rx="${f(r)}" ${S}/>`;

const wrap = (inner: string, label: string, vb = "0 0 240 160") =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${vb}" role="img" aria-label="${label}">${inner}</svg>`;

// ── four-legged ──────────────────────────────────────────────────────────────
function quad(p: QuadSpec, label: string): string {
  const ground = 148;
  const legW = p.legW ?? Math.max(10, p.rx * 0.2);
  const cy = ground - p.legH - p.ry + 8;
  const cx = 128;
  const bodyTop = cy - p.ry;
  const neckUp = p.neckUp ?? 0;
  const neckOut = p.neckOut ?? p.headR * 0.6;
  const hx = cx - p.rx * 0.78 - neckOut;
  const hy = Math.max(p.headR + 6, bodyTop + p.ry * 0.2 - neckUp);
  const out: string[] = [];
  // tail (behind)
  const tx = cx + p.rx - 4;
  const ty = cy - p.ry * 0.3;
  switch (p.tail ?? "thin") {
    case "curl": out.push(path(`M${tx},${ty} q22,-6 12,-24 q-6,-8 -14,0`)); break;
    case "thin": out.push(path(`M${tx},${ty + 4} q18,6 20,28`)); out.push(circ(tx + 20, ty + 34, 4)); break;
    case "long": out.push(path(`M${tx},${ty + 4} q26,4 22,40`)); break;
    case "bushy": out.push(`<path d="M${tx - 2},${ty + 8} q44,-8 34,-40 q-24,6 -34,40z" ${S}/>`); break;
    case "tuft": out.push(path(`M${tx},${ty + 4} q16,10 12,30`)); out.push(`<path d="M${tx + 6},${ty + 30} l6,10 l6,-10 q-6,-6 -12,0z" ${S}/>`); break;
    case "stub": out.push(circ(tx + 5, ty + 6, 6)); break;
    default: break;
  }
  // far legs (a touch higher) then near legs
  const xs = [-0.55, -0.28, 0.3, 0.57];
  for (const k of xs) {
    const lx = cx + p.rx * k - legW / 2;
    out.push(rrect(lx, cy + p.ry * 0.4, legW, ground - (cy + p.ry * 0.4), legW * 0.4));
  }
  // neck
  if (neckUp > 8) {
    const sx = cx - p.rx * 0.45;
    const w = Math.max(14, p.headR * 1.05);
    out.push(poly([[sx - w * 0.5, cy - p.ry * 0.7], [sx + w * 0.6, cy - p.ry * 0.7], [hx + w * 0.55, hy + p.headR * 0.5], [hx - w * 0.45, hy + p.headR * 0.5]]));
  }
  // body
  out.push(ell(cx, cy, p.rx, p.ry));
  if (p.hump) out.push(path(`M${cx - p.rx * 0.1},${bodyTop + 1} q${p.rx * 0.28},-${p.hump * 1.6} ${p.rx * 0.56},0`, true));
  if (p.wool) {
    for (let i = 0; i < 7; i++) {
      const a = (Math.PI * (i + 0.5)) / 7 + Math.PI;
      out.push(circ(cx + Math.cos(a) * p.rx * 0.9, cy + Math.sin(a) * p.ry * 0.86, p.ry * 0.28));
    }
  }
  if (p.stripes) {
    for (let i = -2; i <= 2; i++) {
      const x = cx + i * p.rx * 0.27;
      out.push(path(`M${f(x - 4)},${f(cy - p.ry * 0.95)} q8,${p.ry * 0.9} -2,${p.ry * 1.85}`));
    }
  }
  if (p.spots) {
    for (const [sx, sy, sr] of [[-0.35, -0.25, 0.2], [0.15, 0.15, 0.24], [0.5, -0.2, 0.17], [-0.05, -0.55, 0.13], [0.55, 0.35, 0.12]])
      out.push(ell(cx + p.rx * sx, cy + p.ry * sy, p.ry * sr * 1.3, p.ry * sr));
  }
  // mane (behind head)
  if (p.mane) {
    const pts: string[] = [];
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2;
      const r1 = p.headR * 1.9;
      const r2 = p.headR * 1.45;
      pts.push(`${f(hx + Math.cos(a) * r1)},${f(hy + Math.sin(a) * r1)}`, `${f(hx + Math.cos(a + Math.PI / 12) * r2)},${f(hy + Math.sin(a + Math.PI / 12) * r2)}`);
    }
    out.push(`<polygon points="${pts.join(" ")}" ${S}/>`);
  }
  // horns / antlers / ears behind head
  const hr = p.headR;
  switch (p.horns) {
    case "horns":
      out.push(path(`M${hx - hr * 0.4},${hy - hr * 0.8} q-12,-16 -2,-24`));
      out.push(path(`M${hx + hr * 0.5},${hy - hr * 0.8} q12,-16 4,-24`));
      break;
    case "antlers":
      for (const s of [-1, 1]) {
        const bx = hx + s * hr * 0.4;
        out.push(path(`M${bx},${hy - hr * 0.8} l${s * 6},-26 m-${s * 3},10 l${s * -10},-8 m${s * 10},-2 l${s * 8},-12`));
      }
      break;
    case "single": out.push(poly([[hx - 6, hy - hr * 0.8], [hx + 6, hy - hr * 0.8], [hx - 14, hy - hr * 1.9]])); break;
    case "ossicones":
      for (const s of [-1, 1]) { out.push(path(`M${hx + s * 6},${hy - hr * 0.9} l${s * 2},-12`)); out.push(circ(hx + s * 8, hy - hr * 0.9 - 14, 3.5)); }
      break;
    case "small":
      for (const s of [-1, 1]) out.push(path(`M${hx + s * hr * 0.55},${hy - hr * 0.8} l${s * 4},-12`));
      break;
    default: break;
  }
  const earY = hy - hr * 0.85;
  switch (p.ears) {
    case "point": for (const s of [-1, 1]) out.push(poly([[hx + s * hr * 0.2, earY + 6], [hx + s * hr * 0.95, earY + 8], [hx + s * hr * 0.85, earY - 16]])); break;
    case "round": for (const s of [-1, 1]) out.push(circ(hx + s * hr * 0.8, earY + 4, hr * 0.38)); break;
    case "long": for (const s of [-1, 1]) out.push(ell(hx + s * hr * 0.45, earY - 14, hr * 0.28, hr * 1.0, `transform="rotate(${s * 12} ${f(hx + s * hr * 0.45)} ${f(earY - 14)})"`)); break;
    case "floppy": for (const s of [-1, 1]) out.push(ell(hx + s * hr * 0.95, hy + hr * 0.1, hr * 0.28, hr * 0.7, `transform="rotate(${s * -12} ${f(hx + s * hr * 0.95)} ${f(hy)})"`)); break;
    case "small": for (const s of [-1, 1]) out.push(circ(hx + s * hr * 0.7, earY + 8, hr * 0.25)); break;
    default: break;
  }
  // head
  out.push(circ(hx, hy, hr));
  if (p.patch === "mask") out.push(`<path d="M${hx - hr * 0.8},${hy - hr * 0.1} q${hr * 0.8},-${hr * 0.5} ${hr * 1.6},0 q-${hr * 0.2},${hr * 0.3} -${hr * 0.4},${hr * 0.2} q-${hr * 0.4},-${hr * 0.15} -${hr * 0.8},0 q-${hr * 0.2},${hr * 0.1} -${hr * 0.4},-${hr * 0.2}z" ${S}/>`);
  if (p.patch === "panda") { for (const s of [-1, 1]) out.push(ell(hx + s * hr * 0.42, hy - hr * 0.05, hr * 0.22, hr * 0.3, `fill="#111"`)); }
  // snout + face
  const fy = hy + hr * 0.2;
  const fx = hx - hr * 0.35;
  switch (p.snout) {
    case "long": out.push(ell(hx - hr * 0.85, hy + hr * 0.25, hr * 0.6, hr * 0.38)); out.push(eye(hx - hr * 1.3, hy + hr * 0.12, 3)); break;
    case "short": out.push(ell(hx - hr * 0.55, hy + hr * 0.3, hr * 0.38, hr * 0.28)); out.push(eye(hx - hr * 0.8, hy + hr * 0.2, 2.8)); break;
    case "pig": out.push(ell(hx - hr * 0.7, hy + hr * 0.25, hr * 0.38, hr * 0.32)); out.push(eye(hx - hr * 0.78, hy + hr * 0.2, 2)); out.push(eye(hx - hr * 0.62, hy + hr * 0.2, 2)); break;
    case "trunk": out.push(path(`M${hx - hr * 0.5},${hy + hr * 0.3} q-${hr * 0.9},${hr * 0.5} -${hr * 0.5},${hr * 1.7} q${hr * 0.15},${hr * 0.25} ${hr * 0.4},${hr * 0.05}`)); out.push(path(`M${hx - hr * 0.1},${hy + hr * 0.5} q-${hr * 0.35},${hr * 0.9} -${hr * 0.05},${hr * 1.5}`)); break;
    case "duck": break;
    default: out.push(eye(hx - hr * 0.9, hy + hr * 0.25, 3)); break;
  }
  if (p.tusks) { for (const s of [0, 1]) out.push(path(`M${hx - hr * 0.2 - s * 8},${hy + hr * 0.7} q-10,${hr * 0.7} -2,${hr * 1.0}`)); }
  if (p.whiskers) {
    for (const dy of [-3, 4]) { out.push(path(`M${hx - hr * 0.7},${hy + hr * 0.25 + dy} l-${hr * 0.9},${dy * 1.6}`)); out.push(path(`M${hx - hr * 0.1},${hy + hr * 0.25 + dy} l${hr * 0.9},${dy * 1.6}`)); }
  }
  out.push(eye(fx - hr * 0.05 + hr * 0.25, hy - hr * 0.15, 2.8));
  out.push(path(`M${f(hx - hr * 0.45)},${f(hy + hr * 0.55)} q${hr * 0.25},${hr * 0.2} ${hr * 0.55},0`));
  void fy;
  return wrap(out.join(""), label);
}

// ── bird ─────────────────────────────────────────────────────────────────────
function bird(p: BirdSpec, label: string): string {
  const o: string[] = [];
  const bx = 120, by = p.longNeck ? 98 : 88;
  const rx = p.penguin ? 40 : 46, ry = p.penguin ? 56 : p.owl ? 52 : 38;
  if (p.legs === "long") { for (const dx of [-8, 12]) o.push(path(`M${bx + dx},${by + ry - 4} v${40}`)); for (const dx of [-8, 12]) o.push(path(`M${bx + dx - 8},148 h16`)); }
  if (p.legs === "short") { for (const dx of [-12, 12]) { o.push(path(`M${bx + dx},${by + ry - 4} v10`)); o.push(path(`M${bx + dx - 8},${by + ry + 8} h16`)); } }
  if (p.tail === "fan") { o.push(`<path d="M${bx + rx - 8},${by - 4} l44,-26 l8,22 l-8,22 l-44,-6z" ${S}/>`); o.push(path(`M${bx + rx + 10},${by - 8} l24,-4 M${bx + rx + 10},${by + 2} l30,2`)); }
  if (p.tail === "short") o.push(poly([[bx + rx - 6, by + 6], [bx + rx + 24, by + 22], [bx + rx - 2, by + 28]]));
  let hy = by - ry - 14, hx = bx - 6;
  if (p.longNeck) { o.push(poly([[bx - 18, by - ry + 6], [bx - 4, by - ry + 6], [hx + 10, hy + 6], [hx - 8, hy + 6]])); hy = by - ry - 44; hx = bx - 16; o.pop(); o.push(poly([[bx - 14, by - ry + 8], [bx + 2, by - ry + 8], [hx + 8, hy + 8], [hx - 8, hy + 8]])); }
  o.push(ell(bx, by, rx, ry));
  if (p.penguin) o.push(ell(bx - 4, by + 6, rx * 0.62, ry * 0.8));
  if (p.owl) { for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++) o.push(path(`M${bx - 20 + c * 20},${by + 6 + r * 14} q4,6 8,0`)); }
  if (p.wings !== "wide") o.push(`<path d="M${bx + 4},${by - ry * 0.3} q34,6 30,${ry * 0.9} q-34,-2 -30,-${ry * 0.9}z" ${S}/>`);
  else o.push(`<path d="M${bx - 2},${by - ry * 0.2} q56,-50 76,-6 q-30,4 -76,${ry * 0.6}z" ${S}/>`);
  const hr = p.owl ? 34 : 24;
  if (p.owl) { o.push(poly([[bx - 30, by - ry + 10], [bx - 24, by - ry - 26], [bx - 8, by - ry]])); o.push(poly([[bx + 30, by - ry + 10], [bx + 24, by - ry - 26], [bx + 8, by - ry]])); hy = by - ry + 6; hx = bx; }
  if (p.crest) { o.push(path(`M${hx - 4},${hy - hr + 2} q-4,-18 6,-24 M${hx + 4},${hy - hr + 2} q4,-22 14,-24 M${hx + 10},${hy - hr + 6} q10,-14 20,-14`)); }
  if (!p.owl) o.push(circ(hx, hy, hr));
  if (p.owl) { o.push(circ(hx - 14, hy - 2, 15)); o.push(circ(hx + 14, hy - 2, 15)); o.push(eye(hx - 14, hy - 2, 4.5)); o.push(eye(hx + 14, hy - 2, 4.5)); }
  else o.push(eye(hx - 4, hy - 4, 3));
  const mx = hx - (p.owl ? 0 : hr * 0.7), my = hy + (p.owl ? 14 : 2);
  switch (p.beak) {
    case "short": o.push(poly([[mx, my - 6], [mx - 18, my], [mx, my + 6]])); break;
    case "pointy": o.push(poly([[mx + 2, my - 5], [mx - 24, my + 1], [mx + 2, my + 5]])); break;
    case "hook": o.push(`<path d="M${mx + 4},${my - 8} q-24,0 -22,14 q8,-6 24,-2z" ${S}/>`); break;
    case "flat": o.push(`<path d="M${mx + 2},${my - 6} q-30,-2 -30,6 q4,6 32,2z" ${S}/>`); break;
    case "long": o.push(poly([[mx + 2, my - 3], [mx - 44, my + 4], [mx + 2, my + 5]])); break;
    case "big": o.push(`<path d="M${mx + 4},${my - 12} q-46,-2 -50,14 q20,8 52,0z" ${S}/>`); o.push(path(`M${mx - 40},${my + 4} q20,-4 42,-2`)); break;
  }
  return wrap(o.join(""), label);
}

// ── water animals ────────────────────────────────────────────────────────────
function fish(p: FishSpec, label: string): string {
  const o: string[] = [];
  if (p.kind === "seahorse") {
    o.push(`<path d="M120,30 q-34,0 -30,28 q2,16 18,20 q-4,30 12,46 q18,16 28,-2 q-12,6 -16,-10 q-4,-14 6,-34 q14,-14 0,-34 q-4,-14 -18,-14z" ${S}/>`);
    o.push(path("M94,50 l-26,2 q-4,6 6,8 l20,0")); o.push(eye(110, 46, 3)); o.push(path("M128,60 q10,4 8,16")); o.push(path("M104,78 q-8,6 -2,16"));
    return wrap(o.join(""), label);
  }
  if (p.kind === "whale") {
    o.push(`<path d="M30,90 q0,-50 70,-50 q70,0 84,42 q10,-10 24,-30 q2,26 -16,40 q16,0 24,12 q-22,8 -32,-4 q-22,40 -86,40 q-64,0 -68,-50z" ${S}/>`);
    o.push(path("M40,96 q60,28 130,-6")); o.push(eye(58, 78, 3)); o.push(path("M92,40 q-6,-22 -16,-26 M92,40 q4,-22 14,-26 M92,40 l0,-20"));
    return wrap(o.join(""), label);
  }
  if (p.kind === "dolphin") {
    o.push(`<path d="M24,70 q10,-8 22,-4 q50,-34 110,-6 q20,10 34,40 q10,-6 26,-8 q-4,16 -14,20 q8,10 -6,18 q-8,-8 -18,-8 q-30,28 -90,20 q-44,-6 -60,-34 q-8,-4 -4,-18z" ${S}/>`);
    o.push(path("M28,80 q40,6 60,-4")); o.push(eye(66, 66, 3)); o.push(poly([[108, 56], [124, 22], [140, 58]])); o.push(`<path d="M104,100 q4,26 24,30 q-2,-20 6,-30z" ${S}/>`);
    return wrap(o.join(""), label);
  }
  if (p.kind === "shark") {
    o.push(`<path d="M16,100 q40,-52 118,-32 q40,10 62,-18 q-4,30 -4,50 q10,20 28,24 q-30,2 -40,-12 q-20,12 -66,16 q-70,6 -98,-28z" ${S}/>`);
    o.push(poly([[96, 74], [126, 24], [150, 70]])); o.push(path("M30,100 q50,24 100,-2")); o.push(eye(54, 88, 3));
    for (let i = 0; i < 4; i++) o.push(path(`M${70 + i * 10},${100 + 2} l4,8 l4,-8`)); o.push(path("M92,98 l0,14 M100,98 l0,14"));
    return wrap(o.join(""), label);
  }
  // fish / clown
  o.push(`<path d="M30,80 q50,-60 118,-14 q18,-12 40,-24 q-6,24 0,40 q-6,16 0,40 q-22,-12 -40,-24 q-70,44 -118,-18z" ${S}/>`);
  o.push(poly([[88, 56], [112, 28], [128, 60]])); o.push(`<path d="M104,100 q8,24 28,22 q-6,-14 -4,-24z" ${S}/>`);
  o.push(eye(58, 74, 3.4)); o.push(path("M40,86 q6,4 12,0")); o.push(path("M84,70 q8,12 0,24 M70,68 q8,14 0,28"));
  if (p.kind === "clown") { o.push(path("M92,46 q-10,34 0,60")); o.push(path("M130,54 q-6,26 0,48")); }
  else { o.push(path("M100,70 q6,8 0,16 M114,64 q6,14 0,26 M128,66 q6,12 0,22")); }
  return wrap(o.join(""), label);
}

// ── misc ─────────────────────────────────────────────────────────────────────
function misc(p: MiscSpec, label: string): string {
  const o: string[] = [];
  switch (p.plan) {
    case "octopus": {
      o.push(`<path d="M60,90 q-4,-60 60,-60 q64,0 60,60 q-2,10 -10,14 l0,0 z" ${S}/>`);
      for (let i = 0; i < 6; i++) { const x = 66 + i * 22; o.push(path(`M${x},96 q${i % 2 ? 14 : -14},20 ${i % 2 ? -6 : 6},38 q${i % 2 ? -8 : 8},8 ${i % 2 ? 4 : -4},14`)); }
      o.push(eye(100, 68, 4)); o.push(eye(140, 68, 4)); o.push(path("M108,84 q12,10 24,0"));
      break;
    }
    case "jelly": {
      o.push(`<path d="M50,84 q0,-62 70,-62 q70,0 70,62 q-35,10 -70,0 q-35,10 -70,0z" ${S}/>`);
      for (let i = 0; i < 6; i++) { const x = 66 + i * 22; o.push(path(`M${x},88 q-10,14 0,26 q10,12 0,26`)); }
      o.push(eye(100, 60, 3.4)); o.push(eye(140, 60, 3.4)); o.push(path("M112,72 q8,6 16,0")); o.push(path("M76,48 q6,-10 18,-12"));
      break;
    }
    case "crab": {
      o.push(ell(120, 96, 56, 36)); o.push(eye(104, 80, 3.4)); o.push(eye(136, 80, 3.4)); o.push(path("M104,66 v8 M136,66 v8"));
      o.push(path("M110,108 q10,8 20,0"));
      for (const s of [-1, 1]) {
        o.push(`<path d="M${120 + s * 52},84 q${s * 24},-6 ${s * 28},-34 q${s * -14},-12 ${s * -22},8 q${s * -8},-10 ${s * -16},4 q${s * 2},16 ${s * 10},22z" ${S}/>`);
        for (let i = 0; i < 3; i++) o.push(path(`M${120 + s * 44},${100 + i * 12} q${s * 22},${4 + i * 2} ${s * 28},${22 + i * 4}`));
      }
      break;
    }
    case "star": {
      const pts: number[][] = [];
      for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + (i * Math.PI) / 5; const r = i % 2 ? 26 : 64; pts.push([120 + Math.cos(a) * r, 84 + Math.sin(a) * r]); }
      o.push(poly(pts)); o.push(eye(108, 82, 3)); o.push(eye(132, 82, 3)); o.push(path("M110,96 q10,8 20,0"));
      for (let i = 0; i < 5; i++) { const a = -Math.PI / 2 + (i * 2 * Math.PI) / 5; o.push(circ(120 + Math.cos(a) * 42, 84 + Math.sin(a) * 42, 2.5)); }
      break;
    }
    case "turtle": {
      for (const [x, y] of [[70, 118], [168, 118], [64, 100], [176, 100]]) o.push(ell(x, y, 16, 12));
      o.push(ell(46, 90, 18, 15)); o.push(eye(40, 86, 2.8)); o.push(path("M36,96 q6,4 12,0"));
      o.push(poly([[190, 108], [218, 114], [190, 120]]));
      o.push(`<path d="M52,114 q-4,-66 70,-66 q74,0 70,66z" ${S}/>`);
      o.push(path("M80,112 l8,-34 h66 l8,34 M88,78 l-8,-24 M154,78 l8,-24 M121,78 v34 M104,48 l-10,30 M138,48 l10,30"));
      break;
    }
    case "frog": {
      o.push(`<path d="M60,128 q-26,-6 -22,-18 q22,0 30,-14z M180,128 q26,-6 22,-18 q-22,0 -30,-14z" ${S}/>`);
      o.push(`<path d="M52,110 q0,-52 68,-52 q68,0 68,52 q0,22 -30,22 h-76 q-30,0 -30,-22z" ${S}/>`);
      o.push(circ(88, 56, 16)); o.push(circ(152, 56, 16)); o.push(eye(88, 56, 5)); o.push(eye(152, 56, 5));
      o.push(path("M90,90 q30,22 60,0")); o.push(eye(112, 78, 1.8)); o.push(eye(128, 78, 1.8));
      o.push(path("M96,122 l-4,14 l-10,4 M144,122 l4,14 l10,4"));
      break;
    }
    case "snake": {
      o.push(`<path d="M40,130 q-20,-40 30,-40 q50,0 90,-20 q36,-16 26,-48 q-6,-14 -22,-8 q-20,6 -6,26" fill="none" stroke="#111" stroke-width="30" stroke-linecap="round" stroke-linejoin="round"/>`);
      o.push(`<path d="M40,130 q-20,-40 30,-40 q50,0 90,-20 q36,-16 26,-48 q-6,-14 -22,-8 q-20,6 -6,26" fill="none" stroke="#fff" stroke-width="24.5" stroke-linecap="round" stroke-linejoin="round"/>`);
      o.push(`<path d="M172,66 q-14,-6 -6,-26" fill="none" stroke="#111" stroke-width="0"/>`);
      o.push(ell(170, 26, 22, 16, `transform="rotate(-30 170 26)"`)); o.push(eye(166, 18, 3)); o.push(path("M154,34 l-12,6 l8,2 l-6,6", false));
      for (let i = 0; i < 5; i++) o.push(path(`M${60 + i * 24},${86 + (i % 2 ? -4 : 4)} l6,6`));
      break;
    }
    case "butterfly": {
      o.push(`<path d="M120,80 q-70,-70 -82,-24 q-6,30 40,32z" ${S}/><path d="M120,84 q-60,10 -48,44 q30,14 48,-30z" ${S}/>`);
      o.push(`<path d="M120,80 q70,-70 82,-24 q6,30 -40,32z" ${S}/><path d="M120,84 q60,10 48,44 q-30,14 -48,-30z" ${S}/>`);
      o.push(ell(120, 92, 7, 38)); o.push(circ(120, 50, 9)); o.push(path("M116,44 q-8,-18 -22,-20 M124,44 q8,-18 22,-20"));
      o.push(circ(70, 60, 10)); o.push(circ(170, 60, 10)); o.push(circ(80, 112, 7)); o.push(circ(160, 112, 7));
      break;
    }
    case "ladybug": {
      o.push(ell(120, 92, 54, 48)); o.push(path("M120,44 v96")); o.push(`<path d="M80,52 q-4,-28 40,-28 q44,0 40,28 q-40,-12 -80,0z" ${S}/>`);
      for (const [x, y] of [[92, 78], [148, 78], [86, 108], [154, 108], [102, 128], [138, 128]]) o.push(circ(x, y, 7));
      o.push(eye(108, 38, 3)); o.push(eye(132, 38, 3)); o.push(path("M108,24 q-8,-12 -18,-10 M132,24 q8,-12 18,-10"));
      break;
    }
    case "bee": {
      o.push(ell(96, 56, 22, 34, `transform="rotate(-25 96 56)"`)); o.push(ell(138, 50, 22, 34, `transform="rotate(25 138 50)"`));
      o.push(ell(116, 100, 52, 36)); o.push(path("M100,66 q-6,34 0,68 M126,66 q6,34 0,68 M148,76 q4,24 0,48"));
      o.push(circ(60, 98, 22)); o.push(eye(52, 94, 3)); o.push(path("M50,106 q6,4 12,0")); o.push(path("M54,78 q-4,-14 -14,-18 M64,76 q2,-16 -2,-24"));
      o.push(poly([[166, 98], [192, 100], [166, 108]]));
      break;
    }
    case "spider": {
      for (const s of [-1, 1]) for (let i = 0; i < 4; i++) { const y = 72 + i * 14; o.push(path(`M${120 + s * 24},${y} q${s * 36},${-34 + i * 4} ${s * 62},${-6 + i * 20} l${s * 6},${20 + i * 2}`)); }
      o.push(ell(130, 100, 30, 28)); o.push(circ(94, 90, 18)); o.push(eye(88, 86, 3)); o.push(eye(100, 86, 3)); o.push(path("M88,96 q6,4 12,0"));
      break;
    }
    case "snail": {
      o.push(`<path d="M24,128 q60,-8 140,0 q40,0 40,-14 q-4,-18 -18,-18 q-12,0 -16,10 l-96,0 q-40,0 -50,22z" ${S}/>`);
      o.push(path("M196,96 q-4,-22 -2,-38 M212,100 q8,-18 14,-30")); o.push(circ(194, 56, 5)); o.push(circ(226, 68, 5));
      o.push(circ(110, 74, 40)); o.push(path("M110,74 m-4,0 a4,4 0 1 1 8,0 a14,14 0 1 1 -22,-10 a26,26 0 1 1 18,44"));
      o.push(eye(204, 106, 2.6)); o.push(path("M206,118 q6,4 12,0"));
      break;
    }
  }
  return wrap(o.join(""), label);
}

export function animalSvg(spec: AnimalSpec, label: string): string {
  switch (spec.plan) {
    case "quad": return quad(spec, label);
    case "bird": return bird(spec, label);
    case "fish": return fish(spec, label);
    default: return misc(spec, label);
  }
}
