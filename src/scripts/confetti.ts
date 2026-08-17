// hand-rolled canvas confetti for a perfect quiz score, no dependency.
// decorative, pointer-safe, and skipped when reduced motion is asked for.

const COLORS = ["#a6e3a1", "#89b4fa", "#f5c2e7", "#f9e2af", "#fab387"];
const DURATION = 2600;

export function celebrate(): void {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  const canvas = document.createElement("canvas");
  canvas.setAttribute("aria-hidden", "true");
  canvas.style.cssText =
    "position:fixed;inset:0;width:100%;height:100%;pointer-events:none;z-index:9999";
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  document.body.appendChild(canvas);

  const dpr = window.devicePixelRatio || 1;
  canvas.width = window.innerWidth * dpr;
  canvas.height = window.innerHeight * dpr;

  const particles = Array.from({ length: 140 }, () => ({
    x: (window.innerWidth / 2) * dpr,
    y: (window.innerHeight / 3) * dpr,
    vx: (Math.random() - 0.5) * 14 * dpr,
    vy: (Math.random() * -8 - 4) * dpr,
    size: (Math.random() * 6 + 4) * dpr,
    rot: Math.random() * Math.PI,
    vr: (Math.random() - 0.5) * 0.3,
    color: COLORS[Math.floor(Math.random() * COLORS.length)],
  }));

  const gravity = 0.35 * dpr;
  const start = performance.now();

  const frame = (now: number) => {
    const elapsed = now - start;
    const life = Math.max(0, 1 - elapsed / DURATION);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (const p of particles) {
      p.vy += gravity;
      p.x += p.vx;
      p.y += p.vy;
      p.rot += p.vr;
      ctx.save();
      ctx.globalAlpha = life;
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      ctx.fillStyle = p.color;
      ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6);
      ctx.restore();
    }
    if (elapsed < DURATION) requestAnimationFrame(frame);
    else canvas.remove();
  };
  requestAnimationFrame(frame);
}
