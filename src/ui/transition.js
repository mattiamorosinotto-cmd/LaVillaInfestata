import { $ } from './dom.js';

const wait = (ms) => new Promise((r) => setTimeout(r, ms));

/** Dissolvenza a nero con una frase; fn cambia la scena mentre lo schermo è coperto. */
export async function fadeTo(text, fn, { motion }) {
  const el = $('#transition');
  el.textContent = text;
  el.classList.add('visible');
  await wait(motion ? 800 : 30);
  fn();
  await wait(motion ? 1000 : 30);
  el.classList.remove('visible');
}
