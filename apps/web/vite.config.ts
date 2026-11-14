import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      // Neue Version erst nach „Neu laden“ im Spiel, nie mitten in einer Kette
      registerType: 'prompt',
      // Registriert wird über useRegisterSW (src/pwa.ts), damit der Hinweis im Spiel-Look erscheint
      injectRegister: false,
      manifest: {
        id: '/',
        name: 'Lichtung',
        short_name: 'Lichtung',
        description: 'Ketten-Puzzle mit Siedlungsaufbau',
        lang: 'de',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        orientation: 'portrait',
        // Tag-Farben aus docs/design.md: Wiese oben und unten
        background_color: '#EAF2DC',
        theme_color: '#CFE0AE',
        icons: [
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        // Alles Gebaute vorab laden, damit das Spiel ohne Netz startet; Schriften nur für Deutsch (latin, latin-ext)
        globPatterns: ['**/*.{js,css,html,svg,png,webmanifest}', '**/*-latin-*.woff2'],
        navigateFallback: '/index.html',
        // Die Schnittstelle geht nie in den Cache und nie auf die Startseite
        navigateFallbackDenylist: [/^\/api\//],
        runtimeCaching: [],
        cleanupOutdatedCaches: true,
      },
      devOptions: { enabled: false },
    }),
  ],
  server: {
    port: 5173,
    strictPort: true,
    proxy: { '/api': 'http://127.0.0.1:8080' },
  },
});
