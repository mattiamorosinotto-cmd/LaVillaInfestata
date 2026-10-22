# Villa dell'Ultima Ora

Escape room horror narrativa per browser: tre stanze, sei enigmi, venti minuti. Questa è la base di sviluppo della **Fase 1** del piano: lo stesso gioco della Fase 0, riorganizzato in moduli, con i contenuti in JSON, una macchina a stati per il flusso, salvataggi versionati e test automatici.

Il gioco è **un solo file**, `index.html` nella cartella principale (circa 225 KB, foto inclusa): si apre con un doppio clic, funziona offline e si pubblica su qualunque hosting statico. È **generato** da `npm run build` a partire da `sorgente.html` e dalla cartella `src/`: le modifiche si fanno lì, mai su `index.html`.

## Comandi

Serve Node.js 22.12 o più recente.

```sh
npm install                       # una volta sola
npx playwright install chromium   # una volta sola, per i test nel browser

npm run dev        # server di sviluppo con ricarica automatica (http://localhost:5173/sorgente.html)
npm run build      # rigenera index.html (e la copia per i test in dist/index.html)
npm run check      # test del motore + build + partita completa nel browser: da lanciare prima di ogni consegna

npm test           # solo i test del motore (pochi secondi, senza browser)
npm run test:e2e   # solo la partita nel browser, su dist/index.html
npm run parity     # confronto passo per passo con la Fase 0 (reference/fase0.html)
npm run format     # formatta il codice con Prettier
```

## Struttura

```
index.html               IL GIOCO, generato da npm run build: non modificarlo a mano
sorgente.html            markup della pagina (schermata iniziale, HUD, modale), punto di partenza di Vite
src/
  main.js                avvio: collega i moduli ed espone window.VILLA
  game.js                flusso di gioco: avvio, porte, tempo, pausa, finale
  content/it/            TUTTI i testi e i dati di gioco, in JSON
  engine/                logica pura, senza DOM, testata in Node
    fsm.js               macchina a stati del flusso
    save.js              salvataggi, versioni, migrazioni
    puzzles.js lights.js clock.js text.js
  audio/                 audio procedurale (Web Audio) e voce facoltativa
  scene/                 scenografie SVG, inquadratura, effetti di movimento
  ui/                    modale, enigmi, dialoghi, taccuino, menu, messaggi
  styles/main.css
  assets/villa.jpg       l'unica immagine; nel file finale compare una volta sola
tests/
  unit/                  motore e contenuti (node --test)
  e2e/play.mjs           partita completa con Playwright
  parity/compare.mjs     confronto DOM, salvataggi e pixel fra due versioni
reference/fase0.html     la versione della Fase 0, riferimento per la parità
```

## Contenuti

Testi, stanze, enigmi e dialoghi stanno in `src/content/it/`:

| File             | Contiene                                                                                            |
| ---------------- | --------------------------------------------------------------------------------------------------- |
| `rooms.json`     | stanze in ordine: nome, atmosfera, personaggio, enigmi, oggetti cliccabili, porta, frasi d'ambiente |
| `documents.json` | il documento di ogni stanza, per id della stanza                                                    |
| `dialogues.json` | battuta iniziale e tre domande del personaggio di ogni stanza                                       |
| `puzzles.json`   | enigmi: testo, indizi, risposta, suggerimenti, oggetto ottenuto                                     |
| `ui.json`        | tutti i testi dell'interfaccia; `{nome}` è un segnaposto riempito dal codice                        |

I campi che finiscono in `html` (e `doc` negli enigmi) possono contenere markup. Gli oggetti cliccabili hanno coordinate della scena (1536×960), le stesse dei disegni in `src/scene/art.js`.

I contenuti vengono validati all'avvio. Un enigma citato ma non definito, un documento mancante o una risposta di lunghezza sbagliata fermano il gioco, e la console elenca i problemi. `npm test` li segnala già prima della build. I test in `tests/unit/content.test.js` controllano anche che ogni enigma abbia **una sola soluzione** ricavabile dagli indizi scritti: se si cambia un indizio senza cambiare la risposta, il test fallisce.

## Flusso di gioco

`src/engine/fsm.js` definisce gli stati e le transizioni ammesse:

```
landing ──▶ transition ──▶ room ◀──▶ examine / dialogue
   ▲             ▲  │        │
   │             │  ▼        ├──▶ paused ──▶ room | landing
   │             │ ending    └──▶ timeout ──▶ transition
   └─────────────┴─ (Un'altra notte, Salva ed esci)
```

Il tempo scorre solo in `room`, `examine` e `dialogue`. Una transizione non prevista viene rifiutata e scritta nella console come errore, e il test end-to-end la tratta come un errore JavaScript.

## Salvataggi

Il salvataggio vive in `localStorage` con la chiave `villa-immersiva-v2` e il campo `version` (oggi 3). Vengono letti anche i formati precedenti:

- **v1**: chiave `villa-ultima-ora-v1`, prima edizione;
- **v2**: edizione immersiva senza numero di versione;
- **v3**: dalla Fase 0 in poi.

Per cambiare il formato: aggiungere in `MIGRATIONS` (in `src/engine/save.js`) la funzione da `SAVE_VERSION` a `SAVE_VERSION + 1`, aumentare `SAVE_VERSION` e aggiungere un caso in `tests/unit/save.test.js`. Dopo le migrazioni `sanitize()` ripulisce comunque i dati corrotti.

## Test

- **Motore** (`npm test`, 41 test): matrice delle luci, suggerimenti dinamici, timer, macchina a stati, salvataggi e migrazioni, coerenza dei contenuti e unicità delle soluzioni.
- **Partita nel browser** (`npm run test:e2e`). Comprende:
  - le 28 verifiche della Fase 0, cioè partita completa, rombi cliccati davvero, pausa, tempo scaduto, ricarica, vecchi salvataggi, fluidità, smartphone in verticale e in orizzontale;
  - due verifiche nuove: gli stati attraversati e la migrazione di un salvataggio v1.

  Il test gira anche sul file della Fase 0 (`node tests/e2e/play.mjs reference/fase0.html`). Il budget del fotogramma si cambia con `FRAME_BUDGET_MS` (in CI è 50 ms: i runner di GitHub non hanno GPU e lì il controllo ferma solo i peggioramenti gravi).

- **Parità** (`npm run parity`): gioca 50 passi identici su `reference/fase0.html` e sulla build, con orologio finto e caso pilotato. A ogni passo confronta DOM, salvataggi, focus e screenshot. Chromium senza GPU non rasterizza sempre allo stesso modo: i filtri SVG variano di 1–5 livelli su 255 e qualche bordo arriva a una ventina. Per questo sono ammessi scarti fino a 8 livelli, più al massimo 100 pixel di bordo fino a 64. Un testo, un colore o un elemento spostato superano di molto questi limiti: un ritocco di 18 livelli al colore oro produce già oltre 600 pixel oltre soglia. È il criterio di passaggio della Fase 1; va tolto quando una fase successiva cambierà volutamente il gioco.

`.github/workflows/test.yml` esegue tutto a ogni push e pull request su GitHub e allega gli screenshot dei test come artefatti. Controlla anche che `index.html` corrisponda al codice: la build è riproducibile byte per byte, quindi se qualcuno ha cambiato `src/` senza lanciare `npm run build` il workflow fallisce e lo dice. La parità con la Fase 0 segnala le differenze senza far fallire il workflow.

## Pubblicazione su GitHub Pages

GitHub Pages pubblica il repository così com'è: `index.html` nella cartella principale è il gioco. Il file `.nojekyll` evita che GitHub rielabori i file prima di pubblicarli; `dist/` resta fuori dal repository (è in `.gitignore`).

1. Crea su GitHub un repository **pubblico** (con un account gratuito Pages non pubblica i repository privati) senza README né altri file.
2. Nella cartella del progetto:
   ```sh
   git init -b main
   git add .
   git commit -m "Villa dell'Ultima Ora 1.1.0"
   git remote add origin https://github.com/UTENTE/REPOSITORY.git
   git push -u origin main
   ```
   In alternativa: da VS Code, «Publish to GitHub» nel pannello Controllo del codice sorgente.
3. Nel repository: **Settings → Pages → Build and deployment → Source: Deploy from a branch**, poi branch **main** e cartella **/ (root)**, e **Save**.
4. Dopo un paio di minuti il gioco è su `https://UTENTE.github.io/REPOSITORY/`.

Per ogni aggiornamento: modifica `src/` o i JSON, lancia `npm run build` (o `npm run check`, che fa anche i test), poi commit e push. GitHub ripubblica da solo il nuovo `index.html`. Il percorso del sito non conta: il gioco è un file unico senza riferimenti esterni.

## window.VILLA

Per i test e per il debug dalla console del browser: `VILLA.state` (partita corrente, modificabile), `VILLA.mode` (stato del flusso), `VILLA.render()`, `VILLA.prefs`, `VILLA.puzzles`, `VILLA.audio`, `VILLA.version`. Rende leggibili le soluzioni, come già accadeva leggendo il sorgente; nasconderle ha senso solo con gli enigmi generati della Fase 4.

## Note sulla Fase 1

Il comportamento è volutamente identico alla Fase 0. Fanno eccezione due difese che non si vedono giocando normalmente:

- un doppio clic rapidissimo su «Entra» non avvia due partite;
- il taccuino salta le note di un salvataggio che non corrispondono a nessun contenuto, invece di bloccarsi.

Lo scambio di eventi fra motore, scena e interfaccia previsto dall'architettura del piano arriva con la nuova scena della Fase 2. Per ora `game.js` chiama direttamente le viste: così è stato possibile dimostrare che il gioco non è cambiato.
