# Villa dell'Ultima Ora — Piano

Come trasformare un'avventura a finestre in un vero videogioco da browser.

Aggiornato il 22 ottobre 2026 · @Mattia-KP

## In breve

- **Oggi** il gioco funziona dall'inizio alla fine, senza errori, e i sei enigmi hanno una sola soluzione. Però si gioca a finestre: clicchi un oggetto, si apre un foglio, lo leggi e digiti un codice.
- **L'obiettivo** è che la stanza diventi il luogo in cui si gioca. La regola guida è una: **ogni indizio si vede nella scena, ogni soluzione si fa con le mani.**
- **A che punto siamo:** la Fase 0 (correzioni) e la Fase 1 (fondamenta del codice) sono finite. Della Fase 2 è pronto l'atrio nella nuova forma (versione 1.2.0), anche nella versione per telefono, dove la pagina non scorre e la scena occupa quasi tutto lo schermo (versione 1.3.0).
- **Prossimo passo:** far provare l'atrio a 5 persone che non conoscono il gioco, prima di toccare le altre stanze.

## Le fasi

| Fase                        | Cosa                                                                          | Durata        | Stato                                                    |
| --------------------------- | ----------------------------------------------------------------------------- | ------------- | -------------------------------------------------------- |
| **0** · Correzioni          | I 12 problemi trovati nei test                                                | 2 giorni      | Fatta: 11 su 12. Manca la prova su telefoni veri         |
| **1** · Fondamenta          | Codice in moduli, testi in JSON, salvataggi con versione, test automatici     | 1–2 settimane | Fatta                                                    |
| **2** · L'atrio             | La prima stanza rifatta come nel gioco finale, poi la prova con 5 persone     | 2–3 settimane | **In corso:** atrio pronto, manca la prova con 5 persone |
| **3** · Biblioteca e studio | Le altre due stanze con lo stesso modello                                     | 3–4 settimane | Da fare                                                  |
| **4** · Contenuto           | Più stanze, enigmi generati a ogni partita, modalità di gioco, finali diversi | 4–6 settimane | Da fare                                                  |
| **5** · Lancio              | App installabile, versione inglese, pubblicazione su itch.io                  | 1–2 settimane | Da fare                                                  |

Le durate valgono per una persona a tempo pieno: 11–17 settimane in tutto. A tempo parziale vanno almeno raddoppiate.

Ogni fase si chiude con un criterio verificabile. La Fase 2 è il punto di decisione: se l'atrio nuovo non convince, si corregge la forma prima di produrre le altre stanze.

## Cosa cambia

|               | Oggi                                        | Nel videogioco                                                  |
| ------------- | ------------------------------------------- | --------------------------------------------------------------- |
| Interazione   | Clic su un rombo, poi una finestra di testo | Clic, trascinamento e rotazione degli oggetti dentro la scena   |
| Enigmi        | 4 su 6 si risolvono digitando un codice     | Ogni enigma ha un meccanismo da manovrare                       |
| Indizi        | Tutti scritti nel foglio dell'enigma        | Sparsi nella stanza: targhette, riflessi, libri                 |
| Inventario    | Etichette che non si usano mai              | Oggetti da raccogliere, esaminare e usare                       |
| Scena         | Sfondo fisso                                | Cambia quando risolvi qualcosa: cassetti aperti, lampade accese |
| Porte         | Un pulsante dorato fuori dalla scena        | La porta è nella scena e si apre davanti al giocatore           |
| Risposta      | Sempre «Un ingranaggio si libera»           | Animazione e suono propri di ogni meccanismo                    |
| Tempo         | 20 minuti condivisi fra tutte le stanze     | Timer per stanza, oppure nessun timer (Fase 4)                  |
| Rigiocabilità | Stesse risposte a ogni partita              | Enigmi generati e finali diversi (Fase 4)                       |

## Cosa non cambia

- **Atmosfera e scrittura.** La storia di Elena e Ada resta com'è: asciutta, coerente, con dialoghi che danno indizi senza svelare tutto.
- **Enigmi ben costruiti.** Soluzione unica e tre suggerimenti progressivi per ciascuno.
- **Audio procedurale.** Vento, pioggia e droni sono generati dal codice, senza file audio. Si estende, non si sostituisce.
- **Rispetto del giocatore.** Pausa automatica, niente jumpscare, luminosità e movimento regolabili, tutto giocabile anche da tastiera.
- **Nessun server.** Il gioco resta una cartella statica: funziona offline e si pubblica su GitHub Pages.

## Fase 2 in dettaglio: l'atrio

### L'idea

Si prende un pezzo piccolo del gioco e lo si finisce come se fosse il gioco definitivo: grafica, enigmi, suoni, salvataggi e test. In gergo si chiama _vertical slice_. Il pezzo scelto è l'atrio, la prima stanza.

Serve a rispondere a una domanda prima di investire 3–4 settimane nelle altre stanze: **la nuova forma diverte?** È anche il banco di prova per scegliere il motore grafico.

Durante la Fase 2 biblioteca e studio restano come oggi. Il gioco intero deve restare giocabile dall'inizio alla fine.

### Cosa fa il giocatore

1. **Entra.** Il portone si chiude alle sue spalle. Nel citofono passa un respiro: è Ettore, il custode.
2. **Si guarda intorno.** L'atrio ha tre inquadrature. Si passa dall'una all'altra con le frecce, con uno swipe o da tastiera:
   - **parete dei ritratti:** Viola, Leone, Elena e Ada, ognuno con una targhetta che riporta l'anno di nascita;
   - **orologi e specchio:** quattro orologi che si vedono solo riflessi nello specchio; sotto, un cassetto chiuso;
   - **portone:** il citofono, il quadro dei contrappesi e la porta della biblioteca.
3. **Esamina.** Un clic su un oggetto lo avvicina in una vista ravvicinata, dentro la scena. Non si apre più la finestra di oggi.
4. **Risolve gli orologi.** Sul cassetto ci sono quattro quadranti. Il giocatore ruota le lancette: per ogni ritratto, dal più vecchio al più giovane, l'ora vera e non quella riflessa. Il cassetto si apre.
5. **Trova il terzo peso.** Nel cassetto ci sono il contrappeso mancante e il primo frammento del sigillo. Entrambi vanno nell'inventario.
6. **Risolve i contrappesi.** Trascina il peso sul quadro: solo ora la terza ruota si muove. Gira le tre ruote finché il meccanismo è in equilibrio, e un ago mostra quando ci è riuscito. Cade la chiave della biblioteca.
7. **Esce.** Trascina la chiave sulla porta. La porta si apre nella scena, con il suo suono, e si passa alla biblioteca.

Se il giocatore si blocca, i suggerimenti partono da ciò che ha già visto. Per esempio, chi non ha ancora guardato le targhette riceve prima un invito a guardare sotto i ritratti.

### I due enigmi, prima e dopo

Le soluzioni non cambiano: gli orologi danno 9-5-2-7, i contrappesi danno 3-1-4.

|                 | Oggi                                                                  | In Fase 2                                                                                                    |
| --------------- | --------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| **Orologi**     | Leggi gli anni nel registro e le ore riflesse nel foglio, digiti 9527 | Gli anni sono sulle targhette, le ore si vedono nello specchio. Ruoti quattro lancette e il cassetto si apre |
| **Contrappesi** | Leggi tre equazioni nel foglio, digiti 314                            | Le equazioni sono incise sul quadro. Metti il peso trovato nel cassetto e giri tre ruote                     |

I due enigmi diventano una catena: senza il peso del cassetto, i contrappesi non si risolvono. È così che la stanza cambia quando risolvi qualcosa.

Alcuni dettagli sono proposte da verificare nella prova con i giocatori: dove stanno le equazioni, quanto aiuta l'ago, come si presentano i quadranti.

### Le cose da costruire

- [x] **Scena a strati.** Sfondo, mobili, oggetti interattivi e luce stanno su livelli separati. I punti cliccabili usano le coordinate della scena, così restano sugli oggetti con qualunque schermo.
- [x] **Tre inquadrature navigabili** con frecce, swipe e tastiera.
- [x] **Vista ravvicinata** per esaminare un oggetto, al posto della finestra.
- [x] **Orologi:** anni sulle targhette, ore nello specchio, lancette da ruotare.
- [x] **Cassetto** che si apre e contiene il terzo contrappeso.
- [x] **Contrappesi:** tre ruote da girare e un ago che mostra l'equilibrio.
- [x] **Inventario che si usa:** il peso va sul quadro, la chiave va sulla porta.
- [x] **Porta** che si apre nella scena, con il suo suono.
- [x] **Suggerimenti** che sanno cosa il giocatore ha già esaminato.
- [x] **Test automatico** dell'atrio.
- [ ] **Prova con 5 persone.**

### Cosa cambia nel codice

| Parte                             | Cosa cambia                                                                                                                                                                                                                  |
| --------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Scena (`src/scene/`)              | Nuovo disegno dell'atrio, a strati, con PixiJS o con SVG (vedi «Decisioni da prendere»). Animazioni per lancette, cassetto, ruote e porta                                                                                    |
| Motore (`src/engine/`)            | Meccanismi di orologi e contrappesi, inventario. Solo il motore cambia lo stato del gioco; scena, interfaccia e audio ricevono eventi e li mostrano                                                                          |
| Flusso (`src/engine/fsm.js`)      | Uno stato nuovo per la vista ravvicinata                                                                                                                                                                                     |
| Salvataggi (`src/engine/save.js`) | Versione 4: inventario, oggetti già esaminati, posizione di lancette e ruote, cassetto aperto. Un salvataggio di oggi viene convertito senza perdere i progressi                                                             |
| Contenuti (`src/content/it/`)     | Inquadrature e oggetti dell'atrio, quadranti e ruote, oggetti dell'inventario. La risposta di Ettore cita le targhette al posto del registro                                                                                 |
| Audio (`src/audio/audioWorld.js`) | Suoni nuovi, sempre generati dal codice: lancetta, cassetto, peso, ruote, chiave, porta                                                                                                                                      |
| Accessibilità                     | Ogni gesto ha un'alternativa: lancette e ruote si girano anche con i tasti, e ogni trascinamento ha anche un pulsante «Usa»                                                                                                  |
| Test (`tests/`)                   | Test del motore per i meccanismi e per la conversione dei salvataggi. Partita nel browser che risolve l'atrio con le mani. Il confronto con la Fase 0 esce dai controlli automatici, perché ora il gioco cambia di proposito |

### In che ordine lavorare

| Tappa | Cosa                                                                                                           | Giorni |
| ----- | -------------------------------------------------------------------------------------------------------------- | ------ |
| 1     | Scegliere il motore: provare un'inquadratura con PixiJS su un telefono vero, misurare fluidità e peso del file | 1–2    |
| 2     | Basi: eventi dal motore, salvataggio versione 4, inventario, stato della vista ravvicinata                     | 2      |
| 3     | Scena: le tre inquadrature, la navigazione, la vista ravvicinata                                               | 2–3    |
| 4     | Orologi e cassetto                                                                                             | 2      |
| 5     | Contrappesi, peso, chiave e porta                                                                              | 2      |
| 6     | Suggerimenti, suoni, rifiniture per smartphone e tastiera                                                      | 1–2    |
| 7     | Test automatici                                                                                                | 1–2    |

In tutto 11–15 giorni di lavoro. La prova con le 5 persone si aggiunge a parte.

### Quando la Fase 2 è finita

- L'atrio si completa senza digitare codici e senza finestre per gli enigmi.
- Il gioco intero si completa ancora, con biblioteca e studio nella forma di oggi.
- Un salvataggio della versione attuale si apre senza perdere progressi.
- Tutto si fa anche da tastiera e su smartphone, in verticale e in orizzontale.
- La scena resta fluida: ogni fotogramma entro 20 ms in locale, con gli effetti accesi.
- `npm run check` passa e i controlli automatici su GitHub sono verdi.
- 5 persone hanno giocato l'atrio.

### La prova con i giocatori

- **Chi:** 5 persone che non conoscono il gioco, meglio se non sviluppatori.
- **Come:** una alla volta. Le guardi giocare senza aiutarle e chiedi loro di pensare ad alta voce.
- **Cosa misuri:** minuti per enigma, dove si bloccano, quanti suggerimenti aprono.
- **Alla fine chiedi:** «Vuoi continuare?»

Una modalità di prova può registrare questi tempi nel browser, senza inviare nulla in rete.

**Regola di decisione:** se tutte e 5 finiscono l'atrio e chiedono di continuare, la forma è giusta e si passa alla Fase 3. Altrimenti si corregge il punto in cui si sono bloccate e si riprova, prima di costruire le altre stanze.

### Decisioni prese

Scelte fatte il 22 ottobre 2026, prima di costruire l'atrio:

| Tema                  | Scelta                                                                                                           |
| --------------------- | ---------------------------------------------------------------------------------------------------------------- |
| Motore della scena    | PixiJS per la scena, HTML per testi, dialoghi, taccuino e menu                                                   |
| Grafica               | Vettoriale generata dal codice, come prima, rifatta a strati                                                     |
| Ago dei contrappesi   | Solo conferma: si raddrizza quando tutte e tre le ruote sono giuste                                              |
| Timer                 | Come prima: 20 minuti condivisi                                                                                  |
| Orologi               | Quattro quadranti senza nomi sul cassetto; ogni orologio porta un nome, che nello specchio si legge al contrario |
| Equazioni             | Incise sul quadro, sopra le ruote                                                                                |
| Vista ravvicinata     | La camera si avvicina all'oggetto e il resto della stanza sfuma ai bordi                                         |
| Prova con i giocatori | Nessun registro automatico: gli appunti li prende chi conduce la prova                                           |

Il registro dei ritratti non è più un foglio da aprire: diventa una nota del taccuino quando il giocatore ha visto i ritratti da vicino.

## Le fasi successive

### Fase 3 · Biblioteca e studio · 3–4 settimane

- Le altre due stanze con lo stesso modello dell'atrio.
- Il dialogo con Elena allo specchio diventa la scelta finale.

### Fase 4 · Contenuto e rigiocabilità · 4–6 settimane

- Da 3 a 6–8 stanze: per esempio cantina, serra, cappella, soffitta.
- Enigmi generati a ogni partita, con un controllo automatico che la soluzione sia unica.
- Tre modalità: **Racconto** (senza timer), **Classica** (timer per stanza), **Incubo** (niente suggerimenti).
- Due o tre finali legati alle scelte nei dialoghi; lettere e fotografie da collezionare.
- Soluzioni non più leggibili dalla console del browser (problema 11 della Fase 0).

### Fase 5 · Piattaforma e lancio · 1–2 settimane

- App web installabile (PWA): funziona offline, a schermo intero, con icona sul telefono.
- Più slot di salvataggio, esportazione del salvataggio, impostazioni separate per musica, effetti e testo.
- Versione inglese.
- Pubblicazione su itch.io e su un dominio proprio.

## Come cambiano i sei enigmi

| Stanza     | Enigma      | Oggi                                      | Versione da manovrare                                                                   | Fase |
| ---------- | ----------- | ----------------------------------------- | --------------------------------------------------------------------------------------- | ---- |
| Atrio      | Orologi     | Leggi le ore in un foglio, digiti 4 cifre | Anni sulle targhette, ore nello specchio; ruoti le lancette e il cassetto si apre       | 2    |
| Atrio      | Contrappesi | Leggi tre equazioni, digiti 3 cifre       | Giri tre ruote e un ago mostra l'equilibrio; il terzo peso è nel cassetto degli orologi | 2    |
| Biblioteca | Serratura   | Leggi FRUYR nel foglio, digiti CORVO      | Trovi il libro col corvo sul terzo scaffale, lo esamini, giri cinque cilindri           | 3    |
| Biblioteca | Fregio      | Premi cinque simboli in ordine            | Raccogli le tessere nelle stanze e le incastri nel fregio                               | 3    |
| Studio     | Cassaforte  | Leggi il verbale, digiti 3 cifre          | Trovi il verbale nella scrivania, giri una manopola a scatti                            | 3    |
| Studio     | Matrice     | Nove pulsanti in una finestra             | Le stesse nove lampade, sul tavolo della scena                                          | 3    |

## Tecnologia

Consiglio: **PixiJS per la scena, HTML per tutto ciò che è testo.** Testi, taccuino e dialoghi di oggi sono già buoni e accessibili, quindi restano in HTML. Sul canvas va solo ciò che si muove.

| Opzione                         | Pro                                                      | Contro                                                      | Quando sceglierla                          |
| ------------------------------- | -------------------------------------------------------- | ----------------------------------------------------------- | ------------------------------------------ |
| **PixiJS + HTML** (consigliata) | Strati, luci, particelle e animazioni fluide (WebGL)     | Una libreria da imparare; il file unico diventa più pesante | Avventura 2D curata, con molto testo       |
| SVG + HTML, come oggi           | Nessuna dipendenza, testo nitido, accessibilità semplice | Filtri lenti su mobile, poche animazioni                    | Per chiudere in fretta senza cambiare base |
| Phaser                          | Motore completo: scene, input, animazioni, audio         | Scomodo per finestre di testo ricche; più grande            | Se preferisci un motore completo           |
| Three.js, 3D in prima persona   | Esplorazione libera della villa                          | Servono modelli 3D: costi e tempi molto più alti            | Solo con un artista 3D nel progetto        |

Due cose da non cambiare, qualunque motore si scelga: il motore audio procedurale e la pubblicazione come cartella statica, senza server.

## Appendice: Fasi 0 e 1

### Test nel browser prima della Fase 0

Il gioco è stato giocato in Chromium (il motore di Chrome) pilotato da Playwright, su 6 formati di schermo.

| Scenario                                         | Schermo                 | Esito                                        |
| ------------------------------------------------ | ----------------------- | -------------------------------------------- |
| Partita completa: 6 enigmi, 3 porte, finale      | 1440×900                | Passa: 0 errori JS, 0 richieste esterne      |
| Audio con «Entra con audio»                      | 1440×900                | Passa                                        |
| Risposte sbagliate, suggerimenti, porta bloccata | 1440×900                | Passa                                        |
| Cambio scheda                                    | 1440×900                | Passa: il timer si ferma                     |
| Tempo scaduto con un documento aperto            | 1440×900                | Passa: riparte solo la stanza                |
| Ricarica della pagina e «Riprendi»               | 1440×900                | Passa                                        |
| Doppio clic sulla porta durante la dissolvenza   | 1440×900                | Passa: nessuna stanza saltata                |
| Salvataggio senza il campo `talked`              | 1440×900                | Falliva: errore al primo dialogo             |
| Smartphone in verticale                          | 390×664 (iPhone 13)     | Punti cliccabili sugli oggetti sbagliati     |
| Smartphone in orizzontale                        | 844×390                 | Pulsante «Entra» fuori schermo               |
| Monitor 16:9 e ultra-wide                        | da 1280×720 a 2560×1080 | A 1280×720 il titolo copriva gli orologi     |
| CPU rallentata ×4 e ×6                           | 1440×900                | 33 ms per fotogramma con effetti, 16,7 senza |

Un programma a forza bruta ha verificato che ogni enigma ha una sola soluzione: 9527, 314, CORVO, Occhio → Luna → Corvo → Chiave → Sole, 042.

Non coperti: Safari e iPhone reali, Firefox, ascolto in cuffia. Il Chromium usato non ha GPU, quindi i tempi dei fotogrammi sono pessimisti.

### I 12 problemi

| #   | Problema                                                                | Gravità | Stato                       |
| --- | ----------------------------------------------------------------------- | ------- | --------------------------- |
| 1   | Gli orologi disegnati non segnavano le ore citate dall'enigma           | Alta    | Fatto                       |
| 2   | Su smartphone in verticale i punti cliccabili non stavano sugli oggetti | Alta    | Fatto                       |
| 3   | Un salvataggio senza il campo `talked` bloccava il dialogo              | Media   | Fatto                       |
| 4   | In orizzontale il pulsante «Entra con audio» era fuori schermo          | Media   | Fatto                       |
| 5   | La foto della villa era incorporata due volte: l'81% del file           | Media   | Fatto: file da 355 a 218 KB |
| 6   | Nebbia e luce mobile portavano il fotogramma a 33 ms                    | Media   | Fatto: 16,7 ms              |
| 7   | Le luci della matrice nella scena cambiavano solo a enigma risolto      | Bassa   | Fatto                       |
| 8   | Il messaggio «Un ingranaggio si libera» copriva i pulsanti              | Bassa   | Fatto                       |
| 9   | «Riprendi» riattivava sempre l'audio                                    | Bassa   | Fatto                       |
| 10  | A 1280×720 il titolo della stanza copriva gli orologi                   | Bassa   | Fatto                       |
| 11  | Le soluzioni si leggono dalla console del browser                       | Bassa   | Rimandato alla Fase 4       |
| 12  | I rombi nella scena non ricevevano il clic                              | Alta    | Fatto                       |

### Fase 1

Il gioco gira identico sulla nuova base: Vite, moduli JavaScript, contenuti in JSON, macchina a stati per il flusso, salvataggi con versione. Le 28 verifiche della Fase 0 passano su entrambe le versioni, e 50 passi giocati in parallelo con la Fase 0 danno lo stesso DOM, gli stessi salvataggi e gli stessi pixel. In più ci sono 41 test del motore e un workflow di GitHub Actions. I dettagli sono nel [README](README.md).

### Numeri

- **File prima della Fase 0:** 355 KB, di cui 288 KB per la stessa foto ripetuta due volte, 48 KB di JavaScript e 15 KB di CSS. Oggi il file pesa circa 225 KB.
- **Foto della villa:** 740×465 px, sgranata a tutto schermo. Per migliorarla serve la foto originale ad alta risoluzione.
- **Atrio:** 272 nodi DOM, 2,2 MB di memoria JavaScript.
- **Ridisegno di una stanza:** 3–4 ms; 21 ms con CPU ×4; 31 ms con CPU ×6.
