// Assembla e controlla i contenuti letti dai file JSON.

const OBJECT_KINDS = ['doc', 'talk'];

/** Elenco dei problemi trovati nei contenuti; vuoto se tutto è coerente. */
export function validateContent({ rooms, documents, dialogues, puzzles, ui }) {
  const problems = [];
  const need = (ok, msg) => ok || problems.push(msg);
  need(Array.isArray(rooms) && rooms.length > 0, 'rooms.json deve contenere almeno una stanza');
  need(ui && typeof ui === 'object', 'ui.json mancante');
  const seen = new Set();
  (rooms || []).forEach((r, i) => {
    const where = `stanza ${i + 1} (${r.id})`;
    need(r.id && !seen.has(r.id), `${where}: id mancante o ripetuto`);
    seen.add(r.id);
    for (const k of ['name', 'mood', 'person', 'tag', 'intro', 'door']) need(typeof r[k] === 'string', `${where}: manca "${k}"`);
    need(i === rooms.length - 1 || typeof r.exitTransition === 'string', `${where}: manca "exitTransition"`);
    need(Array.isArray(r.asides) && r.asides.length > 0, `${where}: servono degli "asides"`);
    need(documents?.[r.id]?.html && documents[r.id].title && documents[r.id].journalTitle, `${where}: documento mancante`);
    const d = dialogues?.[r.id];
    need(d?.intro && Array.isArray(d.questions) && d.questions.every((q) => q.ask && q.answer), `${where}: dialogo mancante`);
    for (const id of r.puzzles || []) need(puzzles?.[id], `${where}: enigma "${id}" non definito`);
    const objectIds = (r.objects || []).map((o) => o.id);
    for (const o of r.objects || []) {
      need(OBJECT_KINDS.includes(o.id) || (r.puzzles || []).includes(o.id), `${where}: oggetto "${o.id}" senza enigma`);
      need(o.x >= 0 && o.x <= 1536 && o.y >= 0 && o.y <= 960, `${where}: oggetto "${o.id}" fuori dalla scena 1536×960`);
    }
    for (const id of [...OBJECT_KINDS, ...(r.puzzles || [])]) need(objectIds.includes(id), `${where}: nessun oggetto per "${id}"`);
  });
  for (const [id, p] of Object.entries(puzzles || {})) {
    need(p.name && p.text && p.doc && p.item, `enigma "${id}": mancano nome, testo, documento o oggetto`);
    need(Array.isArray(p.hints) && p.hints.length === 3, `enigma "${id}": servono 3 suggerimenti`);
    if (p.input === 'digits' || p.input === 'word')
      need(typeof p.answer === 'string' && p.answer.length === p.length, `enigma "${id}": risposta e lunghezza non coincidono`);
    if (p.input === 'symbols') need(Array.isArray(p.symbols) && p.answer.length === p.symbols.length, `enigma "${id}": simboli`);
  }
  return problems;
}

/** Unisce i file in un unico oggetto: ogni stanza riceve il suo documento e il suo dialogo. */
export function buildContent(files) {
  const problems = validateContent(files);
  if (problems.length) throw new Error('Contenuti non validi:\n- ' + problems.join('\n- '));
  const rooms = files.rooms.map((r) => ({ ...r, document: files.documents[r.id], dialogue: files.dialogues[r.id] }));
  return { rooms, puzzles: files.puzzles, ui: files.ui, puzzleIds: Object.keys(files.puzzles) };
}
