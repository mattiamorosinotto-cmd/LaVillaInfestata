import { test } from 'node:test';
import assert from 'node:assert/strict';
import { advanceClock, formatElapsed, formatRemaining } from '../../src/engine/clock.js';
import { allOff, findSolution, flip, initialLights } from '../../src/engine/lights.js';
import { hintsFor, isCorrect, missingPuzzles, solvedNote } from '../../src/engine/puzzles.js';
import { fmt } from '../../src/engine/text.js';
import { loadContent } from './content.js';

const { puzzles, rooms, ui } = loadContent();
const lights = puzzles.lights;

test('premere una luce inverte lei e le vicine ortogonali, non le diagonali', () => {
  const on = (i) => flip(Array(9).fill(false), i).map(Number).join('');
  assert.equal(on(4), '010111010');
  assert.equal(on(0), '110100000');
  assert.equal(on(8), '000001011');
});

test('premere due volte la stessa luce annulla la mossa', () => {
  const a = initialLights();
  assert.deepEqual(flip(flip(a.slice(), 3), 3), a);
});

test('la matrice iniziale è accesa e si risolve premendo 1, 2, 5, 9', () => {
  const a = initialLights();
  assert.equal(allOff(a), false);
  assert.deepEqual(findSolution(a), [1, 2, 5, 9]);
});

test('ogni configurazione della matrice ha una soluzione, e la soluzione funziona', () => {
  for (let mask = 0; mask < 512; mask++) {
    const a = Array.from({ length: 9 }, (_, i) => Boolean((mask >> i) & 1));
    const s = findSolution(a);
    s.forEach((p) => flip(a, p - 1));
    assert.ok(allOff(a), `stato ${mask}`);
  }
  assert.deepEqual(findSolution(Array(9).fill(false)), []);
});

test('i suggerimenti si rivelano uno alla volta', () => {
  assert.deepEqual(hintsFor(puzzles.clock, 0), []);
  assert.deepEqual(hintsFor(puzzles.clock, 2), puzzles.clock.hints.slice(0, 2));
});

test('i suggerimenti della matrice seguono lo stato attuale', () => {
  const a = initialLights();
  const h = hintsFor(lights, 3, a);
  assert.equal(h[0], lights.hints[0]);
  assert.equal(h[1], 'Dallo stato attuale, una soluzione inizia premendo 1 e 2. Il suggerimento si aggiorna a ogni mossa.');
  assert.equal(
    h[2],
    'Dallo stato attuale premi una volta ciascuna di queste posizioni: 1, 2, 5, 9. Non premere le altre. L’ordine non conta.',
  );
  flip(a, 0);
  assert.match(hintsFor(lights, 2, a)[1], /premendo 2 e 5\./);
  assert.deepEqual(hintsFor(lights, 3, Array(9).fill(false)).slice(1), [lights.dynamicHints.nextDone, lights.dynamicHints.fullDone]);
});

test('risposte, enigmi mancanti e nota di soluzione', () => {
  assert.equal(isCorrect(puzzles.clock, '9527'), true);
  assert.equal(isCorrect(puzzles.clock, '9528'), false);
  assert.deepEqual(missingPuzzles(rooms[0], ['gears']), ['clock']);
  assert.deepEqual(missingPuzzles(rooms[0], ['gears', 'clock']), []);
  assert.equal(solvedNote(puzzles.safe, ui), 'Risposta: 042.');
  assert.equal(solvedNote(puzzles.lights, ui), 'Il vincolo è spezzato.');
});

test('il tempo scorre, si ferma a zero e si formatta come nella Fase 0', () => {
  const s = { remaining: 1500, elapsed: 0 };
  assert.equal(advanceClock(s, 1000), false);
  assert.equal(advanceClock(s, 1000), true);
  assert.deepEqual(s, { remaining: 0, elapsed: 2000 });
  assert.deepEqual(formatRemaining(1200000), { text: '20:00', urgent: false });
  assert.deepEqual(formatRemaining(119001), { text: '02:00', urgent: false });
  assert.deepEqual(formatRemaining(119000), { text: '01:59', urgent: true });
  assert.deepEqual(formatRemaining(-5), { text: '00:00', urgent: true });
  assert.equal(formatElapsed(754321), '12:34');
});

test('fmt sostituisce i segnaposto e lascia stare quelli sconosciuti', () => {
  assert.equal(fmt('STANZA {n} / {total}', { n: '01', total: '03' }), 'STANZA 01 / 03');
  assert.equal(fmt('{a}{b}', { a: 1 }), '1{b}');
});
