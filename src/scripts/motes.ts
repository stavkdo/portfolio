/* Slow drifting specks of light behind the page. */
import { reduceMotion } from "./svg";

const canvas = document.querySelector<HTMLCanvasElement>(".motes");
const g = canvas?.getContext("2d");

if (canvas && g && !reduceMotion) {
  let w = 0;
  let h = 0;
  const COUNT = window.innerWidth < 600 ? 14 : 24;

  const size = () => {
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    w = window.innerWidth;
    h = window.innerHeight;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
  };
  size();
  window.addEventListener("resize", size);

  const motes = Array.from({ length: COUNT }, () => ({
    x: Math.random() * w,
    y: Math.random() * h,
    r: 0.5 + Math.random() * 1.1,
    vx: (Math.random() - 0.5) * 0.12,
    vy: -0.05 - Math.random() * 0.18,
    p: Math.random() * Math.PI * 2,
  }));

  let visible = true;
  document.addEventListener("visibilitychange", () => {
    visible = !document.hidden;
    if (visible) requestAnimationFrame(frame);
  });

  function frame(t: number) {
    if (!visible || !g) return;
    g.clearRect(0, 0, w, h);
    for (const m of motes) {
      m.x += m.vx + Math.sin(t / 3000 + m.p) * 0.08;
      m.y += m.vy;
      if (m.y < -10) {
        m.y = h + 10;
        m.x = Math.random() * w;
      }
      if (m.x < -10) m.x = w + 10;
      if (m.x > w + 10) m.x = -10;
      const a = 0.25 + 0.35 * (0.5 + 0.5 * Math.sin(t / 900 + m.p * 3));
      const grd = g.createRadialGradient(m.x, m.y, 0, m.x, m.y, m.r * 3.5);
      grd.addColorStop(0, `rgba(240, 214, 140, ${a})`);
      grd.addColorStop(1, "rgba(240, 214, 140, 0)");
      g.fillStyle = grd;
      g.beginPath();
      g.arc(m.x, m.y, m.r * 3.5, 0, Math.PI * 2);
      g.fill();
    }
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}
