import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'node:path'
import fs from 'node:fs'

/**
 * GitHub Pages serves project sites from https://<owner>.github.io/<repo>/, so
 * the base path is injected at build time by the deploy workflow. Defaults to
 * "/" for local development and root-domain hosting.
 */
const base = process.env.VITE_BASE_PATH ?? '/'

/**
 * GitHub Pages has no SPA rewrite rule, so a deep link such as
 * /transactions/TX-10291 would 404 before React Router ever loads. Shipping the
 * same document as 404.html lets Pages serve the app for any unknown path and
 * hands routing back to the client.
 */
function spaFallback(): Plugin {
  let outDir = 'dist'
  return {
    name: 'payflow:spa-404-fallback',
    apply: 'build',
    configResolved(config) {
      outDir = path.resolve(config.root, config.build.outDir)
    },
    closeBundle() {
      const index = path.join(outDir, 'index.html')
      if (fs.existsSync(index)) {
        fs.copyFileSync(index, path.join(outDir, '404.html'))
      }
    },
  }
}

export default defineConfig({
  base,
  plugins: [react(), tailwindcss(), spaFallback()],
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, './src'),
    },
  },
})
