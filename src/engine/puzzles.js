import { findSolution } from './lights.js';
import { fmt } from './text.js';

export const HINTS_PER_PUZZLE = 3;

export const isCorrect = (puzzle, value) => value === puzzle.answer;

/** Enigmi della stanza non ancora risolti, nell'ordine della stanza. */
export const missingPuzzles = (room, solved) => room.puzzles.filter((id) => !solved.includes(id));

/** Testo mostrato quando l'enigma è già risolto. */
export function solvedNote(puzzle, ui) {
  return puzzle.solvedNote ?? fmt(ui.puzzle.solvedAnswer, { answer: puzzle.answer });
}

/**
 * I suggerimenti rivelati finora. Per la matrice delle luci il secondo e il terzo
 * dipendono dallo stato attuale e si aggiornano a ogni mossa.
 */
export function hintsFor(puzzle, revealed, lights) {
  const hints = puzzle.hints.slice(0, revealed);
  const d = puzzle.dynamicHints;
  if (d) {
    const s = findSolution(lights);
    if (revealed >= 2) hints[1] = s.length ? fmt(d.next, { moves: s.slice(0, 2).join(d.pairJoiner) }) : d.nextDone;
    if (revealed >= 3) hints[2] = s.length ? fmt(d.full, { moves: s.join(d.listJoiner) }) : d.fullDone;
  }
  return hints;
}
