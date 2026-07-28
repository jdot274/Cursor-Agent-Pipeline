import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = fileURLToPath(new URL('.', import.meta.url))
const bufferUtilsShim = resolve(root, 'src/shims/BufferGeometryUtils.js')

/** Patch @splinetool/loader against modern three.js without downgrading drei/r3f. */
function splineThreeCompat() {
  return {
    name: 'spline-three-compat',
    enforce: 'pre',
    resolveId(source, importer) {
      if (
        importer &&
        importer.includes('@splinetool/loader') &&
        source.includes('BufferGeometryUtils')
      ) {
        return bufferUtilsShim
      }
      return null
    },
    transform(code, id) {
      // Restore pre-r152 / pre-r163 symbols removed from three core.
      // Match both build/three.module.js and package entry paths Vite may resolve.
      const isThreeCore =
        /[\\/]three[\\/]build[\\/]three\.module\.js$/.test(id) ||
        /[\\/]three[\\/]build[\\/]three\.core\.js$/.test(id) ||
        /[\\/]three[\\/]src[\\/]Three\.js$/.test(id)
      if (isThreeCore && !code.includes('export const LinearEncoding')) {
        return {
          code: `${code}
export const LinearEncoding = 3000;
export const sRGBEncoding = 3001;
export { WebGLRenderTarget as WebGLMultipleRenderTargets };
`,
          map: null,
        }
      }
      return null
    },
  }
}

// base './' so the built app works when hosted under /creator/ inside the game deployment
export default defineConfig({
  base: './',
  plugins: [splineThreeCompat(), react()],
  build: {
    rollupOptions: {
      input: {
        main: resolve(root, 'index.html'),
        transparent: resolve(root, 'transparent.html'),
      },
    },
  },
})
