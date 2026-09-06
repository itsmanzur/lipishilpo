import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: '../assets',
    emptyOutDir: false,
    rollupOptions: {
      input: resolve(__dirname, 'main.tsx'),
      output: {
        // WordPress-বান্ধব একক bundle
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
