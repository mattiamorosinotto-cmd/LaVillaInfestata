// I contenuti sono dati: questi test controllano che siano coerenti e che ogni enigma
// abbia una e una sola soluzione, ricavata dagli indizi scritti nei documenti.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { validateContent } from '../../src/content/build.js';
import { contentFiles, loadContent } from './content.js';

const content = loadContent();
const { puzzles, rooms } = content;
const text = (html) => html.replace(/<[^>]+>/g, ' ');

test('i contenuti distribuiti superano la validazione', () => {
  assert.deepEqual(validateContent(contentFiles()), []);
  assert.equal(rooms.length, 3);
  for (const r of rooms) assert.ok(r.document && r.dialogue, r.id);
});

test('la validazione segnala i contenuti incoerenti', () => {
  const files = contentFiles();
  files.rooms[0].puzzles.push('drago');
  delete files.documents.studio;
  files.puzzles.gears.answer = '31';
  const problems = validateContent(files).join('\n');
  assert.match(problems, /enigma "drago" non definito/);
  assert.match(problems, /stanza 3 \(studio\): documento mancante/);
  assert.match(problems, /enigma "gears": risposta e lunghezza/);
});

test('ogni enigma della stanza ha un oggetto cliccabile dentro la scena', () => {
  for (const r of rooms)
    for (const id of ['doc', 'talk', ...r.puzzles])
      assert.ok(
        r.objects.some((o) => o.id === id),
        `${r.id}: ${id}`,
      );
});

test('orologi: le ore riflesse, ordinate per anno di nascita, danno la risposta', () => {
  const doc = text(rooms[0].document.html);
  const born = [...doc.matchAll(/([A-Z]+) — nat[oa] nel (\d{4})/g)].map((m) => [m[1], +m[2]]).sort((a, b) => a[1] - b[1]);
  const reflected = Object.fromEntries([...puzzles.clock.doc.matchAll(/([A-Z]+) · riflesso: (\d\d):00/g)].map((m) => [m[1], +m[2]]));
  const real = (h) => (12 - h) % 12 || 12;
  assert.equal(born.map(([name]) => real(reflected[name])).join(''), puzzles.clock.answer);
  assert.deepEqual(
    born.map(([name]) => reflected[name]),
    puzzles.clock.faces,
    'le lancette disegnate seguono il documento',
  );
});

test('contrappesi: una sola terna di cifre soddisfa le tre uguaglianze', () => {
  const eqs = [...text(puzzles.gears.doc).matchAll(/([ABC]) \+ ([ABC]) = (\d+)/g)].map((m) => [m[1], m[2], +m[3]]);
  assert.equal(eqs.length, 3);
  const sols = [];
  for (let n = 0; n < 1000; n++) {
    const v = { A: Math.floor(n / 100), B: Math.floor(n / 10) % 10, C: n % 10 };
    if (eqs.every(([x, y, sum]) => v[x] + v[y] === sum)) sols.push(String(n).padStart(3, '0'));
  }
  assert.deepEqual(sols, [puzzles.gears.answer]);
});

test('serratura: tornando indietro di tre lettere si ottiene la risposta', () => {
  const code = puzzles.cipher.doc.match(/>([A-Z]{5})</)[1];
  const back = [...code].map((c) => String.fromCharCode(((c.charCodeAt(0) - 65 + 23) % 26) + 65)).join('');
  assert.equal(back, puzzles.cipher.answer);
});

test('processione: una sola sequenza rispetta le quattro regole', () => {
  const names = puzzles.sequence.symbols.map((s) => s.name);
  const pos = (order, name) => order.indexOf(names.indexOf(name));
  const rules = [
    (o) => pos(o, 'Sole') === 4,
    (o) => pos(o, 'Corvo') === pos(o, 'Luna') + 1,
    (o) => pos(o, 'Occhio') < pos(o, 'Luna'),
    (o) => pos(o, 'Chiave') > pos(o, 'Corvo'),
  ];
  assert.match(
    puzzles.sequence.doc,
    /Il Sole chiude.*Il Corvo segue immediatamente la Luna.*L’Occhio precede la Luna.*La Chiave viene dopo il Corvo/s,
  );
  const perms = (a) => (a.length ? a.flatMap((x, i) => perms([...a.slice(0, i), ...a.slice(i + 1)]).map((p) => [x, ...p])) : [[]]);
  const sols = perms([0, 1, 2, 3, 4]).filter((o) => rules.every((r) => r(o)));
  assert.deepEqual(
    sols.map((o) => o.join('')),
    [puzzles.sequence.answer],
  );
});

test('cassaforte: un solo codice a cifre distinte è coerente con tutto il verbale', () => {
  const meaning = {
    'Una cifra corretta e al posto giusto.': [1, 0],
    'Una cifra corretta, ma al posto sbagliato.': [0, 1],
    'Due cifre corrette, entrambe al posto sbagliato.': [0, 2],
    'Nessuna cifra corretta.': [0, 0],
  };
  const clues = [...puzzles.safe.doc.matchAll(/<div>(\d{3}) · ([^<]+)<\/div>/g)].map((m) => {
    assert.ok(meaning[m[2]], 'indizio non riconosciuto: ' + m[2]);
    return [m[1], ...meaning[m[2]]];
  });
  assert.equal(clues.length, 5);
  const sols = [];
  for (let n = 0; n < 1000; n++) {
    const code = String(n).padStart(3, '0');
    if (new Set(code).size < 3) continue;
    const fits = clues.every(([guess, right, wrong]) => {
      const r = [...guess].filter((c, i) => code[i] === c).length;
      const w = [...guess].filter((c, i) => code[i] !== c && code.includes(c)).length;
      return r === right && w === wrong;
    });
    if (fits) sols.push(code);
  }
  assert.deepEqual(sols, [puzzles.safe.answer]);
});

test('i testi dell’interfaccia hanno tutti i segnaposto che il codice usa', () => {
  const { ui } = content;
  assert.match(ui.roomNumber, /\{n\}.*\{total\}/);
  assert.match(ui.notify.solved, /\{name\}/);
  assert.match(ui.puzzle.digitsLabel, /\{length\}/);
  assert.match(ui.puzzle.hintNext, /\{n\}/);
  assert.match(puzzles.lights.dynamicHints.next, /\{moves\}/);
});
