import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  base: './', // Ensures relative asset paths for Netlify
  publicDir: 'assets', // Copy assets folder to dist
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    minify: true,
    assetsDir: 'assets', // Ensure assets go to assets folder
  },
  plugins: [
    VitePWA({
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,wav,mp3,jpg,jpeg}'],
      },
      registerType: 'autoUpdate',
      includeAssets: [
        'favicon.ico',
        'assets/sprites/*.png',
        'assets/sounds/*.mp3',
        'assets/sounds/*.wav'
      ],
      manifest: {
        name: 'DinoWarfare',
        short_name: 'DinoWarfare',
        description: 'Battle dinosaurs and survive the waves!',
        start_url: '/',
        display: 'standalone',
        background_color: '#000000',
        theme_color: '#00ff00',
        icons: [
          {
            src: '/sprites/logo.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any maskable'
          },
          {
            src: '/sprites/logo.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ],
        screenshots: [
          {
            src: '/sprites/logo.png',
            sizes: '1280x720',
            type: 'image/png',
            form_factor: 'wide',
            label: 'DinoWarfare Gameplay'
          }
        ]
      }
    })
  ]
});
