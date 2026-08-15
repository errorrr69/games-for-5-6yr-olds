import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

// This app has to run two ways: served over http (Florie's live teaching app)
// and opened straight off disk from Momzo's app bundle, with no server at all.
// Two build settings make the second one possible, and BOTH fail silently —
// the page loads and simply renders nothing.
//
//   base: './'          Relative asset paths. The default '/' is right when a
//                       server has a document root and wrong from file://,
//                       where /assets/... resolves to the filesystem root.
//
//   format: 'iife'      A classic script instead of an ES module. Module scripts
//                       are subject to CORS, and a file:// page has an opaque
//                       origin, so Chromium refuses to execute them — including
//                       inside Android's WebView. Nothing errors; the script
//                       just never runs. An IIFE has no such restriction.
//                       inlineDynamicImports keeps it to the single chunk that
//                       an IIFE build requires.
/**
 * Vite stamps `type="module" crossorigin` on the entry script whatever the
 * rollup output format is, so an IIFE bundle still gets announced as a module —
 * and is still blocked from file://. This rewrites the tag to a classic
 * deferred script, which is what the IIFE actually is.
 *
 * `defer` keeps module-like timing: execute after parsing, before DOMContentLoaded.
 */
const classicEntryScript = {
  name: 'momzo:classic-entry-script',
  transformIndexHtml(html: string) {
    return html
      .replace(/<script\s+type="module"\s+crossorigin\s+/g, '<script defer ')
      .replace(/<script\s+type="module"\s+/g, '<script defer ')
      .replace(/<link\s+rel="stylesheet"\s+crossorigin\s+/g, '<link rel="stylesheet" ')
  },
}

export default defineConfig({
  base: './',
  plugins: [react(), classicEntryScript],
  build: {
    rollupOptions: {
      output: {
        format: 'iife',
        inlineDynamicImports: true,
      },
    },
  },
  test: { environment: 'jsdom', globals: true },
})
