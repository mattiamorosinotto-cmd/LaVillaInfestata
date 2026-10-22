// Disegno della stanza corrente: scenografia, intestazione, oggetti, hotspot, porta, timer.
import { formatRemaining } from '../engine/clock.js';
import { fmt, pad2 } from '../engine/text.js';
import { roomArt } from '../scene/art.js';
import { photoUrl } from '../scene/photo.js';
import { layoutStage } from '../scene/stage.js';
import { $, $$ } from './dom.js';

export function createRoomView(ctx) {
  const { content, prefs } = ctx;
  const { ui } = content;

  function updateTimer() {
    const t = formatRemaining(ctx.state.remaining);
    $('#timer').textContent = t.text;
    $('#timer').classList.toggle('urgent', t.urgent);
  }

  function applyPrefs() {
    document.documentElement.style.setProperty('--scene-bright', prefs.brightness);
    document.body.classList.toggle('show-labels', prefs.labels);
    $('#flashlight').hidden = !prefs.motion;
    $('#fog').hidden = !prefs.motion;
    $('#dust').hidden = !prefs.motion;
    ctx.save();
  }

  const labelsText = () => (prefs.labels ? ui.labels.hide : ui.labels.show);

  function render() {
    const s = ctx.state,
      r = content.rooms[s.room],
      solved = (id) => s.solved.includes(id);
    $('#environment').innerHTML =
      '<div class="room-art">' + roomArt(s.room, { photo: photoUrl(), faces: content.puzzles.clock.faces, lights: s.lights }) + '</div>';
    $('#roomName').textContent = r.name;
    $('#roomNumber').textContent = fmt(ui.roomNumber, { n: pad2(s.room + 1), total: pad2(content.rooms.length) });
    $('#roomMood').textContent = r.mood;
    $('#narration').textContent = r.intro;
    $('#progress').innerHTML = content.rooms.map((_, i) => '<i class="' + (i <= s.room ? 'done' : '') + '"></i>').join('');
    $('#objectNav').innerHTML = r.objects
      .map(
        ({ label, id }) =>
          '<button class="' +
          (solved(id) ? 'completed' : '') +
          '" data-object="' +
          id +
          '">' +
          (solved(id) ? ui.solvedMark : '') +
          label +
          '</button>',
      )
      .join('');
    $('#map').innerHTML = r.objects
      .map(
        ({ label, id, x, y }) =>
          '<button class="hotspot ' +
          (solved(id) ? 'solved' : '') +
          '" data-x="' +
          x +
          '" data-y="' +
          y +
          '" data-object="' +
          id +
          '" aria-label="' +
          label +
          '"><span>' +
          label +
          '</span></button>',
      )
      .join('');
    $$('[data-object]').forEach((b) => (b.onclick = () => ctx.game.interact(b.dataset.object)));
    $('#doorBtn').textContent = r.door + ui.doorSuffix;
    $('#labelsBtn').textContent = labelsText();
    updateTimer();
    applyPrefs();
    if (ctx.game.inGame()) layoutStage();
  }

  /** Accende nella scena le lampade della matrice, seguendo lo stato. */
  function syncSceneLights() {
    $$('[data-scene-light]').forEach((e) => e.setAttribute('fill', ctx.state.lights[+e.dataset.sceneLight] ? '#c4b276' : '#263b38'));
  }

  function toggleLabels() {
    prefs.labels = !prefs.labels;
    applyPrefs();
    $('#labelsBtn').textContent = labelsText();
  }

  return { render, updateTimer, applyPrefs, syncSceneLights, toggleLabels };
}
