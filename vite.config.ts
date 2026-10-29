import react from '@vitejs/plugin-react'
import fs from 'node:fs'
import { resolve } from 'node:path'
import { defineConfig, type Plugin } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

function policyServerPlugin(): Plugin {
  return {
    name: 'policy-server-plugin',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (req.url === '/api/policy' && req.method === 'POST') {
          let body = ''
          req.on('data', (chunk) => {
            body += chunk
          })
          req.on('end', () => {
            try {
              const data = JSON.parse(body)
              const filePath = resolve(import.meta.dirname, 'public/active_policy.json')
              fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8')

              if (typeof data.maintenanceMode === 'boolean') {
                const maintPath = resolve(import.meta.dirname, 'public/maintenance.json')
                const maintObj = {
                  enabled: data.maintenanceMode,
                  maintenanceMode: data.maintenanceMode,
                  title: data.maintenanceTitle || '現在メンテナンス中です',
                  message:
                    data.maintenanceMessage ||
                    'ただいまサービスの改善およびシステムメンテナンスを行っております。ご不便をおかけしますが、完了まで今しばらくお待ちください。',
                  estimatedEnd: data.maintenanceEstimatedEnd || '',
                  updatedAt: new Date().toISOString(),
                }
                fs.writeFileSync(maintPath, JSON.stringify(maintObj, null, 2), 'utf-8')
              }

              res.statusCode = 200
              res.setHeader('Content-Type', 'application/json')
              res.end(JSON.stringify({ ok: true, data }))
            } catch (err) {
              res.statusCode = 500
              res.setHeader('Content-Type', 'application/json')
              res.end(JSON.stringify({ error: String(err) }))
            }
          })
          return
        }
        next()
      })
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  base: './',
  server: {
    host: true, // Listen on 0.0.0.0 (LAN / smartphone access)
    port: 5173,
  },
  build: {
    rollupOptions: {
      input: {
        main: resolve(import.meta.dirname, 'index.html'),
        admin: resolve(import.meta.dirname, 'admin.html'),
      },
    },
  },
  plugins: [
    react(),
    policyServerPlugin(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icon.svg', 'favicon.svg'],
      manifest: {
        name: '推しサポ',
        short_name: '推しサポ',
        theme_color: '#111216',
        background_color: '#111216',
        display: 'standalone',
        orientation: 'portrait-primary',
        icons: [
          {
            src: 'icon.svg',
            sizes: '192x192 512x512',
            type: 'image/svg+xml',
            purpose: 'any maskable'
          }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,ico}']
      }
    })
  ],
})
