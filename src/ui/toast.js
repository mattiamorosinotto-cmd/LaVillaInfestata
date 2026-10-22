import { $ } from './dom.js';

/** Messaggi brevi in basso, che si chiudono da soli. */
export function createToast(duration = 3600) {
  const el = $('#toast');
  let timer;
  return {
    show(text) {
      el.textContent = text;
      el.classList.remove('hidden');
      clearTimeout(timer);
      timer = setTimeout(() => el.classList.add('hidden'), duration);
    },
    hide() {
      clearTimeout(timer);
      el.classList.add('hidden');
    },
  };
}
