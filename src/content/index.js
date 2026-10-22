// Contenuti in italiano. Per modificare testi, stanze ed enigmi lavora sui file in ./it/.
import { buildContent } from './build.js';
import rooms from './it/rooms.json';
import documents from './it/documents.json';
import dialogues from './it/dialogues.json';
import puzzles from './it/puzzles.json';
import ui from './it/ui.json';

export default buildContent({ rooms, documents, dialogues, puzzles, ui });
