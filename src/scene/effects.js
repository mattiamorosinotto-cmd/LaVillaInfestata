// Effetti di movimento: polvere, luce che segue il puntatore, riduzione automatica della qualità.
import { $ } from '../ui/dom.js';

/** Luce mobile che segue il mouse (non il dito). */
export function startFlashlight(prefs) {
  const el = $('#flashlight');
  document.addEventListener('pointermove', (e) => {
    if (!prefs.motion || e.pointerType === 'touch') return;
    el.style.transform = 'translate3d(' + e.clientX + 'px,' + e.clientY + 'px,0)';
  });
}

/** Particelle di polvere su canvas, a circa 25 fotogrammi al secondo. */
export function startDust(prefs) {
  const canvas = $('#dust'),
    cx = canvas.getContext('2d');
  let particles = [],
    cw = 0,
    ch = 0,
    lastDraw = 0;
  function resize() {
    cw = innerWidth;
    ch = innerHeight;
    const dpr = Math.min(devicePixelRatio || 1, 1.5);
    canvas.width = cw * dpr;
    canvas.height = ch * dpr;
    cx.setTransform(dpr, 0, 0, dpr, 0, 0);
    particles = Array.from({ length: Math.min(60, Math.floor(cw / 20)) }, () => ({
      x: Math.random() * cw,
      y: Math.random() * ch,
      r: 0.4 + Math.random() * 1.2,
      s: 0.07 + Math.random() * 0.18,
      a: 0.08 + Math.random() * 0.3,
    }));
  }
  function animate(t) {
    requestAnimationFrame(animate);
    if (!prefs.motion || document.hidden || t - lastDraw < 40) return;
    lastDraw = t;
    cx.clearRect(0, 0, cw, ch);
    for (const p of particles) {
      p.x += p.s;
      p.y -= p.s * 0.3;
      if (p.x > cw) p.x = 0;
      if (p.y < 0) p.y = ch;
      cx.beginPath();
      cx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      cx.fillStyle = 'rgba(188,210,201,' + p.a + ')';
      cx.fill();
    }
  }
  resize();
  addEventListener('resize', resize);
  requestAnimationFrame(animate);
}

/**
 * Misura 90 fotogrammi: se il mediano supera 28 ms spegne gli effetti di movimento.
 * Non interviene se l'utente ha scelto lui dal menu.
 */
export function autoQuality({ prefs, isActive, onReduce }) {
  if (!prefs.motion || prefs.motionUser) return;
  const f = [];
  let last = performance.now();
  const step = (t) => {
    f.push(t - last);
    last = t;
    if (f.length < 90) {
      requestAnimationFrame(step);
      return;
    }
    f.sort((a, b) => a - b);
    if (f[45] > 28 && isActive() && prefs.motion) {
      prefs.motion = false;
      onReduce();
    }
  };
  requestAnimationFrame(step);
}
