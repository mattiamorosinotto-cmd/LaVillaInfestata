import { copyFileSync, readFileSync, renameSync, writeFileSync } from 'node:fs';
import { defineConfig } from 'vite';
import { viteSingleFile } from 'vite-plugin-singlefile';

const pkg = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf8'));
const here = (path) => new URL(path, import.meta.url);

/** Toglie da sorgente.html l'avviso pensato per chi apre il file sorgente con un doppio clic. */
const stripSourceNotice = {
  name: 'villa:avviso-sorgente',
  transformIndexHtml: (html) => html.replace(/\s*<!-- avviso-sorgente[\s\S]*?<!-- \/avviso-sorgente -->/, ''),
};

/**
 * Il gioco compilato diventa index.html due volte: in dist/ (per i test) e nella cartella principale,
 * così il repository si pubblica su GitHub Pages così com'è e index.html si apre con un doppio clic.
 */
const publishAsIndex = {
  name: 'villa:index-html',
  apply: 'build',
  closeBundle() {
    renameSync(here('./dist/sorgente.html'), here('./dist/index.html'));
    const html = readFileSync(here('./dist/index.html'), 'utf8').replace(
      '<head>',
      '<head>\n    <!-- File generato da "npm run build": non modificarlo a mano. Il sorgente è sorgente.html con la cartella src/. -->',
    );
    writeFileSync(here('./dist/index.html'), html);
    copyFileSync(here('./dist/index.html'), here('./index.html'));
  },
};

// La build produce un unico file con CSS, JavaScript e immagine incorporati:
// si apre con un doppio clic (file://), funziona offline e si pubblica su qualunque hosting statico.
export default defineConfig({
  base: './',
  define: { __APP_VERSION__: JSON.stringify(pkg.version) },
  plugins: [stripSourceNotice, viteSingleFile({ removeViteModuleLoader: true }), publishAsIndex],
  server: { open: '/sorgente.html' },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    reportCompressedSize: false,
    rollupOptions: { input: 'sorgente.html' },
  },
});
