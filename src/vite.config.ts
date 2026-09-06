import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';
import { writeFileSync, mkdirSync } from 'fs';

function wpAssetPlugin() {
  return {
    name: 'wp-asset-php',
    writeBundle() {
      const dir = resolve(__dirname, '../assets/js');
      mkdirSync(dir, { recursive: true });
      writeFileSync(
        resolve(dir, 'lipishilpo-editor.asset.php'),
        `<?php\nreturn array(\n\t'dependencies' => array(),\n\t'version' => '${Date.now()}',\n);\n`
      );
    },
  };
}

export default defineConfig({
  plugins: [react(), wpAssetPlugin()],
  // Relative URLs so WordPress can load optional chunks next to the main JS file.
  base: './',
  build: {
    outDir: '../assets',
    emptyOutDir: false,
    rollupOptions: {
      input: resolve(__dirname, 'main.tsx'),
      output: {
        entryFileNames: 'js/lipishilpo-editor.js',
        chunkFileNames: 'js/lipishilpo-editor-[name].js',
        assetFileNames: (assetInfo) => {
          if (assetInfo.name?.endsWith('.css')) {
            return 'css/lipishilpo-editor.css';
          }
          if (assetInfo.name?.match(/\.(ttf|woff|woff2)$/)) {
            return 'fonts/[name][extname]';
          }
          return 'js/[name][extname]';
        },
      },
    },
    // Cloudflare-নির্ভর কোড নেই, সরাসরি browser bundle
    target: 'es2020',
    sourcemap: false,
  },
  // Public assets (fonts) — Profder-এর public/ থেকে কপি করতে হবে
  publicDir: false,
});
