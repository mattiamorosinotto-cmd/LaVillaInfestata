// Lettura facoltativa dei dialoghi con la sintesi vocale del dispositivo.

export function cancelVoice() {
  if ('speechSynthesis' in window) speechSynthesis.cancel();
}

/** Legge un testo se l'utente l'ha chiesto e l'audio è attivo. Ada (stanza 2) ha una voce più alta. */
export function speak(text, { prefs, audioEnabled, room }) {
  cancelVoice();
  if (!prefs.voice || !audioEnabled || !('speechSynthesis' in window)) return;
  const u = new SpeechSynthesisUtterance(text.replace(/[«»]/g, ''));
  u.lang = 'it-IT';
  u.rate = 0.8;
  u.pitch = room === 1 ? 1.12 : 0.72;
  u.volume = prefs.volume * 0.8;
  const v = speechSynthesis.getVoices().find((x) => x.lang.startsWith('it'));
  if (v) u.voice = v;
  speechSynthesis.speak(u);
}
