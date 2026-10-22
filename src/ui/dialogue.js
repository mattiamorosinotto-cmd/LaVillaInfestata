// Conversazione con il personaggio della stanza: ritratto, battuta iniziale, tre domande.
import { portrait } from '../scene/art.js';
import { $, $$ } from './dom.js';

export function createDialogueView(ctx) {
  const { ui } = ctx.content;

  function open() {
    const s = ctx.state,
      r = ctx.content.rooms[s.room],
      d = r.dialogue;
    if (!s.talked.includes(s.room)) {
      s.talked.push(s.room);
      ctx.save();
    }
    ctx.modal.open(
      r.person,
      '<div class="dialogue-layout">' +
        portrait(s.room) +
        '<div><div class="speaker-label">' +
        r.tag +
        '</div><div id="dialogue" class="dialogue">' +
        d.intro +
        '</div></div></div><div class="choices">' +
        d.questions.map((q, i) => '<button data-question="' + i + '">' + q.ask + ui.dialogue.askSuffix + '</button>').join('') +
        '</div><small style="display:block;margin-top:18px">' +
        ui.dialogue.note +
        '</small>',
    );
    ctx.speak(d.intro);
    $$('[data-question]').forEach(
      (b) =>
        (b.onclick = () => {
          const q = +b.dataset.question;
          $('#dialogue').textContent = d.questions[q].answer;
          ctx.note('talk' + ctx.state.room + ':' + q);
          ctx.speak(d.questions[q].answer);
          ctx.audio.sfx('paper');
        }),
    );
  }

  return { open };
}
