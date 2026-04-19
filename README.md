# L.E.A.N. AI System Enterprise

Metodología propietaria de adopción de IA para empresas B2B medianas y grandes.
Desarrollado por **Alpha Consulting Solutions S.L.**

---

## Stack

React 18 + Vite + TypeScript + Tailwind CSS + Supabase + Vercel

## Estructura

```
src/
├── shared/design-system/   # Sistema de diseño (Sprint 0.5)
├── modules/T1-T13/         # 13 herramientas propietarias
├── services/               # Capa de acceso a datos (abstrae Supabase)
├── lib/                    # Supabase client, PDF renderer, motor IA
└── types/                  # Tipos de dominio + tipos generados desde Supabase
```

Ver `ARQUITECTURA.md` para el diseño completo del sistema.

## Desarrollo

```bash
# Instalar dependencias
npm install

# Arrancar en local (requiere .env.local con credenciales Supabase dev)
npm run dev

# Type check
npm run typecheck

# Build de producción
npm run build

# Storybook — sistema de diseño navegable
npm run storybook
```

## Entornos

| Entorno | Rama | Supabase | URL |
|---------|------|----------|-----|
| Producción | `main` | Proyecto prod | `lean-ai.consultoriaalpha.com` |
| Desarrollo | `develop` | Proyecto dev | Preview Vercel automático |

## Operativa sin CLI

Carlos (COO) revisa PRs en GitHub web y aprueba deploys en Vercel.
Claude escribe el código, ejecuta tests y prepara migraciones SQL.
Ver `ARQUITECTURA.md` sección 6 para el flujo detallado.
