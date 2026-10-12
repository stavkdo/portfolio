/* The four strings in the hero: drawn, plucked and heard. */
import { audio, CELLO } from "./audio";
import { el, reduceMotion } from "./svg";

type CelloString = {
  freq: number;
  i: number;
  x0: number;
  y0: number;
  x1: number;
  y1: number;
  amp: number;
  t: number;
  py: number;
  last: number;
  path: SVGPathElement | null;
  glow: SVGPathElement | null;
};

const NOTES = CELLO.notes;
const WIDTHS = [3.2, 2.6, 2, 1.5];

const hero = document.querySelector<HTMLElement>(".hero")!;
const svg = hero.querySelector<SVGSVGElement>(".strings__svg")!;

if (window.matchMedia("(pointer: coarse)").matches) {
  const hint = hero.querySelector(".hero__hint-text");
  if (hint) hint.textContent = "Swipe across the strings to play them. Tap one to jump to its section.";
}

const strings: CelloString[] = NOTES.map((freq, i) => ({
  freq, i, x0: 0, y0: 0, x1: 0, y1: 0, amp: 0, t: 0, py: 0.5, last: 0, path: null, glow: null,
}));
let running = false;
const voices: ({ release: (at?: number) => void } | null)[] = [null, null, null, null];
const lastSounded = [-1e9, -1e9, -1e9, -1e9];

function layout() {
  const { width: W, height: H } = hero.getBoundingClientRect();
  svg.setAttribute("viewBox", `0 0 ${W} ${H}`);
  svg.innerHTML = "";

  const narrow = W < 600;
  const cx = W * (narrow ? 0.76 : 0.72);
  const nutGap = narrow ? 8 : 13;
  const bridgeGap = Math.max(narrow ? 19 : 40, Math.min(W * 0.072, 108));
  const top = -10;
  const bottom = H * (narrow ? 0.8 : 0.76);
  const spread = (y: number) => nutGap + (bridgeGap - nutGap) * ((y - top) / (bottom - top));

  const defs = el("defs", {}, svg);
  // strings fade in below the top bar so they never cross its text
  const fadeFrom = Math.min(0.2, 64 / bottom).toFixed(3);
  const fadeTo = Math.min(0.32, 190 / bottom).toFixed(3);
  const sheen = el("linearGradient", {
    id: "string-sheen", gradientUnits: "userSpaceOnUse", x1: 0, y1: 0, x2: 0, y2: bottom,
  }, defs);
  el("stop", { offset: "0", "stop-color": "oklch(0.84 0.12 84)", "stop-opacity": "0" }, sheen);
  el("stop", { offset: fadeFrom, "stop-color": "oklch(0.84 0.12 84)", "stop-opacity": "0" }, sheen);
  el("stop", { offset: fadeTo, "stop-color": "oklch(0.88 0.09 86)", "stop-opacity": "0.85" }, sheen);
  el("stop", { offset: "1", "stop-color": "oklch(0.86 0.12 84)", "stop-opacity": "1" }, sheen);

  const maple = el("linearGradient", { id: "maple", x1: "0", y1: "0", x2: "0", y2: "1" }, defs);
  el("stop", { offset: "0", "stop-color": "oklch(0.84 0.07 80)" }, maple);
  el("stop", { offset: "1", "stop-color": "oklch(0.70 0.09 64)" }, maple);

  const ebony = el("linearGradient", {
    id: "ebony", gradientUnits: "userSpaceOnUse", x1: 0, y1: 0, x2: 0, y2: bottom,
  }, defs);
  el("stop", { offset: "0", "stop-color": "oklch(0.13 0.035 268)", "stop-opacity": "0" }, ebony);
  el("stop", { offset: fadeFrom, "stop-color": "oklch(0.13 0.035 268)", "stop-opacity": "0" }, ebony);
  el("stop", { offset: fadeTo, "stop-color": "oklch(0.13 0.035 268)", "stop-opacity": "0.95" }, ebony);
  el("stop", { offset: "1", "stop-color": "oklch(0.15 0.035 268)", "stop-opacity": "1" }, ebony);

  // Fingerboard: tapered ebony, ending well above the bridge
  const fbEnd = top + (bottom - top) * 0.66;
  const pad = narrow ? 9 : 16;
  const wTop = spread(top) * 1.5 + pad;
  const wEnd = spread(fbEnd) * 1.5 + pad;
  el("path", {
    d: `M${cx - wTop} ${top} L${cx + wTop} ${top} L${cx + wEnd} ${fbEnd - 10}
        Q${cx} ${fbEnd + 14} ${cx - wEnd} ${fbEnd - 10} Z`,
    fill: "url(#ebony)",
  }, svg);

  // Bridge: carved maple with feet, waist, kidney eyes and a heart
  const bw = bridgeGap * 3 + (narrow ? 44 : 84);
  const bh = Math.min(narrow ? 84 : 120, H * 0.13);
  const L = cx - bw / 2, R = cx + bw / 2, T = bottom - 4, B = bottom - 4 + bh;
  el("path", {
    d: `M${L + bw * 0.1} ${B}
        L${L + bw * 0.06} ${B - bh * 0.16}
        C${L + bw * 0.16} ${T + bh * 0.62} ${L + bw * 0.16} ${T + bh * 0.4} ${L} ${T + bh * 0.16}
        Q${cx} ${T - bh * 0.14} ${R} ${T + bh * 0.16}
        C${R - bw * 0.16} ${T + bh * 0.4} ${R - bw * 0.16} ${T + bh * 0.62} ${R - bw * 0.06} ${B - bh * 0.16}
        L${R - bw * 0.1} ${B}
        L${R - bw * 0.3} ${B}
        C${R - bw * 0.32} ${B - bh * 0.42} ${L + bw * 0.32} ${B - bh * 0.42} ${L + bw * 0.3} ${B}
        Z`,
    fill: "url(#maple)",
    stroke: "oklch(0.5 0.08 55)",
    "stroke-width": 1,
  }, svg);
  const hole = "oklch(0.2 0.06 268)";
  [-1, 1].forEach((side) => {
    const ex = cx + side * bw * 0.27, ey = T + bh * 0.36;
    el("ellipse", {
      cx: ex, cy: ey, rx: bw * 0.045, ry: bh * 0.11,
      transform: `rotate(${side * -18} ${ex} ${ey})`,
      fill: hole,
    }, svg);
  });
  const hs = Math.max(0.6, bh / 110);
  el("path", {
    d: `M${cx} ${T + bh * 0.34}
        c${-7 * hs} ${-9 * hs} ${-16 * hs} ${-2 * hs} ${-9 * hs} ${6 * hs}
        l${9 * hs} ${9 * hs} l${9 * hs} ${-9 * hs}
        c${7 * hs} ${-8 * hs} ${-2 * hs} ${-15 * hs} ${-9 * hs} ${-6 * hs}z`,
    fill: hole,
  }, svg);

  strings.forEach((s, i) => {
    const off = i - 1.5;
    s.x0 = cx + off * nutGap;
    s.y0 = top;
    s.x1 = cx + off * bridgeGap;
    // land each string exactly on the bridge's arched top edge
    const u = (s.x1 - L) / bw;
    s.y1 = T + bh * 0.16 - 2 * u * (1 - u) * bh * 0.3;
    s.glow = el("path", {
      fill: "none", stroke: "url(#string-sheen)", "stroke-opacity": "0",
      "stroke-width": WIDTHS[i] * 3.5, "stroke-linecap": "round",
    }, svg);
    s.path = el("path", {
      fill: "none", stroke: "url(#string-sheen)",
      "stroke-width": WIDTHS[i], "stroke-linecap": "round",
    }, svg);
    draw(s);
  });
}

function draw(s: CelloString) {
  const py = s.y0 + (s.y1 - s.y0) * s.py;
  const px = s.x0 + (s.x1 - s.x0) * s.py;
  const disp = s.amp * Math.sin(s.t * 38 + s.i);
  // Quadratic control point doubles the displacement at the pluck point
  const d = `M${s.x0} ${s.y0} Q${px + disp * 2} ${py} ${s.x1} ${s.y1}`;
  s.path?.setAttribute("d", d);
  s.glow?.setAttribute("d", d);
  s.glow?.setAttribute("stroke-opacity", Math.min(0.22, Math.abs(s.amp) / 60).toFixed(3));
}

function tick(now: number) {
  let alive = false;
  strings.forEach((s) => {
    if (s.amp > 0.05) {
      const dt = Math.min(0.05, (now - (s.last || now)) / 1000);
      s.last = now;
      s.t += dt;
      s.amp *= Math.exp(-dt * (2.2 + s.i * 0.5));
      alive = true;
    } else if (s.amp !== 0) {
      s.amp = 0;
    }
    draw(s);
  });
  running = alive;
  if (alive) requestAnimationFrame(tick);
}

/** A drawn eighth note rises from where the string was played, drifting and fading. */
function floatNote(s: CelloString, at: number) {
  const y = s.y0 + (s.y1 - s.y0) * at;
  const x = s.x0 + (s.x1 - s.x0) * at;
  const place = el("g", { transform: `translate(${(x + 14).toFixed(1)} ${(y - 4).toFixed(1)})` }, svg);
  const note = el("g", { class: "note-float" }, place);
  note.style.setProperty("--drift", `${(Math.random() * 16 - 4).toFixed(1)}px`);
  note.style.setProperty("--tilt", `${(Math.random() * 24 - 12).toFixed(1)}deg`);
  el("ellipse", { cx: 0, cy: 0, rx: 5.6, ry: 4, transform: "rotate(-22)" }, note); // head
  el("rect", { x: 4, y: -24, width: 1.7, height: 24 }, note); // stem
  el("path", { d: "M5.7 -24 c0.5 4.5 7.5 6 7 13 c-0.6 -4.4 -3.6 -6.4 -7 -7.6 z" }, note); // flag
  note.addEventListener("animationend", () => place.remove());
}

/** Play string i (its open note: C2, G2, D3 or A3). at = where along it it was touched (0 top, 1 bridge). */
export function pluck(i: number, strength = 0.6, at = 0.5) {
  const s = strings[i];
  s.amp = Math.min(16, 4 + strength * 14) * (reduceMotion ? 0.25 : 1);
  s.t = 0;
  s.py = Math.max(0.15, Math.min(0.85, at));
  s.last = performance.now();
  // A string crossed again a moment later keeps its note ringing instead of restarting it:
  // restarting a note every few milliseconds is what makes a fast strum crackle
  if (s.last - lastSounded[i] > 90) {
    lastSounded[i] = s.last;
    voices[i]?.release();
    voices[i] = audio.bow(s.freq, { level: 0.35 + 0.55 * strength });
    floatNote(s, s.py);
  }
  if (!running) {
    running = true;
    requestAnimationFrame(tick);
  }
}

// Crossing detection: does the pointer's last move cross a string line?
let prev: { x: number; y: number; t: number } | null = null;
const xAt = (s: CelloString, y: number) => s.x0 + (s.x1 - s.x0) * ((y - s.y0) / (s.y1 - s.y0));

/** The string under the pointer, if any: within a finger's width of the line. */
const stringAt = (x: number, y: number, tolerance: number) => {
  let best = -1;
  let bestDist = tolerance;
  strings.forEach((s, i) => {
    if (y < 0 || y > s.y1) return;
    const d = Math.abs(x - xAt(s, y));
    if (d < bestDist) {
      best = i;
      bestDist = d;
    }
  });
  return best;
};

/** Each string opens a section: the same links the top bar uses (C About, G Projects, D Puzzle, A Contact). */
const sectionFor = (i: number) =>
  document.querySelector<HTMLAnchorElement>(`.bar__nav a[data-string="${i}"]`)?.getAttribute("href");

function goTo(i: number) {
  const href = sectionFor(i);
  const target = href ? document.querySelector<HTMLElement>(href) : null;
  if (!target) return;
  target.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth" });
  history.replaceState(null, "", href);
}

hero.addEventListener("pointermove", (e) => {
  const r = hero.getBoundingClientRect();
  const p = { x: e.clientX - r.left, y: e.clientY - r.top, t: e.timeStamp };
  // a hand cursor over a string says "you can click this"
  hero.style.cursor = e.pointerType === "mouse" && stringAt(p.x, p.y, 12) >= 0 ? "pointer" : "";
  if (prev && p.y > 0 && p.y < strings[0].y1) {
    const from = prev;
    strings.forEach((s, i) => {
      const a = from.x - xAt(s, from.y);
      const b = p.x - xAt(s, p.y);
      if (a !== 0 && Math.sign(a) !== Math.sign(b)) {
        const speed = Math.abs(p.x - from.x) / Math.max(8, p.t - from.t);
        pluck(i, Math.min(1, speed * 0.6 + 0.2), (p.y - s.y0) / (s.y1 - s.y0));
      }
    });
  }
  prev = p;
});
hero.addEventListener("pointerleave", () => {
  prev = null;
});
// A click (or tap) on a string plays it and travels to its section; a drag across the strings just plays them
let down: { x: number; y: number; string: number } | null = null;

hero.addEventListener("pointerdown", (e) => {
  const r = hero.getBoundingClientRect();
  const x = e.clientX - r.left, y = e.clientY - r.top;
  const i = stringAt(x, y, e.pointerType === "mouse" ? 12 : 22);
  if (i >= 0) pluck(i, 0.7, (y - strings[i].y0) / (strings[i].y1 - strings[i].y0));
  down = { x, y, string: i };
  prev = { x, y, t: e.timeStamp };
});

hero.addEventListener("pointerup", (e) => {
  if (!down || down.string < 0) return;
  const r = hero.getBoundingClientRect();
  const moved = Math.hypot(e.clientX - r.left - down.x, e.clientY - r.top - down.y);
  if (moved < 8) goTo(down.string);
  down = null;
});

// The keyboard: press C, G, D or A to play that string and go to its section
const KEYS: Record<string, number> = { c: 0, g: 1, d: 2, a: 3 };
document.addEventListener("keydown", (e) => {
  if (e.ctrlKey || e.metaKey || e.altKey || e.repeat) return;
  const el = e.target as HTMLElement;
  if (el.closest("input, textarea, select, [contenteditable]")) return;
  const i = KEYS[e.key.toLowerCase()];
  if (i === undefined) return;
  pluck(i, 0.7, 0.55);
  goTo(i);
});

// Links tied to a string sound that string on the way
document.querySelectorAll<HTMLAnchorElement>("a[data-string]").forEach((a) => {
  a.addEventListener("click", () => pluck(Number(a.dataset.string), 0.6, 0.55));
});

let resizeTimer: number | undefined;
window.addEventListener("resize", () => {
  clearTimeout(resizeTimer);
  resizeTimer = window.setTimeout(layout, 120);
});
layout();
document.fonts?.ready.then(layout);
