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
        includeAssets: ['favicon.svg', 'logo.svg', 'icons.svg'],
        manifest: {
          name: 'Spendt',
          short_name: 'Spendt',
          description: 'Fast, minimalist personal finance tracking.',
          theme_color: '#09090b',
          background_color: '#09090b',
          display: 'standalone',
          orientation: 'portrait',
          scope: base,
          start_url: base,
          categories: ['finance', 'productivity'],
          icons: [
            {
              src: 'logo.svg',
              sizes: 'any',
              type: 'image/svg+xml',
              purpose: 'any',
            },
            {
              src: 'logo.svg',
              sizes: 'any',
              type: 'image/svg+xml',
              purpose: 'maskable',
            },
          ],
          shortcuts: [
            {
              name: 'Quick add',
              short_name: 'Add',
              description: 'Log an expense or income',
              url: `${base}add-expense`,
              icons: [{ src: 'logo.svg', sizes: 'any', type: 'image/svg+xml' }],
            },
            {
              name: 'Transactions',
              url: `${base}transactions`,
              icons: [{ src: 'logo.svg', sizes: 'any', type: 'image/svg+xml' }],
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
          navigateFallbackDenylist: [/^\/api\//],
        },
        devOptions: {
          enabled: true,
        },
      }),
    ],
    base,
  }
})
