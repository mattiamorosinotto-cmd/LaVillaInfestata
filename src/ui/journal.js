// Taccuino: oggetti raccolti e tutto ciò che si è letto o ascoltato, nell'ordine in cui è successo.
// Le note di un salvataggio che non corrispondono a nessun contenuto vengono saltate.

/** Corpo HTML del taccuino per lo stato dato. */
export function journalHtml(state, content) {
  const { rooms, puzzles, ui } = content,
    t = ui.journal;
  const items =
    state.solved.map((id) => '<span class="item">' + puzzles[id].item + '</span>').join('') || '<p class="muted">' + t.empty + '</p>';
  let body = '<p class="muted">' + t.intro + '</p><h3>' + t.inventory + '</h3>' + items + '<h3>' + t.notes + '</h3><div class="journal">';
  for (const n of state.notes) {
    if (n.startsWith('doc')) {
      const doc = rooms[+n.slice(3)]?.document;
      if (!doc) continue;
      body += '<details><summary>' + doc.journalTitle + '</summary><div class="document">' + doc.html + '</div></details>';
    } else if (n.startsWith('talk')) {
      const [r, q] = n.slice(4).split(':').map(Number),
        question = rooms[r]?.dialogue.questions[q];
      if (!question) continue;
      body += '<details><summary>' + rooms[r].person + ' · ' + question.ask + '</summary><p>' + question.answer + '</p></details>';
    } else if (n.startsWith('puzzle:')) {
      const p = puzzles[n.slice(7)];
      if (!p) continue;
      body += '<details><summary>' + p.name + '</summary><div class="document">' + p.doc + '</div></details>';
    }
  }
  return body + '</div>';
}
