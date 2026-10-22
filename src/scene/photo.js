// La foto della villa esiste una sola volta, come sfondo CSS di #cover.
// Qui la si recupera per usarla anche dentro gli SVG, senza duplicarla nel file.

let url = '';

/** Da chiamare all'avvio, quando il CSS è già applicato. */
export function initPhoto() {
  const bg = getComputedStyle(document.getElementById('cover')).backgroundImage;
  const src = (bg.match(/url\(["']?(.*?)["']?\)$/) || [])[1] || '';
  url = toObjectUrl(src);
  return url;
}

/** Converte il data URI in un URL blob: gli SVG lo referenziano senza ricopiare i dati. */
function toObjectUrl(src) {
  try {
    const b = atob(src.split(',')[1]),
      a = new Uint8Array(b.length);
    for (let i = 0; i < b.length; i++) a[i] = b.charCodeAt(i);
    return URL.createObjectURL(new Blob([a], { type: 'image/jpeg' }));
  } catch (e) {
    // In sviluppo l'immagine è un normale URL: va bene così com'è.
    return src;
  }
}

export const photoUrl = () => url;
