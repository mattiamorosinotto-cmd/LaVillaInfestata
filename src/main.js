// Avvio: collega contenuti, motore, audio, scena e interfaccia.
import content from './content/index.js';
import { createAudioWorld } from './audio/audioWorld.js';
import { cancelVoice, speak } from './audio/voice.js';
import { createMachine } from './engine/fsm.js';
import { createSaves } from './engine/save.js';
import { createGame } from './game.js';
import { startDust, startFlashlight } from './scene/effects.js';
import { initPhoto } from './scene/photo.js';
import { watchStage } from './scene/stage.js';
import { createDialogueView } from './ui/dialogue.js';
import { $ } from './ui/dom.js';
import { createModal } from './ui/modal.js';
import { createPuzzleView } from './ui/puzzle.js';
import { createRoomView } from './ui/room.js';
import { createToast } from './ui/toast.js';

const VERSION = __APP_VERSION__;
const { ui } = content;

initPhoto();

// Lo storage può non essere disponibile (navigazione privata, iframe): ogni accesso è protetto.
const storage = {
  getItem: (k) => localStorage.getItem(k),
  setItem: (k, v) => localStorage.setItem(k, v),
};
const saves = createSaves({ storage, puzzleIds: content.puzzleIds, roomCount: content.rooms.length });
const prefs = saves.loadPrefs({
  volume: 0.65,
  brightness: 1,
  labels: false,
  motion: !matchMedia('(prefers-reduced-motion: reduce)').matches,
  voice: false,
});

/** Contesto condiviso: lo stato della partita vive qui e i moduli lo leggono al momento dell'uso. */
const ctx = {
  content,
  prefs,
  saves,
  fsm: createMachine(),
  state: null,
  save: () => saves.save(ctx.state, prefs),
  note(n) {
    if (!ctx.state.notes.includes(n)) {
      ctx.state.notes.push(n);
      ctx.save();
    }
  },
  cancelVoice,
  speak: (text) => speak(text, { prefs, audioEnabled: ctx.audio.enabled, room: ctx.state && ctx.state.room }),
  render: () => ctx.room.render(),
};

ctx.toast = createToast();
ctx.game = createGame(ctx);
ctx.modal = createModal({
  eyebrow: () => (ctx.game.inGame() ? content.rooms[ctx.state.room].name : ui.gameTitle),
  beforeClose: cancelVoice,
  onClose: () => ctx.game.onModalClosed(),
});
ctx.audio = createAudioWorld({
  prefs,
  texts: ui.notify,
  notify: (text) => ctx.toast.show(text),
  isLive: () => ctx.game.live(),
  isQuiet: () => ctx.game.quiet(),
  ambientRoom: () => (ctx.game.inGame() && ctx.state ? ctx.state.room : -1),
  onToggle(on) {
    document.body.classList.toggle('sound-off', !on);
    $('#previewAudio').textContent = on ? ui.previewAudio.on : ui.previewAudio.off;
  },
});
ctx.room = createRoomView(ctx);
ctx.puzzle = createPuzzleView(ctx);
ctx.dialogue = createDialogueView(ctx);

ctx.audio.start();
watchStage(() => ctx.game.inGame());

const { game } = ctx;
$('#start').onclick = () => game.requestStart(true);
$('#silentStart').onclick = () => game.requestStart(false);
$('#resume').onclick = () => game.launch(true, prefs.audio !== false);
const saved = saves.load();
if (saved && !saved.finished) $('#resume').classList.remove('hidden');
$('#previewAudio').onclick = () => ctx.audio.setEnabled(!ctx.audio.enabled);
$('#audioBtn').onclick = () => {
  cancelVoice();
  prefs.audio = !ctx.audio.enabled;
  ctx.save();
  ctx.audio.setEnabled(prefs.audio);
};
$('#doorBtn').onclick = () => game.door();
game.start();
$('#journalBtn').onclick = () => game.openJournal();
$('#labelsBtn').onclick = () => ctx.room.toggleLabels();
$('#menuBtn').onclick = () => game.settings();
$('#landingInfo').onclick = () => ctx.modal.open(ui.landingInfo.title, ui.landingInfo.html);

startFlashlight(prefs);
startDust(prefs);
ctx.room.applyPrefs();

/**
 * Accesso per i test automatici e per il debug dalla console del browser.
 * Non fa parte del gioco: cambiarne i valori altera la partita in corso.
 */
window.VILLA = {
  version: VERSION,
  get state() {
    return ctx.state;
  },
  set state(s) {
    ctx.state = s;
  },
  get mode() {
    return ctx.fsm.mode;
  },
  get prefs() {
    return prefs;
  },
  get puzzles() {
    return content.puzzles;
  },
  get audio() {
    return ctx.audio;
  },
  content,
  fsm: ctx.fsm,
  render: () => ctx.render(),
  save: () => ctx.save(),
};
