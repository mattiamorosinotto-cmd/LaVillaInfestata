// Finestra di un enigma: testo, indizi, controlli di risposta e suggerimenti progressivi.
import { flip, initialLights, allOff } from '../engine/lights.js';
import { HINTS_PER_PUZZLE, hintsFor, isCorrect, solvedNote } from '../engine/puzzles.js';
import { fmt } from '../engine/text.js';
import { $, $$ } from './dom.js';

export function createPuzzleView(ctx) {
  const { content } = ctx;
  const t = content.ui.puzzle;
  let sequence = [];

  function controlsFor(id, p) {
    const s = ctx.state;
    if (p.input === 'lights')
      return s.solved.includes(p.locked.requires)
        ? '<div id="lights" class="lights"></div><button id="resetLights" class="quiet">' + t.lightsReset + '</button>'
        : '<p style="color:var(--danger)">' + p.locked.text + '</p>';
    if (p.input === 'symbols') {
      sequence = [];
      return (
        '<div id="sequence" class="sequence" aria-live="polite">' +
        t.sequenceEmpty +
        '</div><div class="symbol-options">' +
        p.symbols
          .map(
            ({ symbol, name }, i) =>
              '<button data-symbol="' + i + '" aria-label="' + name + '">' + symbol + '<small>' + name + '</small></button>',
          )
          .join('') +
        '</div><div class="row"><button class="primary" id="checkSequence">' +
        t.sequenceCheck +
        '</button><button id="clearSequence" class="quiet">' +
        t.sequenceClear +
        '</button></div>'
      );
    }
    const word = p.input === 'word';
    return (
      '<form id="codeForm" class="code-form"><input id="codeInput" aria-label="' +
      (word ? p.inputLabel : fmt(t.digitsLabel, { length: p.length })) +
      '" ' +
      (word ? 'autocapitalize="characters" spellcheck="false"' : 'inputmode="numeric"') +
      ' autocomplete="off" maxlength="' +
      p.length +
      '" placeholder="' +
      t.placeholderChar.repeat(p.length) +
      '" required><button class="primary" type="submit">' +
      t.submit +
      '</button></form>'
    );
  }

  function show(id) {
    const s = ctx.state,
      p = content.puzzles[id],
      done = s.solved.includes(id);
    ctx.note('puzzle:' + id);
    const controls = done ? '' : controlsFor(id, p);
    ctx.modal.open(
      p.name,
      '<p>' +
        p.text +
        '</p><div class="document">' +
        p.doc +
        '</div>' +
        (done
          ? '<p style="color:#afc3a4">' + t.solvedPrefix + solvedNote(p, content.ui) + '</p>'
          : controls + '<div id="feedback" class="feedback" aria-live="polite"></div>') +
        '<div class="hints"><button id="hintBtn"></button><div id="hintList"></div></div>',
    );
    renderHints(id);
    $('#hintBtn').onclick = () => {
      const n = ctx.state.hints[id] || 0;
      if (n < HINTS_PER_PUZZLE) {
        ctx.state.hints[id] = n + 1;
        ctx.state.hintsUsed++;
        ctx.save();
        renderHints(id);
        ctx.audio.sfx('paper');
      }
    };
    if (done) return;
    if ($('#codeForm'))
      $('#codeForm').onsubmit = (e) => {
        e.preventDefault();
        check(id, $('#codeInput').value.trim().toUpperCase());
      };
    if (p.input === 'symbols') {
      $$('[data-symbol]').forEach(
        (b) =>
          (b.onclick = () => {
            if (sequence.length < p.symbols.length) {
              sequence.push(+b.dataset.symbol);
              b.disabled = true;
              $('#sequence').textContent = sequence.map((i) => p.symbols[i].symbol).join(' ');
              ctx.audio.sfx('light');
            }
          }),
      );
      $('#clearSequence').onclick = () => {
        sequence = [];
        $('#sequence').textContent = t.sequenceEmpty;
        $$('[data-symbol]').forEach((b) => (b.disabled = false));
      };
      $('#checkSequence').onclick = () => check(id, sequence.join(''));
    }
    if (p.input === 'lights' && s.solved.includes(p.locked.requires)) {
      drawLights(id);
      $('#resetLights').onclick = () => {
        ctx.state.lights = initialLights();
        ctx.save();
        drawLights(id);
        ctx.room.syncSceneLights();
        renderHints(id);
      };
    }
  }

  function renderHints(id) {
    const n = ctx.state.hints[id] || 0;
    $('#hintBtn').textContent = n < HINTS_PER_PUZZLE ? fmt(t.hintNext, { n: n + 1 }) : t.hintsDone;
    $('#hintBtn').disabled = n >= HINTS_PER_PUZZLE;
    const hints = hintsFor(content.puzzles[id], n, ctx.state.lights);
    $('#hintList').innerHTML = hints.map((x, i) => '<p class="hint">' + (i + 1) + '. ' + x + '</p>').join('');
  }

  function check(id, value) {
    ctx.state.attempts++;
    if (isCorrect(content.puzzles[id], value)) solve(id);
    else {
      $('#feedback').textContent = t.wrong;
      ctx.audio.sfx('wrong');
      ctx.save();
    }
  }

  function solve(id) {
    if (!ctx.state.solved.includes(id)) ctx.state.solved.push(id);
    ctx.save();
    ctx.render();
    show(id);
    ctx.audio.sfx('success');
    ctx.toast.show(fmt(content.ui.notify.solved, { name: content.puzzles[id].name }));
  }

  function drawLights(id) {
    $('#lights').innerHTML = ctx.state.lights
      .map(
        (on, i) =>
          '<button class="light ' +
          (on ? 'on' : '') +
          '" data-light="' +
          i +
          '" aria-label="' +
          fmt(t.lightLabel, { n: i + 1 }) +
          (on ? t.lightOn : t.lightOff) +
          '" aria-pressed="' +
          on +
          '">' +
          (i + 1) +
          '</button>',
      )
      .join('');
    $$('[data-light]').forEach(
      (b) =>
        (b.onclick = () => {
          flip(ctx.state.lights, +b.dataset.light);
          ctx.state.attempts++;
          ctx.save();
          ctx.room.syncSceneLights();
          ctx.audio.sfx('light');
          if (allOff(ctx.state.lights)) solve(id);
          else {
            drawLights(id);
            renderHints(id);
          }
        }),
    );
  }

  return { show };
}
