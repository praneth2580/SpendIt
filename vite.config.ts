import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

const repoName = 'SpendIt'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const base = mode === 'ghpages' ? `/${repoName}/` : './'
  return {
    plugins: [
      react(),
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: [
          'new_logo.png',
          'favicon-32.png',
          'icon-192.png',
          'icon-512.png',
          'icons.svg',
        ],
        manifest: {
          name: 'SpendIt',
          short_name: 'SpendIt',
          description: 'Fast, minimalist personal finance tracking.',
          theme_color: '#0b1616',
          background_color: '#0b1616',
          display: 'standalone',
          orientation: 'portrait',
          scope: base,
          start_url: base,
          categories: ['finance', 'productivity'],
          icons: [
            {
              src: 'icon-192.png',
              sizes: '192x192',
              type: 'image/png',
              purpose: 'any',
            },
            {
              src: 'icon-512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'any',
            },
            {
              src: 'icon-512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'maskable',
            },
          ],
          shortcuts: [
            {
              name: 'Quick add',
              short_name: 'Add',
              description: 'Log an expense or income',
              url: `${base}add-expense`,
              icons: [{ src: 'icon-192.png', sizes: '192x192', type: 'image/png' }],
            },
            {
              name: 'Transactions',
              url: `${base}transactions`,
              icons: [{ src: 'icon-192.png', sizes: '192x192', type: 'image/png' }],
            },
          ],
          share_target: {
            action: `${base}add-expense`,
            method: 'GET',
            enctype: 'application/x-www-form-urlencoded',
            params: {
              title: 'note',
              text: 'merchant',
            },
          },
        },
        workbox: {
          globPatterns: ['**/*.{js,css,html,ico,svg,png,woff2}'],
          navigateFallback: 'index.html',
          navigateFallbackDenylist: [
            /^\/api\//,
            /^\/@/,
            /^\/src\//,
            /^\/node_modules\//,
          ],
        },
        devOptions: {
          enabled: false,
          suppressWarnings: true,
        },
      }),
    ],
    base,
  }
})
