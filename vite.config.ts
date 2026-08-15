import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

// base: './' emits RELATIVE asset paths.
//
// The default '/' produces <script src="/assets/index-*.js">, which is correct
// when a server has a document root and wrong when the page is opened directly
// from disk — inside Momzo's WebView that resolves to the filesystem root and
// the app renders a blank screen. Relative paths work in both places, so one
// build serves the hosted teaching app and the bundled copy alike.
export default defineConfig({
  base: './',
  plugins: [react()],
  test: { environment: 'jsdom', globals: true },
})
