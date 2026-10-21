import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  base: '/swordxstaff/',
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'prompt',
      pwaAssets: {
        image: 'src/assets/img/favicon.png',
        includeHtmlHeadLinks: false,
        integration: {
          publicDir: `${import.meta.dirname}/src/assets/img`,
        },
      },
      manifest: {
        id: '/swordxstaff/',
        name: 'Sword X Staff',
        short_name: 'Sword X Staff',
        description: 'Database and utilities for Sword X Staff players.',
        start_url: '/swordxstaff/',
        scope: '/swordxstaff/',
        display: 'standalone',
        theme_color: '#047857',
        background_color: '#f4f4f5',
        lang: 'en',
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,png,webp,ico}'],
        navigateFallback: 'index.html',
      },
    }),
  ],
})