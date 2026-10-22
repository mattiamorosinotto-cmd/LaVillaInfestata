// Lettura dei contenuti dai file JSON, per i test in Node (senza Vite).
import { readFileSync } from 'node:fs';
import { buildContent } from '../../src/content/build.js';

export const readJson = (name) => JSON.parse(readFileSync(new URL(`../../src/content/it/${name}.json`, import.meta.url), 'utf8'));
export const contentFiles = () => Object.fromEntries(['rooms', 'documents', 'dialogues', 'puzzles', 'ui'].map((n) => [n, readJson(n)]));
export const loadContent = () => buildContent(contentFiles());
