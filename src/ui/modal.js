import { $ } from './dom.js';

/**
 * Finestra modale unica. Un modale "bloccato" si chiude solo dal codice
 * (niente Esc, niente ×, niente clic fuori). Il focus resta intrappolato dentro.
 */
export function createModal({ eyebrow, onClose = () => {}, beforeClose = () => {} }) {
  const overlay = $('#overlay'),
    modal = $('#modal'),
    content = $('#modalContent'),
    closeBtn = $('#close');
  let locked = false,
    lastFocus = null;

  const isOpen = () => !overlay.classList.contains('hidden');

  function open(title, body, lock = false) {
    if (isOpen()) lastFocus = lastFocus || document.activeElement;
    else lastFocus = document.activeElement;
    locked = lock;
    closeBtn.hidden = lock;
    content.innerHTML = '<div class="eyebrow">' + eyebrow() + '</div><h2 id="modalTitle">' + title + '</h2>' + body;
    overlay.classList.remove('hidden');
    modal.scrollTop = 0;
    setTimeout(() => {
      const el = $('#modalContent input') || $('#modalContent button') || closeBtn;
      el.focus();
    }, 30);
  }

  function close(force = false) {
    if (locked && !force) return;
    overlay.classList.add('hidden');
    locked = false;
    beforeClose();
    if (lastFocus && document.contains(lastFocus)) lastFocus.focus();
    onClose();
  }

  closeBtn.onclick = () => close();
  overlay.onclick = (e) => {
    if (e.target === overlay) close();
  };
  document.addEventListener('keydown', (e) => {
    if (!isOpen()) return;
    if (e.key === 'Escape') close();
    if (e.key === 'Tab') {
      const f = [...modal.querySelectorAll('button,input,a,select,summary')].filter((x) => !x.disabled && x.offsetParent !== null);
      if (!f.length) return;
      const first = f[0],
        last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
  });

  return {
    open,
    close,
    isOpen,
    get locked() {
      return locked;
    },
  };
}
