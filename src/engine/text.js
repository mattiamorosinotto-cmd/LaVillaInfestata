/** Sostituisce i segnaposto {nome} di un testo con i valori dati. */
export function fmt(template, values = {}) {
  return template.replace(/\{(\w+)\}/g, (match, key) => (key in values ? String(values[key]) : match));
}

/** Numero a due cifre: 1 → "01". */
export const pad2 = (n) => String(n).padStart(2, '0');
