import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: { port: 5173, strictPort: true },
  build: {
    rollupOptions: {
      // Spiel und Prototyp der 3D-Welt als zwei Seiten
      input: {
        spiel: fileURLToPath(new URL('./index.html', import.meta.url)),
        welt: fileURLToPath(new URL('./welt.html', import.meta.url)),
      },
    },
  },
});
