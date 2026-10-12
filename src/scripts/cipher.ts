/* An Alberti cipher disc: turn the inner ring to decode the message. */
import { audio } from "./audio";
import { el } from "./svg";

const svg = document.querySelector<SVGSVGElement>(".wheel__svg")!;
const wheel = document.querySelector<HTMLElement>(".wheel")!;
const msg = document.querySelector<HTMLElement>(".message")!;
const cipherOut = msg.querySelector(".message__cipher")!;
const plainOut = msg.querySelector(".message__plain")!;

const ABC = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const STEP = 360 / 26;
const KEY = Number(msg.dataset.key ?? 9);
const SECRET = (msg.dataset.secret ?? "EVERY LOCK HIDES A SONG").toUpperCase();

const shiftChar = (c: string, k: number) => {
  const i = ABC.indexOf(c);
  return i < 0 ? c : ABC[(i + k + 26 * 4) % 26];
};
const CIPHER = [...SECRET].map((c) => shiftChar(c, KEY)).join("");
cipherOut.textContent = CIPHER;

const polar = (r: number, deg: number): [number, number] => {
  const a = ((deg - 90) * Math.PI) / 180;
  return [r * Math.cos(a), r * Math.sin(a)];
};

function ring(parent: Element, radius: number, inner: number, outer: number, cls: string, lower: boolean) {
  [...ABC].forEach((c, i) => {
    const [x, y] = polar(radius, i * STEP);
    el("text", {
      class: cls, x, y, "text-anchor": "middle", "dominant-baseline": "central",
      transform: `rotate(${i * STEP} ${x} ${y})`,
    }, parent).textContent = lower ? c.toLowerCase() : c;
    const [tx0, ty0] = polar(inner, (i + 0.5) * STEP);
    const [tx1, ty1] = polar(outer, (i + 0.5) * STEP);
    el("line", { class: "tick", x1: tx0, y1: ty0, x2: tx1, y2: ty1 }, parent);
  });
}

el("circle", { class: "ring-outer", r: 196 }, svg);
ring(el("g", {}, svg), 172, 150, 196, "glyph-outer", false);
// pointer marking the reading position
el("path", { class: "pointer", d: "M0 -199 l-7 -0.5 l7 12 l7 -12z" }, svg);

const innerRing = el("g", { class: "inner" }, svg);
el("circle", { class: "ring-inner", r: 150 }, innerRing);
ring(innerRing, 128, 106, 150, "glyph-inner", true);

el("circle", { class: "ring-hub", r: 106 }, svg);
// an eight-pointed compass star at the hub
const star: string[] = [];
for (let k = 0; k < 16; k++) {
  const [x, y] = polar(k % 2 ? 22 : 64, k * 22.5);
  star.push(`${x.toFixed(1)} ${y.toFixed(1)}`);
}
el("path", { class: "hub-star", d: `M${star.join(" L")}Z` }, svg);
el("circle", { r: 5, fill: "oklch(0.84 0.12 84)" }, svg);

// Inner letter (P + s) sits under outer letter P when the ring is turned by s steps
let rot = 0; // continuous rotation in degrees
let shift = 0;

function render(animated = true) {
  innerRing.style.transition = animated ? "" : "none";
  innerRing.style.transform = `rotate(${-rot}deg)`;
  shift = ((Math.round(rot / STEP) % 26) + 26) % 26;
  svg.setAttribute("aria-valuenow", String(shift));
  svg.setAttribute("aria-valuetext", `Offset ${shift}`);
  plainOut.textContent = [...CIPHER].map((c) => shiftChar(c, -shift)).join("");
  const solved = shift === KEY;
  if (solved && !msg.classList.contains("is-solved") && audio.enabled) {
    const t = audio.now + 0.05;
    [146.83, 220.0, 293.66].forEach((f, k) => audio.bow(f, { when: t + k * 0.12, dur: 1.2, level: 0.4 }));
  }
  msg.classList.toggle("is-solved", solved);
  wheel.classList.toggle("is-solved", solved);
}

const angleOf = (e: PointerEvent) => {
  const r = svg.getBoundingClientRect();
  return (Math.atan2(e.clientY - (r.top + r.height / 2), e.clientX - (r.left + r.width / 2)) * 180) / Math.PI;
};

let dragging = false;
let lastAngle = 0;
let lastStep = 0;

svg.addEventListener("pointerdown", (e) => {
  dragging = true;
  lastAngle = angleOf(e);
  lastStep = Math.round(rot / STEP);
  svg.setPointerCapture(e.pointerId);
  svg.classList.add("is-dragging");
});

svg.addEventListener("pointermove", (e) => {
  if (!dragging) return;
  const a = angleOf(e);
  let d = a - lastAngle;
  if (d > 180) d -= 360;
  if (d < -180) d += 360;
  lastAngle = a;
  rot -= d; // dragging clockwise turns the ring clockwise
  render(false);
  const stepNow = Math.round(rot / STEP);
  if (stepNow !== lastStep) {
    lastStep = stepNow;
    audio.bow(392 + (shift % 5) * 20, { dur: 0.08, level: 0.18, attack: 0.015, vibrato: false });
  }
});

const end = () => {
  if (!dragging) return;
  dragging = false;
  svg.classList.remove("is-dragging");
  rot = Math.round(rot / STEP) * STEP;
  render(true);
};
svg.addEventListener("pointerup", end);
svg.addEventListener("pointercancel", end);

const turn = (dir: number) => {
  rot += dir * STEP;
  render(true);
};
// Keyboard: ← and → turn the ring whenever the puzzle is on screen, no click needed.
// ↑ and ↓ keep scrolling the page, unless the wheel itself has focus.
let puzzleInView = false;
const puzzle = svg.closest("section");
if (puzzle) {
  new IntersectionObserver(([entry]) => (puzzleInView = entry.isIntersecting), { threshold: 0.4 }).observe(puzzle);
}

document.addEventListener("keydown", (e) => {
  if (e.ctrlKey || e.metaKey || e.altKey) return;
  const focused = document.activeElement === svg;
  if (!focused && !puzzleInView) return;
  if ((e.target as HTMLElement).closest("input, textarea, select, [contenteditable]")) return;
  const dir =
    e.key === "ArrowRight" || (focused && e.key === "ArrowUp") ? 1
    : e.key === "ArrowLeft" || (focused && e.key === "ArrowDown") ? -1
    : 0;
  if (!dir) return;
  e.preventDefault();
  turn(dir);
});
document.querySelectorAll<HTMLButtonElement>(".wheel__btn").forEach((b) => {
  b.addEventListener("click", () => turn(Number(b.dataset.dir)));
});

render(false);
