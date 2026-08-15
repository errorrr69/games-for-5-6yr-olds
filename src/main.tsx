import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, HashRouter } from 'react-router-dom'
import App from './App'
import './styles/index.css'

/**
 * Two ways this app runs, and they need different routers.
 *
 *   Served over http(s) — Florie's live teaching app. BrowserRouter, so the URLs
 *   stay exactly as they are: /teacher, /join/ABCD. Those get shared with
 *   families, so they must not change.
 *
 *   Loaded from file:// — the copy bundled inside Momzo, opened straight from
 *   the app's assets. There is no server and no History API to push to, so
 *   BrowserRouter cannot route at all. HashRouter works because everything after
 *   the # never leaves the document.
 *
 * Chosen by protocol rather than a build flag, so ONE build serves both.
 */
const Router = window.location.protocol === 'file:' ? HashRouter : BrowserRouter

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Router>
      <App />
    </Router>
  </React.StrictMode>,
)
