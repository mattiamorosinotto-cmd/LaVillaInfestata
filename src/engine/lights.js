// Matrice 3×3 delle luci: premere una luce inverte lei e le vicine ortogonali.

export const LIGHT_COUNT = 9;
/** Pressioni che generano la configurazione iniziale (posizioni 0–8). */
export const INITIAL_PRESSES = [0, 1, 4, 8];

/** Inverte la luce i e le vicine ortogonali. Modifica l'array ricevuto. */
export function flip(lights, i) {
  for (let j = 0; j < LIGHT_COUNT; j++)
    if (Math.abs((j % 3) - (i % 3)) + Math.abs(Math.floor(j / 3) - Math.floor(i / 3)) <= 1) lights[j] = !lights[j];
  return lights;
}

export function initialLights() {
  const lights = Array(LIGHT_COUNT).fill(false);
  INITIAL_PRESSES.forEach((i) => flip(lights, i));
  return lights;
}

export const allOff = (lights) => lights.every((x) => !x);

/**
 * Una soluzione dallo stato dato: le posizioni (1–9) da premere una volta ciascuna.
 * Restituisce [] se le luci sono già spente o se non esiste soluzione.
 */
export function findSolution(lights) {
  for (let mask = 0; mask < 1 << LIGHT_COUNT; mask++) {
    const board = lights.slice(),
      presses = [];
    for (let i = 0; i < LIGHT_COUNT; i++)
      if ((mask >> i) & 1) {
        flip(board, i);
        presses.push(i + 1);
      }
    if (allOff(board)) return presses;
  }
  return [];
}
