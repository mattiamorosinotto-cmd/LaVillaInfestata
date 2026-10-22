// Verifica di parità fra due versioni del gioco (gate della Fase 1).
//
//   node tests/parity/compare.mjs reference/fase0.html dist/index.html [cartella_risultati]
//
// Gioca la stessa sequenza di azioni su entrambi i file con l'orologio finto di Playwright
// (il tempo avanza solo quando lo decide il test) e Math.random con seme fisso.
// A ogni passo confronta:
//   - il DOM visibile (struttura, attributi, testi; gli URL blob: sono normalizzati),
//   - il salvataggio e le preferenze in localStorage,
//   - l'elemento con il focus,
//   - lo screenshot, pixel per pixel.
// Chromium senza GPU non rasterizza sempre allo stesso modo, anche fra due esecuzioni dello stesso
// file: i filtri SVG variano di 1–5 livelli su 255 e qualche bordo antialiasato fino a una ventina.
// Per questo uno screenshot è uguale quando:
//   - nessun canale si scosta di più di EDGE_MAX livelli;
//   - al massimo EDGE_BUDGET pixel si scostano di più di TOLERANCE livelli.
// Un testo, un colore o un elemento spostato superano di molto questi limiti.
// Il rumore misurato viene riportato a fine esecuzione.
// Termina con codice 1 alla prima differenza di ogni scenario e salva l'immagine delle differenze.
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { chromium, devices } from 'playwright';
import { PNG } from 'pngjs';

const [A, B] = [process.argv[2] || 'reference/fase0.html', process.argv[3] || 'dist/index.html'].map((f) => resolve(f));
const OUT = resolve(process.argv[4] || 'test-results/parity');
mkdirSync(OUT, { recursive: true });
const TOLERANCE = 8,
  EDGE_MAX = 64,
  EDGE_BUDGET = 100;

/** Confronto pixel: pixel oltre la tolleranza, pixel con rumore lieve, scarto massimo, esito. */
function comparePng(a, b) {
  const diff = new PNG({ width: a.width, height: a.height });
  let over = 0,
    noise = 0,
    max = 0;
  for (let i = 0; i < a.data.length; i += 4) {
    const d = Math.max(Math.abs(a.data[i] - b.data[i]), Math.abs(a.data[i + 1] - b.data[i + 1]), Math.abs(a.data[i + 2] - b.data[i + 2]));
    max = Math.max(max, d);
    const bad = d > TOLERANCE;
    if (bad) over++;
    else if (d) noise++;
    diff.data.set(bad ? [255, 0, 0, 255] : d ? [255, 200, 0, 255] : [a.data[i] / 3, a.data[i + 1] / 3, a.data[i + 2] / 3, 255], i);
  }
  return { over, noise, max, diff, same: max <= EDGE_MAX && over <= EDGE_BUDGET };
}

const SEED = `(() => { let a = 20260521; Math.random = () => { a |= 0; a = (a + 0x6d2b79f5) | 0;
  let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; })();`;
const LEGACY_SHIM = `window.VILLA = { legacy: true, get state() { return state; }, set state(v) { state = v; }, render: () => render() };`;

// Serializzazione del DOM indipendente da spazi di formattazione e dalla forma degli attributi style.
const SNAPSHOT = `(() => {
  const norm = (v) => v.replace(/blob:[^"' )]+/g, 'blob:');
  const ser = (n) => {
    if (n.nodeType === 3) { const t = n.textContent.replace(/\\s+/g, ' ').trim(); return t ? JSON.stringify(t) : ''; }
    if (n.nodeType !== 1 || n.tagName === 'SCRIPT' || n.tagName === 'STYLE') return '';
    const at = [...n.attributes].filter((a) => a.name !== 'style').map((a) => a.name + '=' + JSON.stringify(norm(a.value))).sort();
    if (n.hasAttribute('style')) at.push('style=' + JSON.stringify(n.style ? n.style.cssText : n.getAttribute('style')));
    const kids = n.tagName === 'INPUT' ? 'value=' + JSON.stringify(n.value) + (n.checked ? ' checked' : '') : [...n.childNodes].map(ser).join('');
    return '<' + n.tagName.toLowerCase() + (at.length ? ' ' + at.join(' ') : '') + '>' + kids + '</>';
  };
  const f = document.activeElement;
  return {
    dom: ser(document.body),
    html: document.documentElement.getAttribute('lang') + ' | ' + document.title + ' | ' + document.documentElement.style.cssText,
    focus: f ? f.tagName + '#' + f.id + ' ' + (f.dataset ? JSON.stringify({ ...f.dataset }) : '') + ' ' + (f.textContent || '').trim().slice(0, 40) : '',
    save: localStorage.getItem('villa-immersiva-v2'),
    prefs: localStorage.getItem('villa-immersiva-v2-prefs'),
    legacy: localStorage.getItem('villa-ultima-ora-v1'),
  };
})()`;

const realWait = (ms) => new Promise((r) => setTimeout(r, ms));
/** Fa avanzare il tempo finto a passi di 50 ms, lasciando respirare le promesse fra un passo e l'altro. */
async function settle(page, ms = 300) {
  for (let t = 0; t < ms; t += 50) {
    await page.clock.runFor(50);
    await realWait(10);
  }
}
async function until(page, expr, what) {
  for (let i = 0; i < 200; i++) {
    if (await page.evaluate(expr)) return;
    await realWait(10);
  }
  throw new Error('In attesa di: ' + what);
}
const click = (sel) => async (page) => page.click(sel);
/** Avvio della partita: l'audio si inizializza in modo asincrono, quindi si aspetta l'inizio della dissolvenza. */
const launch = (sel) => async (page) => {
  await page.click(sel);
  await until(page, "document.querySelector('#transition').classList.contains('visible')", 'dissolvenza');
  await settle(page, 300);
};
const seq =
  (...fns) =>
  async (page) => {
    for (const fn of fns) {
      await fn(page);
      await settle(page, 100);
    }
  };
const key = (k) => async (page) => page.keyboard.press(k);
const type = (sel, text) => async (page) => {
  await page.fill(sel, text);
  await page.press(sel, 'Enter');
};
const js = (code) => async (page) => page.evaluate(code);
const obj = (id) => click(`#objectNav [data-object=${id}]`);

const DESKTOP = [
  ['schermata iniziale', async () => {}],
  ['prima di entrare', click('#landingInfo')],
  ['chiuso con Esc', key('Escape')],
  ['stanza 1', launch('#silentStart')],
  ['indizi visivi', click('#labelsBtn')],
  ['registro', obj('doc')],
  ['dialogo', seq(key('Escape'), obj('talk'), click('[data-question="1"]'))],
  ['orologi, risposta sbagliata', seq(key('Escape'), obj('clock'), type('#codeInput', '1234'))],
  ['orologi, due suggerimenti', seq(click('#hintBtn'), click('#hintBtn'))],
  ['orologi risolti', type('#codeInput', '9527')],
  ['porta bloccata', seq(key('Escape'), click('#doorBtn'))],
  ['contrappesi risolti', seq(key('Escape'), obj('gears'), type('#codeInput', '314'))],
  ['taccuino', seq(key('Escape'), click('#journalBtn'))],
  ['stanza 2', seq(key('Escape'), click('#doorBtn'), (p) => settle(p, 300))],
  ['serratura risolta', seq(obj('cipher'), type('#codeInput', 'corvo'))],
  [
    'sequenza in corso',
    seq(
      key('Escape'),
      obj('sequence'),
      click('[data-symbol="0"]'),
      click('[data-symbol="2"]'),
      click('#clearSequence'),
      click('[data-symbol="4"]'),
    ),
  ],
  ['sequenza risolta', seq(click('#clearSequence'), ...[0, 1, 2, 3, 4].map((i) => click(`[data-symbol="${i}"]`)), click('#checkSequence'))],
  ['stanza 3', seq(key('Escape'), click('#doorBtn'), (p) => settle(p, 300))],
  ['matrice sigillata', obj('lights')],
  ['cassaforte risolta', seq(key('Escape'), obj('safe'), type('#codeInput', '042'))],
  [
    'matrice, tre suggerimenti',
    seq(key('Escape'), obj('lights'), click('[data-light="0"]'), click('#hintBtn'), click('#hintBtn'), click('#hintBtn')),
  ],
  ['matrice ripristinata', click('#resetLights')],
  ['menu di pausa', seq(key('Escape'), click('#menuBtn'))],
  ['ritorno dal menu', click('#back')],
  ['matrice risolta', seq(obj('lights'), ...[0, 1, 4, 8].map((i) => click(`[data-light="${i}"]`)))],
  ['finale', seq(key('Escape'), click('#doorBtn'), (p) => settle(p, 300))],
  ['un’altra notte', launch('#again')],
  ['tempo scaduto', seq(js('VILLA.state.remaining = 1000'), (p) => settle(p, 1400))],
  ['stanza ricominciata', seq(click('#retry'), (p) => settle(p, 300))],
  ['salva ed esci', seq(click('#menuBtn'), click('#home'))],
  [
    'ricarica',
    seq(
      async (p) => p.reload(),
      (p) => settle(p, 300),
    ),
  ],
  ['nuova partita?', click('#silentStart')],
  ['riprendi la salvata', launch('#keepGame')],
  [
    'pausa automatica',
    js("Object.defineProperty(document,'hidden',{value:true,configurable:true}); document.dispatchEvent(new Event('visibilitychange'))"),
  ],
];
const gotoRoom = (n) =>
  js(`VILLA.state.room=${n}; VILLA.state.solved=['clock','gears','cipher','sequence'].slice(0,${n * 2}); VILLA.render();`);
const MOBILE = [
  ['schermata iniziale', async () => {}],
  ['stanza 1', launch('#silentStart')],
  ['indizi visivi', click('#labelsBtn')],
  ['orologi', obj('clock')],
  ['dialogo', seq(key('Escape'), obj('talk'))],
  ['stanza 2', seq(key('Escape'), gotoRoom(1))],
  ['stanza 3', gotoRoom(2)],
  ['menu di pausa', click('#menuBtn')],
];
const SCENARIOS = [
  ['desktop', { viewport: { width: 1440, height: 900 } }, DESKTOP],
  ['verticale', devices['iPhone 13'], MOBILE],
  ['orizzontale', { viewport: { width: 844, height: 390 }, isMobile: true, hasTouch: true }, MOBILE],
];

async function open(browser, file, options) {
  const ctx = await browser.newContext({ ...options, reducedMotion: 'reduce' });
  await ctx.addInitScript(SEED);
  if (!readFileSync(file, 'utf8').includes('window.VILLA')) await ctx.addInitScript(LEGACY_SHIM);
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  await page.clock.install({ time: new Date('2026-10-21T21:00:00') });
  await page.clock.pauseAt(new Date('2026-10-21T21:00:01'));
  await page.goto(pathToFileURL(file).href);
  await settle(page, 100);
  return { ctx, page, errors };
}

function firstDiff(a, b) {
  let i = 0;
  while (i < a.length && a[i] === b[i]) i++;
  return `…${a.slice(Math.max(0, i - 80), i + 120)}\n   ≠ …${b.slice(Math.max(0, i - 80), i + 120)}`;
}

const browser = await chromium.launch({ args: ['--autoplay-policy=no-user-gesture-required'] });
let failed = 0,
  steps = 0,
  pixels = 0,
  noisy = 0,
  edges = 0,
  maxNoise = 0;
console.log(`A: ${A}\nB: ${B}\n`);
for (const [scenario, options, script] of SCENARIOS) {
  const a = await open(browser, A, options),
    b = await open(browser, B, options);
  let ok = true;
  for (const [i, [name, action]] of script.entries()) {
    for (const s of [a, b]) {
      await action(s.page);
      await settle(s.page, 100);
    }
    const [sa, sb] = [await a.page.evaluate(SNAPSHOT), await b.page.evaluate(SNAPSHOT)];
    const shot = (s) => s.page.screenshot({ animations: 'disabled', caret: 'hide' });
    const [ia, ib] = [PNG.sync.read(await shot(a)), PNG.sync.read(await shot(b))];
    const sizeOk = ia.width === ib.width && ia.height === ib.height;
    const px = sizeOk ? comparePng(ia, ib) : null;
    const problems = [];
    for (const k of Object.keys(sa)) if (sa[k] !== sb[k]) problems.push(`${k}: ${firstDiff(String(sa[k]), String(sb[k]))}`);
    if (!sizeOk) problems.push('screenshot di dimensioni diverse');
    else if (!px.same) problems.push(`${px.over} pixel diversi oltre la tolleranza (scarto massimo ${px.max}/255)`);
    if (px && px.same) {
      noisy += px.noise;
      edges += px.over;
      maxNoise = Math.max(maxNoise, px.max);
    }
    if (a.errors.length || b.errors.length) problems.push('errori JavaScript: ' + [...a.errors, ...b.errors].join('; '));
    steps++;
    if (sizeOk) pixels += ia.width * ia.height;
    const tag = `${scenario} ${String(i + 1).padStart(2, '0')} ${name}`;
    if (problems.length) {
      console.log('DIFF ' + tag + '\n   ' + problems.join('\n   '));
      if (sizeOk) writeFileSync(`${OUT}/${scenario}-${i + 1}-diff.png`, PNG.sync.write(px.diff));
      writeFileSync(`${OUT}/${scenario}-${i + 1}-A.png`, PNG.sync.write(ia));
      writeFileSync(`${OUT}/${scenario}-${i + 1}-B.png`, PNG.sync.write(ib));
      ok = false;
      failed++;
      break;
    }
    console.log('OK   ' + tag);
  }
  if (ok) writeFileSync(`${OUT}/${scenario}-ultimo.png`, PNG.sync.write(PNG.sync.read(await b.page.screenshot())));
  await a.ctx.close();
  await b.ctx.close();
}
await browser.close();
console.log(
  failed
    ? `\n${failed} scenari con differenze (immagini in ${OUT})`
    : `\nIdentici: ${steps} passi; DOM, salvataggi e focus uguali; ${(pixels / 1e6).toFixed(1)} milioni di pixel confrontati.\n` +
        `Rumore di rasterizzazione: ${noisy} pixel con scarto fino a ${TOLERANCE}/255, ${edges} pixel di bordo fino a ${maxNoise}/255.`,
);
process.exit(failed ? 1 : 0);
