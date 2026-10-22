import { pad2 } from './text.js';

/** Sotto questa soglia il timer diventa "urgente". */
export const URGENT_SECONDS = 120;

/** Fa avanzare il tempo di gioco di dt millisecondi. Restituisce true se il tempo è finito. */
export function advanceClock(state, dt) {
  state.remaining = Math.max(0, state.remaining - dt);
  state.elapsed += dt;
  return state.remaining <= 0;
}

/** Tempo rimanente come "mm:ss" (arrotondato per eccesso al secondo). */
export function formatRemaining(ms) {
  const sec = Math.ceil(Math.max(0, ms) / 1000);
  return { text: pad2(Math.floor(sec / 60)) + ':' + pad2(sec % 60), urgent: sec < URGENT_SECONDS };
}

/** Tempo giocato come "m:ss". */
export function formatElapsed(ms) {
  return Math.floor(ms / 60000) + ':' + pad2(Math.floor(ms / 1000) % 60);
}
