// Inquadratura della scena e posizione dei rombi cliccabili (hotspot).
import { $, $$ } from '../ui/dom.js';

/** viewBox dell'intera scena e della porzione inquadrata sui telefoni. */
export const VB_FULL = [0, 0, 1536, 960];
export const VB_FRAMED = [100, 110, 1240, 660];

/** full = schermo intero; framed = telefono in verticale; side = telefono in orizzontale. */
export function stageMode() {
  if (matchMedia('(max-width:760px) and (orientation:portrait)').matches) return 'framed';
  if (matchMedia('(max-height:500px) and (orientation:landscape)').matches) return 'side';
  return 'full';
}

/**
 * Adatta lo SVG al riquadro e porta ogni hotspot sulle coordinate di scena
 * (data-x, data-y) trasformate in pixel rispetto a #play.
 */
export function layoutStage() {
  const mode = stageMode();
  document.body.dataset.stage = mode;
  const env = $('#environment'),
    svg = env.querySelector('svg'),
    play = $('#play');
  if (!svg) return;
  const vb = mode === 'full' ? VB_FULL : VB_FRAMED,
    meet = mode !== 'full' || innerWidth / innerHeight > 2.1;
  svg.setAttribute('viewBox', vb.join(' '));
  svg.setAttribute('preserveAspectRatio', 'xMidYMid ' + (meet ? 'meet' : 'slice'));
  const p = play.getBoundingClientRect();
  if (mode === 'full') env.removeAttribute('style');
  else {
    const r = $('#stageSlot').getBoundingClientRect();
    env.style.cssText =
      'position:absolute;inset:auto;left:' +
      (r.left - p.left) +
      'px;top:' +
      (r.top - p.top) +
      'px;width:' +
      r.width +
      'px;height:' +
      r.height +
      'px';
  }
  const r = svg.getBoundingClientRect(),
    k = meet ? Math.min(r.width / vb[2], r.height / vb[3]) : Math.max(r.width / vb[2], r.height / vb[3]);
  const ox = r.left - p.left + (r.width - vb[2] * k) / 2,
    oy = r.top - p.top + (r.height - vb[3] * k) / 2,
    bottom = Math.min(r.bottom, innerHeight) - p.top;
  $$('#map .hotspot').forEach((h) => {
    const x = ox + (h.dataset.x - vb[0]) * k,
      y = oy + (h.dataset.y - vb[1]) * k;
    h.style.left = x + 'px';
    h.style.top = y + 'px';
    h.classList.toggle('label-up', y > bottom - 80);
  });
  arrangeLabels(bottom);
}

/** Evita che le etichette degli hotspot si sovrappongano o escano dallo schermo. */
export function arrangeLabels(bottom) {
  const hs = [...$$('#map .hotspot')],
    sp = (h) => h.querySelector('span'),
    R = (h) => sp(h).getBoundingClientRect(),
    hit = (a, b) => a.left < b.right + 6 && b.left < a.right + 6 && a.top < b.bottom + 2 && b.top < a.bottom + 2,
    Y = (h) => parseFloat(h.style.top);
  hs.forEach((h) => (sp(h).style.marginLeft = ''));
  for (let i = 0; i < hs.length; i++)
    for (let j = i + 1; j < hs.length; j++) {
      if (!hit(R(hs.at(i)), R(hs.at(j)))) continue;
      const lo = Y(hs.at(i)) > Y(hs.at(j)) ? hs.at(i) : hs.at(j),
        up = lo === hs.at(i) ? hs.at(j) : hs.at(i);
      up.classList.add('label-up');
      if (hit(R(up), R(lo)) && Y(lo) + 70 < bottom + 30) lo.classList.remove('label-up');
      if (hit(R(up), R(lo))) {
        const a = R(up),
          b = R(lo),
          l = a.left < b.left ? up : lo,
          r = l === up ? lo : up,
          d = (Math.min(a.right, b.right) - Math.max(a.left, b.left)) / 2 + 6;
        sp(l).style.marginLeft = -d + 'px';
        sp(r).style.marginLeft = d + 'px';
      }
    }
  hs.forEach((h) => {
    const r = R(h),
      m = parseFloat(sp(h).style.marginLeft) || 0;
    if (r.left < 6) sp(h).style.marginLeft = m + 6 - r.left + 'px';
    else if (r.right > innerWidth - 6) sp(h).style.marginLeft = m - (r.right - innerWidth + 6) + 'px';
  });
}

/** Ricalcola l'inquadratura a ogni ridimensionamento, solo mentre si gioca. */
export function watchStage(isActive) {
  const relayout = () => {
    if (isActive()) layoutStage();
  };
  addEventListener('resize', relayout);
  addEventListener('scroll', relayout, { passive: true });
  if ('ResizeObserver' in window) new ResizeObserver(relayout).observe($('#stageSlot'));
  return relayout;
}
