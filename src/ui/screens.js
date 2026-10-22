// Corpi HTML delle finestre di flusso: documento, porta chiusa, nuova partita, tempo scaduto, finale.
import { formatElapsed } from '../engine/clock.js';

export const documentHtml = (doc, ui) => '<div class="document">' + doc.html + '</div><small>' + ui.document.note + '</small>';

export const doorLockedHtml = (missingNames, ui) =>
  ui.doorLocked.html + '<ul>' + missingNames.map((name) => '<li>' + name + '</li>').join('') + '</ul>';

export const restartHtml = (ui) =>
  '<p>' +
  ui.restart.text +
  '</p><div class="row"><button class="primary" id="newGame">' +
  ui.restart.newGame +
  '</button><button id="keepGame">' +
  ui.restart.keepGame +
  '</button></div>';

export const timeoutHtml = (ui) => ui.timeout.html + '<button id="retry" class="primary">' + ui.timeout.retry + '</button>';

export function endingHtml(state, ui) {
  const t = ui.ending;
  return (
    t.html +
    '<div class="stats"><div>' +
    formatElapsed(state.elapsed) +
    '<small>' +
    t.time +
    '</small></div><div>' +
    state.hintsUsed +
    '<small>' +
    t.hints +
    '</small></div><div>' +
    state.restarts +
    '<small>' +
    t.restarts +
    '</small></div></div><button id="again" class="primary">' +
    t.again +
    '</button>'
  );
}
