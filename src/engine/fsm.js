// Macchina a stati del flusso di gioco.

/**
 * Stati del gioco e transizioni ammesse.
 *  landing     schermata iniziale (anche dopo «Salva ed esci»)
 *  transition  dissolvenza fra due scene; info.target dice dove porta ('room' o 'ending')
 *  room        esplorazione della stanza
 *  examine     documento, enigma, taccuino o porta chiusa aperti sopra la stanza
 *  dialogue    conversazione con un personaggio
 *  paused      menu di pausa (anche automatico, cambiando scheda)
 *  timeout     tempo scaduto, in attesa del riavvio della stanza
 *  ending      finale
 */
export const GAME_FLOW = {
  landing: ['transition'],
  transition: ['room', 'ending'],
  room: ['examine', 'dialogue', 'paused', 'timeout', 'transition'],
  examine: ['room', 'examine', 'dialogue', 'paused', 'timeout', 'transition'],
  dialogue: ['room', 'examine', 'dialogue', 'paused', 'timeout', 'transition'],
  paused: ['room', 'landing'],
  timeout: ['transition'],
  ending: ['transition'],
};

/** Stati in cui il tempo scorre e il giocatore può agire sulla stanza. */
export const LIVE_MODES = ['room', 'examine', 'dialogue'];

export function createMachine(flow = GAME_FLOW, initial = 'landing') {
  let mode = initial,
    info = {};
  const listeners = new Set();
  const machine = {
    get mode() {
      return mode;
    },
    /** Dati dell'ultima transizione, per esempio { target: 'room' }. */
    get info() {
      return info;
    },
    is: (...modes) => modes.includes(mode),
    can: (to) => to === mode || (flow[mode] || []).includes(to),
    /** Passa a un altro stato. Una transizione non prevista viene rifiutata e segnalata. */
    go(to, data = {}) {
      if (!machine.can(to)) {
        console.error('Transizione non valida: ' + mode + ' → ' + to);
        return false;
      }
      const from = mode;
      info = data;
      if (to === from) return true;
      mode = to;
      listeners.forEach((fn) => fn(to, from, data));
      return true;
    },
    onChange(fn) {
      listeners.add(fn);
      return () => listeners.delete(fn);
    },
  };
  return machine;
}
