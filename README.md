# Villa dell'Ultima Ora

Escape room horror narrativa per browser: tre stanze, sei enigmi, venti minuti. Il piano di sviluppo è in [PIANO.md](PIANO.md).

Siamo alla **Fase 2**: l'atrio è rifatto nella forma del gioco finale. È una scena PixiJS con tre inquadrature e una vista ravvicinata; gli enigmi si risolvono girando lancette e ruote, e l'inventario si usa trascinando gli oggetti. Biblioteca e studio sono ancora nella forma della Fase 1, con finestre e codici.

Il gioco è **un solo file**, `index.html` nella cartella principale (circa 815 KB, foto e PixiJS inclusi): si apre con un doppio clic, funziona offline e si pubblica su qualunque hosting statico. È **generato** da `npm run build` a partire da `sorgente.html` e dalla cartella `src/`: le modifiche si fanno lì, mai su `index.html`.

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
npm run parity     # confronto con la Fase 0 (reference/fase0.html): solo a mano, l'atrio ora è diverso di proposito
npm run format     # formatta il codice con Prettier
```

## Struttura

```
index.html               IL GIOCO, generato da npm run build: non modificarlo a mano
sorgente.html            markup della pagina (schermata iniziale, HUD, modale), punto di partenza di Vite
src/
  main.js                avvio: collega i moduli, il bus degli eventi ed espone window.VILLA
  game.js                flusso di gioco: avvio, porte, tempo, pausa, finale
  explore.js             regia delle stanze nella forma nuova: inquadrature, vista ravvicinata, oggetti
  content/it/            TUTTI i testi e i dati di gioco, in JSON
  engine/                logica pura, senza DOM, testata in Node
    fsm.js               macchina a stati del flusso
    save.js              salvataggi, versioni, migrazioni
    mechanisms.js        quadranti, ruote, inventario, uso degli oggetti
    events.js            bus degli eventi del motore
    puzzles.js lights.js clock.js text.js
  audio/                 audio procedurale (Web Audio) e voce facoltativa
  scene/
    world.js             scena PixiJS: camera, inquadrature, animazioni, disegno su richiesta
    atrioArt.js          SVG dell'atrio generati dai dati (fondali, oggetti, parti mobili)
    atrioScene.js        parti mobili dell'atrio: lancette, cassetto, ruote, ago, porta
    raster.js            SVG → canvas → texture
    art.js stage.js effects.js photo.js   scenografie SVG delle stanze classiche, inquadratura, effetti
  ui/                    modale, enigmi, dialoghi, taccuino, menu, messaggi
    explore.js           strato DOM sopra la scena: punti cliccabili, quadranti, ruote, inventario
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
| `items.json`     | oggetti dell'inventario: nome, descrizione, su cosa si usano e con quale effetto                    |
| `ui.json`        | tutti i testi dell'interfaccia; `{nome}` è un segnaposto riempito dal codice                        |

I campi che finiscono in `html` (e `doc` negli enigmi) possono contenere markup. Gli oggetti cliccabili hanno coordinate della scena (1536×960), le stesse dei disegni in `src/scene/art.js`.

Una stanza nella forma nuova (oggi l'atrio) ha il campo `scene` invece di `objects`: un elenco di inquadrature, ognuna con i suoi oggetti. Ogni oggetto ha un tipo:

- `look`: da guardare da vicino;
- `puzzle`: un meccanismo, con il suo `puzzle`;
- `talk`: il personaggio;
- `door`: la porta.

Il campo `zoom` è il rettangolo che la camera inquadra da vicino, `note` la nota che entra nel taccuino e `clues` gli indizi da ripetere come testo. Gli indizi degli orologi e dei contrappesi sono dati strutturati in `puzzles.json` (`portraits`, `clocks`, `equations`). Da lì nascono sia il disegno, in `src/scene/atrioArt.js`, sia il testo per chi non vede la scena, così le due cose non possono divergere: un test lo controlla.

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

`closeup` è la vista ravvicinata delle stanze nella forma nuova: dalla stanza vi si entra e se ne esce, e da lì si aprono taccuino, dialogo e pausa. Il tempo scorre solo in `room`, `closeup`, `examine` e `dialogue`. Una transizione non prevista viene rifiutata e scritta nella console come errore, e il test end-to-end la tratta come un errore JavaScript.

## Salvataggi

Il salvataggio vive in `localStorage` con la chiave `villa-immersiva-v2` e il campo `version` (oggi 4). Vengono letti anche i formati precedenti:

- **v1**: chiave `villa-ultima-ora-v1`, prima edizione;
- **v2**: edizione immersiva senza numero di versione;
- **v3**: dalla Fase 0 alla Fase 1;
- **v4**: dalla Fase 2. Campi nuovi: `view` (inquadratura), `seen` (oggetti esaminati), `inventory` (oggetti in tasca), `taken` (oggetti raccolti) e `mech` (posizione di quadranti, ruote e contrappeso). Chi aveva risolto l'atrio a codici ritrova cassetto aperto, peso al suo posto e oggetti in tasca.

Per cambiare il formato: aggiungere in `MIGRATIONS` (in `src/engine/save.js`) la funzione da `SAVE_VERSION` a `SAVE_VERSION + 1`, aumentare `SAVE_VERSION` e aggiungere un caso in `tests/unit/save.test.js`. Dopo le migrazioni `sanitize()` ripulisce comunque i dati corrotti.

## Test

- **Motore** (`npm test`, 76 test): matrice delle luci, suggerimenti dinamici e orientati, timer, macchina a stati, salvataggi e migrazioni fino a v4, quadranti, ruote e inventario, coerenza dei contenuti e unicità delle soluzioni, e la corrispondenza fra indizi e disegni dell'atrio (ore riflesse, nomi al contrario, anni sulle targhette, equazioni).
- **Partita nel browser** (`npm run test:e2e`). Comprende:
  - la partita completa, con l'atrio giocato con le mani: lancette trascinate col mouse e girate da tastiera, peso trascinato sul quadro, ruote, chiave sulla porta;
  - pausa (anche mentre la porta si apre), tempo scaduto in vista ravvicinata, ricarica a metà atrio, vecchi salvataggi;
  - fluidità, camera animata aprendo e chiudendo la vista ravvicinata, smartphone in verticale e in orizzontale, rotazione del telefono durante la vista ravvicinata;
  - l'atrio senza WebGL (disegno 2D di PixiJS) e senza nessun disegno (solo i controlli DOM).

  In locale il test usa la GPU vera: su Windows chiede a Chromium il D3D11, altrimenti la modalità headless ripiega sul WebGL software. Con `CI=true` (GitHub Actions lo imposta da sé) usa il WebGL software SwiftShader. Il budget del fotogramma si cambia con `FRAME_BUDGET_MS`: è 20 ms in locale e 50 ms in CI, dove il controllo ferma solo i peggioramenti gravi.

- **Parità** (`npm run parity`): gioca 50 passi identici su `reference/fase0.html` e sulla build e confronta DOM, salvataggi, focus e screenshot. Era il criterio di passaggio della Fase 1. Dalla Fase 2 l'atrio è diverso di proposito, quindi è uscita dal workflow e si lancia solo a mano. Il test nel browser gira ancora anche sulla Fase 0 (`node tests/e2e/play.mjs reference/fase0.html`), con l'atrio a codici.

`.github/workflows/test.yml` esegue test del motore, build e partita nel browser a ogni push e pull request su GitHub, e allega gli screenshot dei test come artefatti. Controlla anche che `index.html` corrisponda al codice: la build è riproducibile byte per byte, quindi se qualcuno ha cambiato `src/` senza lanciare `npm run build` il workflow fallisce e lo dice.

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

Per i test e per il debug dalla console del browser: `VILLA.state` (partita corrente, modificabile), `VILLA.mode` (stato del flusso), `VILLA.render()`, `VILLA.prefs`, `VILLA.puzzles`, `VILLA.audio`, `VILLA.version`, `VILLA.scene.info()` (renderer, inquadratura, oggetto a fuoco, se sta disegnando) e `VILLA.explore` (oggetto a fuoco e oggetto in mano). Rende leggibili le soluzioni, come già accadeva leggendo il sorgente; nasconderle ha senso solo con gli enigmi generati della Fase 4.

## Note sulla Fase 1

Il comportamento è volutamente identico alla Fase 0. Fanno eccezione due difese che non si vedono giocando normalmente:

- un doppio clic rapidissimo su «Entra» non avvia due partite;
- il taccuino salta le note di un salvataggio che non corrispondono a nessun contenuto, invece di bloccarsi.

Nelle stanze classiche `game.js` chiama ancora direttamente le viste: così è stato possibile dimostrare che il gioco non era cambiato.

## Note sulla Fase 2

Nelle stanze nella forma nuova solo il motore cambia lo stato. Le azioni del giocatore passano da `src/explore.js` alle funzioni di `src/engine/mechanisms.js`, che restituiscono eventi. Gli eventi viaggiano su un bus e li ricevono:

- la scena (`world.apply`), che li anima;
- lo strato DOM, che si ridisegna;
- l'audio, che li suona.

PixiJS disegna soltanto. Ogni controllo è un elemento DOM posizionato con la camera, così mouse, dita, tastiera, lettori di schermo e test usano gli stessi controlli. A riposo la scena non ridisegna. Senza WebGL PixiJS ripiega sul disegno 2D; se non parte del tutto, un avviso spiega che si gioca dai controlli e dalle descrizioni.

Il controllo automatico della qualità ora aspetta che la scena sia pronta. Spegne nebbia, polvere e luce mobile solo se il gioco resta lento in due misure a 4 secondi di distanza.

Manca la prova con 5 persone che non conoscono il gioco (vedi [PIANO.md](PIANO.md)).
