// ============================================================
// LEAN AI System — Entry point
// ============================================================
// Orden de imports importa:
// 1. Polyfills / CSS base primero
// 2. Inter font (self-hosted, sin Google Fonts)
// 3. Tailwind
// 4. React
// ============================================================

// Inter — self-hosted vía @fontsource/inter (D9 / ARQUITECTURA.md sección 7.3)
//
// Subsets acotados a latin + latin-ext:
//   latin     → caracteres base (inglés, español sin acentos)
//   latin-ext → ñ, é, ü, à y demás caracteres usados en español/europeo
//
// Carga solo los 6 archivos necesarios en lugar de los ~18 del import genérico.
// Reducción estimada: ~60% menos de font assets en el bundle.
//
// Pesos (D9 sección 7.3):
//   400 Regular  → body, caption, label de formulario
//   500 Medium   → H2, H3, labels UI, numerales tabulares
//   600 SemiBold → H1, display, CTAs
import '@fontsource/inter/latin-400.css'
import '@fontsource/inter/latin-500.css'
import '@fontsource/inter/latin-600.css'
import '@fontsource/inter/latin-ext-400.css'
import '@fontsource/inter/latin-ext-500.css'
import '@fontsource/inter/latin-ext-600.css'

// Tailwind CSS
import './index.css'

import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.tsx'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
)
