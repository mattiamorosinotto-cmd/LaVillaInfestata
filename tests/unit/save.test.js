import { test } from 'node:test';
import assert from 'node:assert/strict';
import { initialLights } from '../../src/engine/lights.js';
import {
  LEGACY_KEY,
  PREFS_KEY,
  SAVE_KEY,
  SAVE_VERSION,
  TOTAL_MS,
  createSaves,
  freshState,
  isValid,
  migrate,
  sanitize,
} from '../../src/engine/save.js';

const PUZZLES = ['clock', 'gears', 'cipher', 'sequence', 'safe', 'lights'];
const memory = (init = {}) => {
  const data = { ...init };
  return { data, getItem: (k) => (k in data ? data[k] : null), setItem: (k, v) => (data[k] = String(v)) };
};
const saves = (storage) => createSaves({ storage, puzzleIds: PUZZLES, roomCount: 3 });
const v1 = {
  room: 2,
  remaining: 600000,
  solved: ['clock', 'gears', 'cipher', 'sequence', 'safe'],
  hints: {},
  notes: [],
  lights: Array(9).fill(false),
};

test('una partita nuova è al formato corrente', () => {
  const s = freshState();
  assert.equal(s.version, SAVE_VERSION);
  assert.equal(s.remaining, TOTAL_MS);
  assert.deepEqual(s.lights, initialLights());
  assert.equal(isValid(s, 3), true);
});

test('v1 → v3: aggiunge i campi mancanti e riaccende la matrice spenta', () => {
  const s = migrate(v1, 1);
  assert.equal(s.version, 3);
  assert.deepEqual(s.talked, []);
  for (const k of ['attempts', 'restarts', 'hintsUsed', 'elapsed']) assert.equal(s[k], 0);
  assert.equal(s.finished, false);
  assert.deepEqual(s.lights, initialLights());
});

test('v1 → v3: se la matrice era risolta resta spenta', () => {
  const s = migrate({ ...v1, solved: [...v1.solved, 'lights'] }, 1);
  assert.deepEqual(s.lights, Array(9).fill(false));
});

test('v2 → v3: aggiunge solo il numero di versione', () => {
  const v2 = { ...freshState(), room: 1, talked: [0], attempts: 4 };
  delete v2.version;
  assert.deepEqual(migrate(v2, 2), { ...v2, version: 3 });
});

test('un salvataggio già alla versione corrente non viene toccato dalle migrazioni', () => {
  const s = { ...freshState(), room: 1 };
  assert.deepEqual(migrate(s, SAVE_VERSION), s);
});

test('la migrazione non modifica l’oggetto originale', () => {
  const raw = structuredClone(v1);
  migrate(raw, 1);
  assert.deepEqual(raw, v1);
});

test('i salvataggi senza i campi essenziali sono rifiutati', () => {
  for (const bad of [
    null,
    {},
    { ...v1, room: 3 },
    { ...v1, room: -1 },
    { ...v1, room: 1.5 },
    { ...v1, remaining: NaN },
    { ...v1, lights: [true] },
    { ...v1, notes: 'x' },
  ])
    assert.equal(isValid(bad, 3), false, JSON.stringify(bad));
});

test('sanitize ripulisce tipi e valori fuori dai limiti', () => {
  const s = sanitize(
    {
      ...freshState(),
      remaining: TOTAL_MS * 3,
      solved: ['clock', 'drago'],
      notes: ['doc0', 7],
      talked: [0, 'x'],
      hints: [],
      attempts: 'tre',
      finished: 'sì',
      lights: [1, 0, 0, 0, 0, 0, 0, 0, 0],
    },
    PUZZLES,
  );
  assert.equal(s.remaining, TOTAL_MS);
  assert.deepEqual(s.solved, ['clock']);
  assert.deepEqual(s.notes, ['doc0']);
  assert.deepEqual(s.talked, [0]);
  assert.deepEqual(s.hints, {});
  assert.equal(s.attempts, 0);
  assert.equal(s.finished, false);
  assert.deepEqual(s.lights, [true, false, false, false, false, false, false, false, false]);
});

test('sanitize mantiene l’ordine dei campi del formato (salvataggi confrontabili byte per byte)', () => {
  const keys = Object.keys(freshState());
  assert.deepEqual(
    Object.keys(sanitize({ lights: Array(9).fill(true), solved: [], notes: [], extra: 1, ...{ room: 0 } }, PUZZLES)).slice(0, keys.length),
    keys,
  );
});

test('load legge il formato vecchio e lo porta alla versione corrente', () => {
  const s = saves(memory({ [LEGACY_KEY]: JSON.stringify(v1) })).load();
  assert.equal(s.version, 3);
  assert.equal(s.room, 2);
  assert.deepEqual(s.talked, []);
  assert.notDeepEqual(s.lights, Array(9).fill(false));
});

test('load preferisce il salvataggio nuovo a quello vecchio', () => {
  const now = { ...freshState(), room: 1 };
  const s = saves(memory({ [SAVE_KEY]: JSON.stringify(now), [LEGACY_KEY]: JSON.stringify(v1) })).load();
  assert.equal(s.room, 1);
});

test('load ripiega sul vecchio se il nuovo è corrotto, e restituisce null se non c’è nulla', () => {
  assert.equal(saves(memory({ [SAVE_KEY]: '{rotto', [LEGACY_KEY]: JSON.stringify(v1) })).load().room, 2);
  assert.equal(saves(memory()).load(), null);
  assert.equal(saves(memory({ [SAVE_KEY]: '"testo"' })).load(), null);
});

test('un salvataggio di una versione futura viene letto al meglio', () => {
  const s = saves(memory({ [SAVE_KEY]: JSON.stringify({ ...freshState(), version: 9, room: 1, nuovo: true }) })).load();
  assert.equal(s.room, 1);
  assert.equal(s.version, SAVE_VERSION);
});

test('save scrive partita e preferenze; senza partita scrive solo le preferenze', () => {
  const st = memory();
  const sv = saves(st);
  sv.save(null, { volume: 0.5 });
  assert.equal(st.data[SAVE_KEY], undefined);
  assert.equal(st.data[PREFS_KEY], '{"volume":0.5}');
  const s = { ...freshState(), room: 2 };
  sv.save(s, { volume: 0.5 });
  assert.deepEqual(sv.load(), s);
});

test('se lo storage non è accessibile il gioco continua senza salvare', () => {
  const broken = {
    getItem() {
      throw new Error('bloccato');
    },
    setItem() {
      throw new Error('bloccato');
    },
  };
  const sv = saves(broken);
  assert.equal(sv.load(), null);
  assert.doesNotThrow(() => sv.save(freshState(), {}));
  assert.deepEqual(sv.loadPrefs({ volume: 0.65 }), { volume: 0.65 });
});

test('loadPrefs unisce le preferenze salvate ai valori predefiniti', () => {
  const sv = saves(memory({ [PREFS_KEY]: '{"volume":0.2,"audio":false}' }));
  assert.deepEqual(sv.loadPrefs({ volume: 0.65, voice: false }), { volume: 0.2, voice: false, audio: false });
});
