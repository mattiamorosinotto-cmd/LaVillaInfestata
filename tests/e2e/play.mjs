// Test end-to-end di Villa dell'Ultima Ora con Playwright + Chromium.
//
//   node tests/e2e/play.mjs [percorso/index.html] [cartella_screenshot]
//
// Gioca una partita completa su desktop, prova i casi limite (pausa, tempo scaduto,
// ricarica, salvataggi vecchi), clicca davvero i rombi nella scena e scatta screenshot
// su mobile. Termina con codice 1 se un controllo fallisce.
//
// Le 28 verifiche originali girano identiche anche sulla versione a file unico della
// Fase 0: per quella il test aggiunge da sé l'oggetto window.VILLA (vedi LEGACY_SHIM).
// Le verifiche marcate «Fase 1» riguardano la nuova base e girano solo su di essa.
import { readFileSync, mkdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { chromium, devices } from 'playwright';

const GAME = resolve(process.argv[2] || 'dist/index.html');
const OUT = resolve(process.argv[3] || 'test-results/screenshots');
mkdirSync(OUT, { recursive: true });
const URL = pathToFileURL(GAME).href;
const html = readFileSync(GAME, 'utf8');
const LEGACY = !html.includes('window.VILLA');
/** Budget del fotogramma mediano con tutti gli effetti attivi (ms). In CI si può allentare. */
const FRAME_BUDGET = Number(process.env.FRAME_BUDGET_MS || 20);

// La versione della Fase 0 tiene lo stato in variabili globali: questo le espone come VILLA.
const LEGACY_SHIM = `window.VILLA = {
  legacy: true,
  get state() { return state; }, set state(v) { state = v; },
  get prefs() { return prefs; }, get puzzles() { return puzzles; }, get audio() { return AudioWorld; },
  render: () => render(), save: () => save()
};`;

const failures = [];
function check(name, ok, detail = '') {
  console.log((ok ? 'OK   ' : 'FAIL ') + name + (detail ? `  [${detail}]` : ''));
  if (!ok) failures.push(name);
}
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);

async function newPage(browser, options = {}) {
  const ctx = await browser.newContext(options);
  if (LEGACY) await ctx.addInitScript(LEGACY_SHIM);
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  return { ctx, page, errors };
}

async function solveCode(page, obj, code) {
  await page.click(`#objectNav [data-object=${obj}]`);
  await page.waitForTimeout(150);
  await page.fill('#codeInput', code);
  await page.press('#codeInput', 'Enter');
  await page.waitForTimeout(250);
  await page.keyboard.press('Escape');
}

async function gotoRoom(page, n) {
  await page.evaluate(`VILLA.state.room=${n}; VILLA.state.solved=['clock','gears','cipher','sequence'].slice(0,${n * 2}); VILLA.render();`);
  await page.waitForTimeout(250);
}

// Rombi della scena: ognuno deve essere visibile e ricevere davvero il clic
const BLOCKED = `() => [...document.querySelectorAll('#map .hotspot')].filter(h => {
  const r = h.getBoundingClientRect(), x = r.x + r.width / 2, y = r.y + r.height / 2;
  if (x < 0 || y < 0 || x > innerWidth || y > innerHeight) return true;
  const e = document.elementFromPoint(x, y); return !(e === h || h.contains(e)); }).map(h => h.dataset.object)`;
const FRAMES = `() => new Promise(res => { let f = [], last = performance.now();
  function s(t) { f.push(t - last); last = t; if (f.length < 120) requestAnimationFrame(s);
  else { f.sort((a, b) => a - b); res(f[60]); } } requestAnimationFrame(s); })`;
// Ore delle lancette disegnate nella scena, ricavate dall'SVG
const SCENE_HOURS = String.raw`() => [595, 713, 831, 949].map(x => { const p = [...document.querySelectorAll('#environment path')]
  .find(e => new RegExp('^M' + x + ' 287l').test(e.getAttribute('d')) || new RegExp('^M' + x + ' 287v-\\d+m0 \\d+l').test(e.getAttribute('d')));
  if (!p) return null; const m = p.getAttribute('d').match(/l(-?[\d.]+) (-?[\d.]+)/); let a = Math.atan2(+m[1], -m[2]) * 180 / Math.PI;
  if (a < 0) a += 360; return Math.round(a / 30) || 12; })`;
const LAMPS = `[...document.querySelectorAll('#environment ellipse[rx="13"]')].map(e=>e.getAttribute('fill')).join()`;

console.log(`File: ${GAME}${LEGACY ? '  (versione a file unico, Fase 0)' : ''}\n`);
const photos = html.split('data:image/jpeg;base64').length - 1;
check('foto incorporata una sola volta', photos === 1, `${photos} copie`);

const browser = await chromium.launch({ args: ['--autoplay-policy=no-user-gesture-required'] });
const modes = []; // stati della macchina a stati osservati durante la partita (Fase 1)
const mode = async (page) => LEGACY || modes.push(await page.evaluate('VILLA.mode'));

// 1. Partita completa su desktop
{
  const { ctx, page, errors } = await newPage(browser, { viewport: { width: 1440, height: 900 } });
  const external = [];
  page.on('request', (r) => r.url().startsWith('http') && external.push(r.url()));
  await page.goto(URL);
  await mode(page);
  await page.click('#start');
  await page.waitForTimeout(2500);
  await mode(page);
  check('audio avviato', (await page.evaluate('VILLA.audio.ctx && VILLA.audio.ctx.state')) === 'running');
  const docHours = [...(await page.evaluate('VILLA.puzzles.clock.doc')).matchAll(/riflesso: (\d\d):00/g)].map((m) => +m[1]);
  const sceneHours = await page.evaluate(`(${SCENE_HOURS})()`);
  check("orologi della scena uguali ai dati dell'enigma", same(sceneHours, docHours), `scena ${sceneHours}, enigma ${docHours}`);
  const blocked = [];
  for (let n = 0; n < 3; n++) {
    await gotoRoom(page, n);
    blocked.push(...(await page.evaluate(`(${BLOCKED})()`)));
  }
  check('rombi della scena cliccabili su desktop', !blocked.length, blocked.join(', '));
  await gotoRoom(page, 0);
  await page.evaluate('VILLA.state.solved=[]; VILLA.render()');
  const xy = await page.evaluate(
    "(()=>{const r=document.querySelector('#map [data-object=gears]').getBoundingClientRect();return [r.x+r.width/2,r.y+r.height/2]})()",
  );
  await page.mouse.click(...xy);
  await page.waitForTimeout(250);
  await mode(page);
  check("clic sul rombo apre l'enigma", (await page.innerText('#modalContent')).toLowerCase().includes('contrappesi'));
  await page.keyboard.press('Escape');
  await mode(page);
  await page.click('#doorBtn');
  await page.waitForTimeout(200);
  check('porta bloccata senza enigmi', (await page.innerText('#modalContent')).includes('non cede'));
  await page.keyboard.press('Escape');
  await page.click('#objectNav [data-object=clock]');
  await page.fill('#codeInput', '0000');
  await page.press('#codeInput', 'Enter');
  check('risposta sbagliata segnalata', (await page.innerText('#feedback')) !== '');
  await page.keyboard.press('Escape');
  await solveCode(page, 'clock', '9527');
  await solveCode(page, 'gears', '314');
  await page.click('#doorBtn');
  await page.waitForTimeout(2600);
  check('stanza 2 raggiunta', (await page.evaluate('VILLA.state.room')) === 1);
  check('messaggio chiuso al cambio stanza', await page.evaluate("document.querySelector('#toast').classList.contains('hidden')"));
  await solveCode(page, 'cipher', 'corvo');
  await page.click('#objectNav [data-object=sequence]');
  for (let i = 0; i < 5; i++) await page.click(`[data-symbol="${i}"]`);
  await page.click('#checkSequence');
  await page.waitForTimeout(250);
  await page.keyboard.press('Escape');
  await page.click('#doorBtn');
  await page.waitForTimeout(2600);
  check('stanza 3 raggiunta', (await page.evaluate('VILLA.state.room')) === 2);
  await solveCode(page, 'safe', '042');
  await page.click('#objectNav [data-object=lights]');
  const before = await page.evaluate(LAMPS);
  await page.click('[data-light="0"]');
  check('lampade della scena seguono la matrice', (await page.evaluate(LAMPS)) !== before);
  await page.click('[data-light="0"]');
  for (const i of [0, 1, 4, 8]) await page.click(`[data-light="${i}"]`);
  await page.waitForTimeout(300);
  await page.keyboard.press('Escape');
  await page.click('#doorBtn');
  await page.waitForTimeout(3500);
  await mode(page);
  check('finale raggiunto', (await page.evaluate('VILLA.state.finished')) === true);
  await page.screenshot({ path: `${OUT}/desktop_finale.png` });
  check('nessun errore JavaScript', !errors.length, errors.join('; '));
  check('nessuna richiesta di rete esterna', !external.length, external.slice(0, 3).join(', '));
  await ctx.close();
}

// 2. Fluidità con nebbia, particelle e luce mobile attive
{
  const { ctx, page } = await newPage(browser, { viewport: { width: 1440, height: 900 } });
  await page.goto(URL);
  await page.click('#silentStart');
  await page.waitForTimeout(2500);
  const ms = await page.evaluate(`(${FRAMES})()`);
  check(
    `frame mediano sotto ${FRAME_BUDGET} ms con gli effetti`,
    ms < FRAME_BUDGET && (await page.evaluate('VILLA.prefs.motion')),
    `${ms.toFixed(1)} ms`,
  );
  await ctx.close();
}

// 3. Casi limite
{
  const { ctx, page, errors } = await newPage(browser, { viewport: { width: 1440, height: 900 } });
  await page.goto(URL);
  await page.click('#silentStart');
  await page.waitForTimeout(2500);
  await page.evaluate(
    "Object.defineProperty(document,'hidden',{value:true,configurable:true}); document.dispatchEvent(new Event('visibilitychange'))",
  );
  await mode(page);
  const r1 = await page.evaluate('VILLA.state.remaining');
  await page.waitForTimeout(1500);
  check('timer fermo in pausa', r1 - (await page.evaluate('VILLA.state.remaining')) < 50);
  await page.evaluate("Object.defineProperty(document,'hidden',{value:false,configurable:true})");
  await page.click('#back');
  await mode(page);
  await solveCode(page, 'clock', '9527');
  await page.evaluate('VILLA.state.remaining=1200');
  await page.waitForTimeout(1800);
  await mode(page);
  check('tempo scaduto mostrato', (await page.innerText('#modalContent')).includes('La stanza ha dimenticato'));
  await page.click('#retry');
  await page.waitForTimeout(2500);
  check(
    'riavvio solo della stanza',
    same(await page.evaluate('VILLA.state.solved'), []) && (await page.evaluate('VILLA.state.restarts')) === 1,
  );
  await page.reload();
  await page.click('#resume');
  await page.waitForTimeout(2500);
  check('«Riprendi» rispetta la scelta senza audio', (await page.evaluate('VILLA.audio.enabled')) === false);
  check('nessun errore JavaScript nei casi limite', !errors.length, errors.join('; '));
  await ctx.close();
}

// 4. Salvataggio incompleto (vecchio formato)
{
  const { ctx, page, errors } = await newPage(browser, { viewport: { width: 1440, height: 900 } });
  await page.goto(URL);
  await page.evaluate(
    "localStorage.setItem('villa-ultima-ora-v1', JSON.stringify({room:2,remaining:600000,solved:['clock','gears','cipher','sequence','safe'],hints:{},notes:[],lights:Array(9).fill(false)}))",
  );
  await page.reload();
  await page.click('#resume');
  await page.waitForTimeout(2500);
  await page.click('#objectNav [data-object=talk]');
  await page.waitForTimeout(300);
  await mode(page);
  check('salvataggio senza "talked" non rompe i dialoghi', !errors.length, errors.join('; '));
  check('matrice non resta spenta e irrisolta', !(await page.evaluate('VILLA.state.lights.every(x=>!x)')));
  if (!LEGACY) {
    const saved = await page.evaluate("JSON.parse(localStorage.getItem('villa-immersiva-v2'))");
    check(
      'Fase 1 · vecchio salvataggio migrato alla versione 3',
      saved.version === 3 && saved.room === 2 && same(saved.talked, [2]) && saved.restarts === 0,
      `version ${saved.version}, talked ${JSON.stringify(saved.talked)}`,
    );
  }
  await ctx.close();
}

// 5. Mobile: pulsante d'ingresso, rombi cliccabili, overflow, screenshot
for (const [name, opts] of [
  ['verticale', devices['iPhone 13']],
  ['orizzontale', { viewport: { width: 844, height: 390 }, isMobile: true, hasTouch: true }],
]) {
  const { ctx, page } = await newPage(browser, opts);
  await page.goto(URL);
  await page.waitForTimeout(300);
  const vh = page.viewportSize().height,
    vw = page.viewportSize().width;
  const bottom = await page.evaluate("document.querySelector('#start').getBoundingClientRect().bottom");
  check(`pulsante "Entra" visibile (${name})`, bottom <= vh, `bottom ${Math.round(bottom)} px`);
  await page.tap('#silentStart');
  await page.waitForTimeout(2500);
  await page.tap('#labelsBtn');
  await page.waitForTimeout(200);
  const blocked = [];
  for (let n = 0; n < 3; n++) {
    await gotoRoom(page, n);
    blocked.push(...(await page.evaluate(`(${BLOCKED})()`)));
    await page.screenshot({ path: `${OUT}/mobile_${name}_stanza${n + 1}.png` });
  }
  check(`rombi visibili e cliccabili (${name})`, !blocked.length, blocked.join(', '));
  check(`nessun overflow orizzontale (${name})`, (await page.evaluate('document.documentElement.scrollWidth')) <= vw);
  await ctx.close();
}
await browser.close();

if (!LEGACY) {
  const expected = ['landing', 'room', 'examine', 'room', 'ending', 'paused', 'room', 'timeout', 'dialogue'];
  check('Fase 1 · macchina a stati attraversa tutti gli stati previsti', same(modes, expected), modes.join(' → '));
}

console.log(failures.length ? `\n${failures.length} controlli falliti` : '\nTutti i controlli superati');
process.exit(failures.length ? 1 : 0);
