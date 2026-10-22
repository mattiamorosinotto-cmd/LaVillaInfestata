// Salvataggi: formato versionato, migrazioni automatiche, difesa da dati corrotti.
import { allOff, initialLights } from './lights.js';

export const SAVE_KEY = 'villa-immersiva-v2';
/** Chiave della prima edizione del gioco: viene ancora letta, mai scritta. */
export const LEGACY_KEY = 'villa-ultima-ora-v1';
export const PREFS_KEY = SAVE_KEY + '-prefs';
export const SAVE_VERSION = 3;
export const TOTAL_MS = 20 * 60 * 1000;

export function freshState() {
  return {
    version: SAVE_VERSION,
    room: 0,
    remaining: TOTAL_MS,
    solved: [],
    hints: {},
    notes: [],
    talked: [],
    lights: initialLights(),
    attempts: 0,
    restarts: 0,
    hintsUsed: 0,
    finished: false,
    elapsed: 0,
  };
}

/**
 * Ogni migrazione porta un salvataggio dalla versione N alla N+1.
 * Per cambiare il formato: aggiungi la migrazione SAVE_VERSION → SAVE_VERSION+1,
 * aumenta SAVE_VERSION e aggiungi un caso ai test in tests/unit/save.test.js.
 */
export const MIGRATIONS = {
  // v1 → v2. Prima edizione (chiave LEGACY_KEY): mancavano i dialoghi ascoltati, i contatori
  // e lo stato finale; la matrice poteva essere salvata tutta spenta prima della terza stanza.
  1: (s) => ({
    talked: [],
    attempts: 0,
    restarts: 0,
    hintsUsed: 0,
    finished: false,
    elapsed: 0,
    ...s,
    lights: Array.isArray(s.solved) && !s.solved.includes('lights') && allOff(s.lights) ? initialLights() : s.lights,
  }),
  // v2 → v3. Edizione immersiva prima della Fase 0: il salvataggio non dichiarava la versione.
  2: (s) => ({ ...s, version: 3 }),
};

/** Versione di un salvataggio grezzo; chi non la dichiara si riconosce dalla chiave. */
export const versionOf = (raw, impliedVersion) => (Number.isInteger(raw.version) ? raw.version : impliedVersion);

export function migrate(raw, fromVersion) {
  let s = { ...raw };
  for (let v = Math.max(1, fromVersion); v < SAVE_VERSION; v++) s = MIGRATIONS[v](s);
  return s;
}

/** I campi senza i quali un salvataggio non è recuperabile. */
export function isValid(s, roomCount) {
  return Boolean(
    s &&
      Number.isInteger(s.room) &&
      s.room >= 0 &&
      s.room < roomCount &&
      Number.isFinite(s.remaining) &&
      Array.isArray(s.solved) &&
      Array.isArray(s.lights) &&
      s.lights.length === 9 &&
      s.hints &&
      Array.isArray(s.notes),
  );
}

/** Ripulisce un salvataggio già migrato: tipi corretti, valori nei limiti, enigmi esistenti. */
export function sanitize(s, puzzleIds) {
  const n = Object.assign(freshState(), s);
  ['attempts', 'restarts', 'hintsUsed', 'elapsed'].forEach((k) => {
    if (!Number.isFinite(n[k])) n[k] = 0;
  });
  if (!Array.isArray(n.talked)) n.talked = [];
  n.talked = n.talked.filter(Number.isInteger);
  n.notes = n.notes.filter((x) => typeof x === 'string');
  n.solved = n.solved.filter((id) => puzzleIds.includes(id));
  if (!n.hints || typeof n.hints !== 'object' || Array.isArray(n.hints)) n.hints = {};
  n.finished = n.finished === true;
  n.remaining = Math.min(TOTAL_MS, n.remaining);
  n.lights = n.lights.map(Boolean);
  if (!n.solved.includes('lights') && allOff(n.lights)) n.lights = initialLights();
  n.version = SAVE_VERSION;
  return n;
}

/**
 * Accesso ai salvataggi su uno storage tipo localStorage. Ogni accesso è protetto:
 * se lo storage non è disponibile il gioco funziona senza salvare.
 */
export function createSaves({ storage, puzzleIds, roomCount }) {
  const sources = [
    [SAVE_KEY, 2],
    [LEGACY_KEY, 1],
  ];
  return {
    fresh: freshState,
    load() {
      for (const [key, implied] of sources) {
        try {
          const raw = JSON.parse(storage.getItem(key));
          if (isValid(raw, roomCount)) return sanitize(migrate(raw, versionOf(raw, implied)), puzzleIds);
        } catch (e) {}
      }
      return null;
    },
    save(state, prefs) {
      try {
        if (state) storage.setItem(SAVE_KEY, JSON.stringify(state));
        storage.setItem(PREFS_KEY, JSON.stringify(prefs));
      } catch (e) {}
    },
    loadPrefs(defaults) {
      try {
        Object.assign(defaults, JSON.parse(storage.getItem(PREFS_KEY)) || {});
      } catch (e) {}
      return defaults;
    },
  };
}
