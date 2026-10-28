/**
 * Top-down line art for military aircraft, drawn from a handful of geometry
 * numbers (no image assets). Everything is in "length units": the aircraft is
 * 100 long, nose at y=0 pointing up, tail at y≈100, centred on x=0. The result
 * is scaled to fit and drawn as a black-outline, white-fill colouring page.
 */

type Pt = [number, number];

export interface WingSpec {
  /** y of the leading edge where the wing meets the fuselage. */
  y: number;
  /** Chord (front-to-back length) at the root and at the tip. */
  root: number;
  tip: number;
  /** Leading-edge sweep in degrees (0 = straight out, 60 = heavily swept back). */
  sweep: number;
  /** Elliptical tip (Spitfire-style) instead of a straight-cut one. */
  round?: boolean;
}

export interface TailSpec {
  y: number;
  root: number;
  tip: number;
  /** Half-span, in length units. */
  half: number;
  sweep: number;
}

export interface PodSpec {
  /** Fraction of the half-span (wing) where the engine sits; mirrored. */
  at: number;
  /** y of the pod's front, length and width. */
  y: number;
  len: number;
  w: number;
  /** Draw a propeller disc in front of it. */
  prop?: boolean;
}

export interface PlaneSpec {
  kind: "plane" | "heli" | "tandem" | "tilt";
  /** Full wingspan ÷ length (rotor spread for helicopters is in `rotor`). */
  span: number;
  /** Fuselage half-width, nose length, nose-tip half-width, tail taper start, tail half-width. */
  w?: number;
  nose?: number;
  tipW?: number;
  tail?: number;
  tailW?: number;
  wing?: WingSpec;
  stab?: TailSpec;
  canard?: TailSpec;
  /** Canopy: y, length, half-width. */
  canopy?: [number, number, number];
  /** Rear nozzles: count (1, 2 or 4), spacing between centres, radius. */
  noz?: [number, number, number];
  pods?: PodSpec[];
  /** Small circles (intakes, vectoring nozzles…) at [x, y, r]; mirrored. */
  dots?: [number, number, number][];
  /** Nose propeller (single-engine prop planes). */
  nosePropR?: number;
  /** Tail propeller (pusher drones): radius. */
  tailPropR?: number;
  /** In-flight-refuelling boom off the tail. */
  boom?: boolean;
  /** Radar dome on the back: [y, r]. */
  dome?: [number, number];
  /** A flat all-wing shape: right-hand outline from nose to tail centre, mirrored. */
  custom?: Pt[];
  /** Helicopter / tilt-rotor bits. */
  rotor?: { r: number; y: number; x?: number; blades: number }[];
  boomW?: number;
  boomY?: number;
  tailRotorR?: number;
  stubWing?: { y: number; half: number; chord: number };
}

const SW = 2.4; // outline weight in px
const SIZE = 300;
const PAD = 14;

const rad = (d: number) => (d * Math.PI) / 180;
const f = (n: number) => Math.round(n * 10) / 10;

interface Shape {
  d: string;
  fill?: string;
  dash?: boolean;
  weight?: number;
  /** Unfilled stroke-only shape (rotor discs, panel lines). */
  open?: boolean;
}

class Canvas {
  shapes: Shape[] = [];
  minX = Infinity;
  maxX = -Infinity;
  minY = Infinity;
  maxY = -Infinity;

  grow(x: number, y: number, r = 0) {
    this.minX = Math.min(this.minX, x - r);
    this.maxX = Math.max(this.maxX, x + r);
    this.minY = Math.min(this.minY, y - r);
    this.maxY = Math.max(this.maxY, y + r);
  }
  poly(pts: Pt[], opts: Partial<Shape> = {}) {
    pts.forEach(([x, y]) => this.grow(x, y));
    this.shapes.push({ d: "M" + pts.map(([x, y]) => `${f(x)},${f(y)}`).join("L") + "Z", ...opts });
  }
  path(d: string, pts: Pt[], opts: Partial<Shape> = {}) {
    pts.forEach(([x, y]) => this.grow(x, y));
    this.shapes.push({ d, ...opts });
  }
  circle(cx: number, cy: number, r: number, opts: Partial<Shape> = {}) {
    this.grow(cx, cy, r);
    this.shapes.push({
      d: `M${f(cx - r)},${f(cy)}a${f(r)},${f(r)} 0 1,0 ${f(2 * r)},0a${f(r)},${f(r)} 0 1,0 ${f(-2 * r)},0Z`,
      ...opts,
    });
  }
}

/** Mirror helper: draw the same shape on both sides. */
const both = (fn: (s: 1 | -1) => void) => {
  fn(1);
  fn(-1);
};

function wingPoly(side: 1 | -1, w: number, half: number, wing: WingSpec): Pt[] {
  const tipLE = wing.y + (half - w) * Math.tan(rad(wing.sweep));
  return [
    [side * w, wing.y],
    [side * half, tipLE],
    [side * half, tipLE + wing.tip],
    [side * w, wing.y + wing.root],
  ];
}

function drawWing(c: Canvas, side: 1 | -1, w: number, half: number, wing: WingSpec) {
  if (!wing.round) {
    c.poly(wingPoly(side, w, half, wing), { fill: "#fff" });
    return;
  }
  const y0 = wing.y;
  const y1 = wing.y + wing.root;
  const tipY = y0 + 4;
  const x = (v: number) => f(side * v);
  const d =
    `M${x(w)},${f(y0)}C${x(w + (half - w) * 0.55)},${f(y0 - 2.5)} ${x(half - 1)},${f(tipY - 2)} ${x(half)},${f(tipY + 1)}` +
    `C${x(half)},${f(tipY + 4 + wing.tip)} ${x(half - 4)},${f(y1 - 7)} ${x(w + (half - w) * 0.4)},${f(y1 - 1)}L${x(w)},${f(y1)}Z`;
  c.path(d, [[side * w, y0], [side * half, tipY], [side * w, y1]], { fill: "#fff" });
}

function drawTail(c: Canvas, side: 1 | -1, w: number, t: TailSpec) {
  const tipLE = t.y + (t.half - w) * Math.tan(rad(t.sweep));
  c.poly(
    [
      [side * w * 0.8, t.y],
      [side * t.half, tipLE],
      [side * t.half, tipLE + t.tip],
      [side * w * 0.8, t.y + t.root],
    ],
    { fill: "#fff" },
  );
}

/** Fuselage outline (nose up), smooth nose and a straight taper to the tail. */
function fuselagePath(w: number, nose: number, tipW: number, tail: number, tailW: number): { d: string; pts: Pt[] } {
  const r = (x: number, y: number) => `${f(x)},${f(y)}`;
  const d =
    `M${r(-tipW, 0)}L${r(tipW, 0)}` +
    `Q${r(w * 0.95, nose * 0.3)} ${r(w, nose)}` +
    `L${r(w, tail)}L${r(tailW, 100)}L${r(-tailW, 100)}L${r(-w, tail)}L${r(-w, nose)}` +
    `Q${r(-w * 0.95, nose * 0.3)} ${r(-tipW, 0)}Z`;
  return { d, pts: [[-w, 0], [w, 100]] };
}

function propDisc(c: Canvas, x: number, y: number, r: number) {
  // Spinner + a blurred two-blade hint.
  c.shapes.push({ d: `M${f(x - r)},${f(y)}L${f(x + r)},${f(y)}`, open: true, weight: 3.2 });
  c.grow(x - r, y - 1);
  c.grow(x + r, y + 1);
  c.circle(x, y, Math.max(1.1, r * 0.16), { fill: "#fff" });
}

function rotorBlades(c: Canvas, x: number, y: number, r: number, blades: number, disc: boolean, phase = 0) {
  if (disc) c.circle(x, y, r, { open: true, dash: true, weight: 1.1 });
  const bw = Math.max(1.6, r * 0.05);
  for (let i = 0; i < blades; i++) {
    const a = phase + (i * Math.PI * 2) / blades;
    const cs = Math.cos(a);
    const sn = Math.sin(a);
    const px = -sn * bw;
    const py = cs * bw;
    const hub = r * 0.1;
    c.poly(
      [
        [x + cs * hub + px, y + sn * hub + py],
        [x + cs * r + px, y + sn * r + py],
        [x + cs * r - px, y + sn * r - py],
        [x + cs * hub - px, y + sn * hub - py],
      ],
      { fill: "#fff" },
    );
  }
  c.circle(x, y, Math.max(1.6, r * 0.07), { fill: "#fff" });
}

function drawPlane(c: Canvas, s: PlaneSpec) {
  const w = s.w ?? 4.5;
  const nose = s.nose ?? 24;
  const half = (s.span * 100) / 2;

  if (s.custom) {
    const right = s.custom;
    // right goes nose→tail centre; mirrored goes back up the left side.
    const left = [...right].reverse().map(([x, y]) => [-x, y] as Pt);
    c.poly([...right, ...left.slice(1)], { fill: "#fff" });
  }

  if (s.kind === "plane" || s.kind === "tilt") {
    if (s.wing) both((side) => drawWing(c, side, w, half, s.wing!));
    if (s.stab) both((side) => drawTail(c, side, w, s.stab!));
    if (s.canard) both((side) => drawTail(c, side, w, s.canard!));
    for (const p of s.pods ?? []) {
      both((side) => {
        const x = side * p.at * half;
        c.poly(
          [
            [x - p.w, p.y + 3],
            [x - p.w * 0.6, p.y],
            [x + p.w * 0.6, p.y],
            [x + p.w, p.y + 3],
            [x + p.w, p.y + p.len],
            [x - p.w, p.y + p.len],
          ],
          { fill: "#fff" },
        );
        if (p.prop) propDisc(c, x, p.y - 1, p.w * 2.4);
      });
    }
  }

  if (!s.custom && s.kind !== "heli" && s.kind !== "tandem") {
    const fz = fuselagePath(w, nose, s.tipW ?? 0.7, s.tail ?? 80, s.tailW ?? 2.6);
    c.path(fz.d, fz.pts, { fill: "#fff" });
  }

  if (s.kind === "heli" || s.kind === "tandem") {
    const bodyW = w;
    const boomY = s.boomY ?? 58;
    const bw = s.boomW ?? 1.8;
    // Tail boom first, body on top.
    if (s.kind === "heli") c.poly([[-bw, boomY], [bw, boomY], [bw * 0.8, 100], [-bw * 0.8, 100]], { fill: "#fff" });
    if (s.stubWing) {
      const sw = s.stubWing;
      both((side) => c.poly([[side * bodyW, sw.y], [side * sw.half, sw.y + 1], [side * sw.half, sw.y + sw.chord], [side * bodyW, sw.y + sw.chord]], { fill: "#fff" }));
    }
    if (s.stab) both((side) => drawTail(c, side, bw, s.stab!));
    const fz = fuselagePath(bodyW, nose, s.tipW ?? 2.5, s.kind === "tandem" ? 90 : boomY + 6, s.kind === "tandem" ? bodyW * 0.8 : bw);
    c.path(fz.d, fz.pts, { fill: "#fff" });
  }

  if (s.canopy) {
    const [cy, len, cw] = s.canopy;
    c.path(
      `M${f(-cw)},${f(cy + len * 0.45)}Q${f(-cw)},${f(cy)} 0,${f(cy)}Q${f(cw)},${f(cy)} ${f(cw)},${f(cy + len * 0.45)}L${f(cw * 0.8)},${f(cy + len)}L${f(-cw * 0.8)},${f(cy + len)}Z`,
      [[-cw, cy], [cw, cy + len]],
      { fill: "#fff" },
    );
  }

  if (s.dome) {
    c.circle(0, s.dome[0], s.dome[1], { fill: "#fff" });
    c.circle(0, s.dome[0], s.dome[1] * 0.35, { open: true, weight: 1.2 });
  }

  for (const [x, y, r] of s.dots ?? []) both((side) => c.circle(side * x, y, r, { fill: "#fff", weight: 1.4 }));

  if (s.noz) {
    const [n, sp, r] = s.noz;
    const xs = n === 1 ? [0] : n === 2 ? [-sp / 2, sp / 2] : [-sp * 1.5, -sp / 2, sp / 2, sp * 1.5];
    for (const x of xs) c.circle(x, 97.5, r, { fill: "#fff", weight: 1.6 });
  }

  if (s.boom) {
    c.poly([[-1.3, 100], [1.3, 100], [1.3, 118], [-1.3, 118]], { fill: "#fff" });
    c.poly([[-5, 114], [5, 114], [5, 118], [-5, 118]], { fill: "#fff" });
  }

  if (s.nosePropR) propDisc(c, 0, -1, s.nosePropR);
  if (s.tailPropR) propDisc(c, 0, 102, s.tailPropR);

  if (s.rotor) {
    const spin = s.kind === "tandem";
    s.rotor.forEach((r, i) => rotorBlades(c, r.x ?? 0, r.y, r.r, r.blades, !spin, i * 0.55 + (spin ? 0.3 : 0.2)));
    if (s.kind === "heli" && s.tailRotorR) {
      c.circle(bwX(s), 97, s.tailRotorR, { open: true, dash: true, weight: 1.1 });
      c.circle(bwX(s), 97, s.tailRotorR * 0.25, { fill: "#fff" });
    }
  }
}

const bwX = (s: PlaneSpec) => (s.boomW ?? 1.8) + 1.2;

/** Draw an aircraft as a self-contained SVG string. */
export function planeSvg(spec: PlaneSpec): string {
  const c = new Canvas();
  drawPlane(c, spec);
  const bw = c.maxX - c.minX;
  const bh = c.maxY - c.minY;
  const avail = SIZE - PAD * 2;
  const k = Math.min(avail / bw, avail / bh);
  const ox = (SIZE - bw * k) / 2 - c.minX * k;
  const oy = (SIZE - bh * k) / 2 - c.minY * k;
  const body = c.shapes
    .map((sh) => {
      const weight = (sh.weight ?? SW) / k;
      return `<path d="${sh.d}" fill="${sh.open ? "none" : sh.fill ?? "none"}" stroke="#111" stroke-width="${f(weight)}" stroke-linejoin="round" stroke-linecap="round"${sh.dash ? ` stroke-dasharray="${f(3 / k)} ${f(3 / k)}"` : ""}/>`;
    })
    .join("");
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${SIZE} ${SIZE}" width="${SIZE}" height="${SIZE}" role="img" aria-label="Line drawing of a military aircraft from above, ready to colour"><g transform="translate(${f(ox)} ${f(oy)}) scale(${f(k)})">${body}</g></svg>`;
}
