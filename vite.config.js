import { readFileSync } from 'node:fs';
import { defineConfig } from 'vite';
import { viteSingleFile } from 'vite-plugin-singlefile';

const pkg = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf8'));

/** Toglie da index.html l'avviso pensato per chi apre il file sorgente con un doppio clic. */
const stripSourceNotice = {
  name: 'villa:avviso-sorgente',
  transformIndexHtml: (html) => html.replace(/\s*<!-- avviso-sorgente[\s\S]*?<!-- \/avviso-sorgente -->/, ''),
};

// La build produce un unico dist/index.html con CSS, JavaScript e immagine incorporati:
// si apre con un doppio clic (file://), funziona offline e si pubblica su qualunque hosting statico.
export default defineConfig({
  base: './',
  define: { __APP_VERSION__: JSON.stringify(pkg.version) },
  plugins: [stripSourceNotice, viteSingleFile({ removeViteModuleLoader: true })],
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    reportCompressedSize: false,
  },
});
