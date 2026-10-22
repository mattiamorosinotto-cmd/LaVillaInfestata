// Flusso di gioco: avvio, stanze, porte, tempo, pausa, finale. Ogni passaggio passa dalla macchina a stati.
import { advanceClock } from './engine/clock.js';
import { LIVE_MODES } from './engine/fsm.js';
import { initialLights } from './engine/lights.js';
import { missingPuzzles } from './engine/puzzles.js';
import { TOTAL_MS } from './engine/save.js';
import { autoQuality } from './scene/effects.js';
import { $ } from './ui/dom.js';
import { journalHtml } from './ui/journal.js';
import { documentHtml, doorLockedHtml, endingHtml, restartHtml, timeoutHtml } from './ui/screens.js';
import { openSettings } from './ui/settings.js';
import { fadeTo } from './ui/transition.js';

/** Ogni quanto scorre il timer, ogni quanto si salva, ogni quanto può comparire una frase d'ambiente. */
const TICK_MS = 200,
  AUTOSAVE_MS = 1500,
  ASIDE_CHECK_MS = 5000,
  ASIDE_GAP_MS = 45000;

export function createGame(ctx) {
  const { fsm, content, prefs } = ctx,
    { ui, rooms } = content;
  let lastTick = performance.now(),
    launching = false,
    asideAt = 0;

  /** In una stanza, con il tempo che scorre: si può interagire. */
  const live = () => fsm.is(...LIVE_MODES);
  /** Dentro una partita (anche in pausa, a tempo scaduto o durante una dissolvenza fra stanze). */
  const inGame = () => fsm.is('room', 'examine', 'dialogue', 'paused', 'timeout') || (fsm.is('transition') && fsm.info.target === 'room');
  /** Momenti senza suoni d'ambiente aggiuntivi. */
  const quiet = () => fsm.is('transition', 'paused', 'timeout', 'ending');
  const resetClock = () => (lastTick = performance.now());
  const fade = (text, fn) => fadeTo(text, fn, prefs);

  async function launch(resume = false, withAudio = true) {
    if (launching || fsm.is('transition')) return;
    launching = true;
    try {
      prefs.audio = withAudio;
      ctx.save();
      await ctx.audio.setEnabled(withAudio);
      let s = resume ? ctx.saves.load() : ctx.saves.fresh();
      if (!s || s.finished) s = ctx.saves.fresh();
      ctx.state = s;
      fsm.go('transition', { target: 'room' });
      await fade(resume ? ui.transitions.resume : ui.transitions.start, () => {
        $('#landing').classList.add('hidden');
        $('#cover').classList.add('hidden');
        $('#play').classList.remove('hidden');
        ctx.render();
        ctx.audio.change(ctx.state.room);
        ctx.audio.sfx('door');
      });
      fsm.go('room');
      resetClock();
      ctx.save();
      setTimeout(() => autoQuality({ prefs, isActive: inGame, onReduce: reduceQuality }), 1200);
      if (ctx.state.remaining <= 0) timeout();
    } finally {
      launching = false;
    }
  }

  function reduceQuality() {
    ctx.room.applyPrefs();
    ctx.toast.show(ui.notify.lowQuality);
  }

  /** Avvio dalla schermata iniziale: se c'è una partita salvata chiede prima conferma. */
  function requestStart(withAudio) {
    const old = ctx.saves.load();
    if (old && !old.finished) {
      ctx.modal.open(ui.restart.title, restartHtml(ui), true);
      $('#newGame').onclick = () => {
        ctx.modal.close(true);
        launch(false, withAudio);
      };
      $('#keepGame').onclick = () => {
        ctx.modal.close(true);
        launch(true, withAudio);
      };
    } else launch(false, withAudio);
  }

  /** Clic su un oggetto della stanza: documento, personaggio o enigma. */
  function interact(id) {
    if (!live()) return;
    ctx.cancelVoice();
    ctx.audio.sfx(id === 'doc' ? 'paper' : id === 'talk' ? 'talk' : 'step');
    const s = ctx.state;
    if (id === 'doc') {
      ctx.note('doc' + s.room);
      const doc = rooms[s.room].document;
      ctx.modal.open(doc.title, documentHtml(doc, ui));
      fsm.go('examine');
    } else if (id === 'talk') {
      ctx.dialogue.open();
      fsm.go('dialogue');
    } else {
      ctx.puzzle.show(id);
      fsm.go('examine');
    }
  }

  async function door() {
    if (!live()) return;
    const s = ctx.state,
      missing = missingPuzzles(rooms[s.room], s.solved);
    if (missing.length) {
      ctx.audio.sfx('wrong');
      ctx.modal.open(
        ui.doorLocked.title,
        doorLockedHtml(
          missing.map((id) => content.puzzles[id].name),
          ui,
        ),
      );
      fsm.go('examine');
      return;
    }
    if (s.room === rooms.length - 1) {
      win();
      return;
    }
    fsm.go('transition', { target: 'room' });
    ctx.audio.sfx('door');
    await fade(rooms[s.room].exitTransition, () => {
      ctx.toast.hide();
      s.room++;
      ctx.render();
      ctx.audio.change(s.room);
      ctx.save();
    });
    fsm.go('room');
    resetClock();
  }

  /** Tempo scaduto: si riparte solo dalla stanza corrente, con 20 minuti nuovi. */
  function timeout() {
    fsm.go('timeout');
    ctx.cancelVoice();
    ctx.audio.tone(42, 5, 0, 0.03);
    ctx.save();
    ctx.modal.open(ui.timeout.title, timeoutHtml(ui), true);
    $('#retry').onclick = async () => {
      ctx.modal.close(true);
      const s = ctx.state,
        ids = rooms[s.room].puzzles;
      s.solved = s.solved.filter((id) => !ids.includes(id));
      s.notes = s.notes.filter(
        (n) => n !== 'doc' + s.room && !n.startsWith('talk' + s.room + ':') && !ids.some((id) => n === 'puzzle:' + id),
      );
      s.talked = s.talked.filter((x) => x !== s.room);
      if (ids.includes('lights')) s.lights = initialLights();
      s.remaining = TOTAL_MS;
      s.restarts++;
      fsm.go('transition', { target: 'room' });
      await fade(ui.transitions.retry, () => {
        ctx.toast.hide();
        ctx.render();
        ctx.save();
      });
      fsm.go('room');
      resetClock();
    };
  }

  async function win() {
    fsm.go('transition', { target: 'ending' });
    ctx.state.finished = true;
    ctx.save();
    ctx.audio.sfx('door');
    await fade(ui.transitions.ending, () => {
      $('#cover').classList.remove('hidden');
      $('#cover').style.filter = 'brightness(.95) saturate(.65)';
      $('#play').classList.add('hidden');
      ctx.audio.change(-1);
    });
    fsm.go('ending');
    ctx.modal.open(ui.ending.title, endingHtml(ctx.state, ui), true);
    $('#again').onclick = () => {
      ctx.modal.close(true);
      launch(false, ctx.audio.enabled);
    };
  }

  function openJournal() {
    if (quiet() || !ctx.state) return;
    ctx.audio.sfx('paper');
    ctx.modal.open(ui.journal.title, journalHtml(ctx.state, content));
    if (live()) fsm.go('examine');
  }

  /** Menu di pausa. auto = aperto da solo perché la scheda è stata nascosta. */
  function settings(auto = false) {
    if (fsm.is('transition') || ctx.modal.locked) return;
    const playing = inGame();
    if (playing) {
      fsm.go('paused');
      ctx.save();
    }
    ctx.cancelVoice();
    openSettings(ctx, {
      auto,
      inGame: playing,
      onBack() {
        ctx.modal.close(true);
        if (fsm.is('paused')) fsm.go('room');
        resetClock();
      },
      onExit() {
        ctx.save();
        ctx.modal.close(true);
        fsm.go('landing');
        $('#play').classList.add('hidden');
        $('#cover').classList.remove('hidden');
        $('#landing').classList.remove('hidden');
        $('#resume').classList.remove('hidden');
        ctx.audio.change(-1);
      },
    });
  }

  /** Chiudere un documento, un enigma o un dialogo riporta alla stanza. */
  function onModalClosed() {
    if (fsm.is('examine', 'dialogue')) fsm.go('room');
  }

  /** Timer, salvataggio automatico, frasi d'ambiente, pausa automatica. */
  function start() {
    setInterval(() => {
      const now = performance.now(),
        dt = now - lastTick;
      lastTick = now;
      if (live() && !ctx.state.finished) {
        const over = advanceClock(ctx.state, dt);
        ctx.room.updateTimer();
        if (over) timeout();
      }
    }, TICK_MS);
    setInterval(() => {
      if (inGame()) ctx.save();
    }, AUTOSAVE_MS);
    asideAt = performance.now();
    setInterval(() => {
      if (!fsm.is('room') || ctx.modal.isOpen()) return;
      if (performance.now() - asideAt < ASIDE_GAP_MS) return;
      asideAt = performance.now();
      const a = rooms[ctx.state.room].asides;
      $('#narration').textContent = a[Math.floor(Math.random() * a.length)];
    }, ASIDE_CHECK_MS);
    document.addEventListener('visibilitychange', () => {
      if (document.hidden && live()) {
        ctx.save();
        settings(true);
      }
    });
    window.addEventListener('pagehide', () => ctx.save());
  }

  return { launch, requestStart, interact, door, timeout, win, openJournal, settings, onModalClosed, start, live, inGame, quiet };
}
