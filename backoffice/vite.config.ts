import { execSync } from 'node:child_process'
import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'

/**
 * `vite build --mode demo` genera la demo pública para GitHub Pages: vive bajo
 * `/KM.WEB.TALLER.AUTO/demo/` y usa rutas con hash, porque Pages no sabe servir el
 * `index.html` de una SPA en subrutas.
 */
/**
 * El commit con el que se construyó. Se enseña en el panel de error: sin esto
 * no hay forma de saber si quien reporta un fallo está viendo la versión que
 * ya lo arregla o una anterior que el navegador guardó.
 */
function version() {
  try {
    return execSync('git rev-parse --short HEAD').toString().trim()
  } catch {
    return 'local'
  }
}

export default defineConfig(({ mode }) => ({
  define: { __VERSION__: JSON.stringify(version()) },
  base: mode === 'demo' ? '/KM.WEB.TALLER.AUTO/demo/' : '/',
  plugins: [vue(), tailwindcss()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  build: {
    outDir: mode === 'demo' ? 'dist-demo' : 'dist',
  },
  server: {
    port: 5173,
  },
}))
