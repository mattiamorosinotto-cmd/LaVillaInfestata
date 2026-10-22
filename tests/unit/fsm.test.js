import { test } from 'node:test';
import assert from 'node:assert/strict';
import { GAME_FLOW, LIVE_MODES, createMachine } from '../../src/engine/fsm.js';

const quietly = (fn) => {
  const original = console.error;
  const logged = [];
  console.error = (...a) => logged.push(a.join(' '));
  try {
    return [fn(), logged];
  } finally {
    console.error = original;
  }
};

test('il gioco parte dalla schermata iniziale', () => {
  assert.equal(createMachine().mode, 'landing');
});

test('una partita completa attraversa gli stati previsti', () => {
  const m = createMachine();
  const path = [
    ['transition', { target: 'room' }],
    ['room'],
    ['examine'],
    ['room'],
    ['dialogue'],
    ['examine'],
    ['paused'],
    ['room'],
    ['timeout'],
    ['transition', { target: 'room' }],
    ['room'],
    ['transition', { target: 'ending' }],
    ['ending'],
    ['transition', { target: 'room' }],
    ['room'],
    ['paused'],
    ['landing'],
  ];
  for (const [to, info] of path) assert.equal(m.go(to, info), true, `→ ${to}`);
  assert.equal(m.mode, 'landing');
});

test('le transizioni non previste vengono rifiutate e segnalate', () => {
  const m = createMachine();
  const [ok, logged] = quietly(() => m.go('room'));
  assert.equal(ok, false);
  assert.equal(m.mode, 'landing');
  assert.match(logged[0], /landing → room/);
  m.go('transition');
  m.go('room');
  m.go('paused');
  assert.equal(quietly(() => m.go('examine'))[0], false, 'dal menu di pausa non si apre un enigma');
  m.go('room');
  m.go('timeout');
  assert.equal(quietly(() => m.go('room'))[0], false, 'a tempo scaduto si riparte solo con una dissolvenza');
});

test('restare nello stesso stato è ammesso e non notifica', () => {
  const m = createMachine(GAME_FLOW, 'examine');
  let calls = 0;
  m.onChange(() => calls++);
  assert.equal(m.go('examine'), true);
  assert.equal(calls, 0);
});

test('gli ascoltatori ricevono nuovo stato, precedente e dati', () => {
  const m = createMachine();
  const seen = [];
  const off = m.onChange((to, from, data) => seen.push([to, from, data.target]));
  m.go('transition', { target: 'room' });
  off();
  m.go('room');
  assert.deepEqual(seen, [['transition', 'landing', 'room']]);
  assert.equal(m.info.target, undefined);
});

test('ogni stato ha delle uscite e porta solo a stati esistenti', () => {
  const states = Object.keys(GAME_FLOW);
  for (const [from, to] of Object.entries(GAME_FLOW)) {
    assert.ok(to.length, `${from} senza uscite`);
    for (const t of to) assert.ok(states.includes(t), `${from} → ${t} sconosciuto`);
  }
  for (const s of LIVE_MODES) assert.ok(states.includes(s));
});

test('da ogni stato si può tornare alla schermata iniziale o al finale', () => {
  const reach = (from) => {
    const seen = new Set([from]),
      todo = [from];
    while (todo.length) for (const n of GAME_FLOW[todo.pop()]) if (!seen.has(n)) seen.add(n) && todo.push(n);
    return seen;
  };
  for (const s of Object.keys(GAME_FLOW)) {
    const r = reach(s);
    assert.ok(r.has('landing') || r.has('ending'), s);
  }
});
