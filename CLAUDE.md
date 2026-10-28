# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Proyecto

Arcade Vault: plataforma para jugar online y competir por la mayor cantidad de puntos. Actualmente es el scaffold de `create-next-app` (solo `app/layout.tsx` y `app/page.tsx` de ejemplo); la funcionalidad aún no está implementada.

## Flujo de trabajo: Spec Driven Design

El desarrollo sigue Spec Driven Design con las skills `/spec` (escribir la especificación) y `/spec-impl` (implementarla), de https://github.com/Klerith/fernando-skills. Instalación:

```bash
npx skills@latest add Klerith/fernando-skills
```

Antes de implementar una funcionalidad nueva, debe existir (o crearse) su spec.

## Comandos

```bash
npm run dev     # servidor de desarrollo (Turbopack) en http://localhost:3000
npm run build   # build de producción
npm run start   # servir el build
npm run lint    # ESLint 9 (flat config: core-web-vitals + typescript de eslint-config-next)
npx tsc --noEmit  # chequeo de tipos
```

No hay framework de tests configurado todavía.

## Stack y configuración relevante

- **Next.js 16.4 (App Router) + React 19.3 + TypeScript estricto.** Las APIs difieren de versiones anteriores: consultar `node_modules/next/dist/docs/` (`01-app/`, `03-architecture/`, etc.) antes de escribir código.
- `next.config.ts` activa `cacheComponents: true` (Cache Components / PPR: el acceso a datos dinámicos debe ir dentro de `<Suspense>` o marcarse con `"use cache"`), `partialPrefetching: true` y `experimental.agentFeedback`.
- **Tailwind CSS v4** cargado vía el loader `@tailwindcss/turbopack` declarado en `turbopack.rules` (no hay `postcss.config` ni `tailwind.config`). Los tokens de tema se definen en `app/globals.css` con `@theme inline`.
- Los layouts/pages usan los tipos globales generados `LayoutProps<"/">` / `PageProps<"/ruta">` (de `.next/types`), no tipos de props escritos a mano.
- Alias de imports: `@/*` → raíz del repo.
