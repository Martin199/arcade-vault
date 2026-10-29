# SPEC 01 — MVP visual: las cinco pantallas de Arcade Vault

> **Estado:** Implementado
> **Depende de:** —
> **Fecha:** 2026-10-28
> **Objetivo:** Replicar fielmente en Next.js (App Router) las cinco pantallas de `references/templates/` con datos mock, sin implementar ningún juego real.

---

## Por qué existe esta spec

El repo es todavía el scaffold de `create-next-app` con el tema ya portado a `app/globals.css`.
La plantilla de `references/templates/` es el diseño aprobado y funciona como una SPA con router por hash, React por CDN y Babel en el navegador.
Esta spec traduce esa plantilla a la arquitectura de Next 16 (rutas reales, Server y Client Components, TypeScript estricto) para tener un MVP navegable sobre el que construir juegos, backend y auth en specs posteriores.

---

## Alcance

**Entra:**

- Pantalla **Biblioteca** en `/`: hero, buscador por nombre, chips de categoría, grilla de tarjetas con efecto tilt y estado "NO HAY RESULTADOS".
- Pantalla **Detalle** en `/juegos/[id]`: portada, tags, descripción, stat-strip, botones "JUGAR AHORA" / "VOLVER AL VAULT" y leaderboard lateral de 10 filas.
- Pantalla **Reproductor** en `/juegos/[id]/jugar`: HUD, pantalla CRT con arena decorativa animada, puntuación simulada que sube sola, PAUSA/REANUDAR, FIN, SALIR y modal "FIN DEL JUEGO" con guardado de puntuación.
- Pantalla **Auth** en `/login`: pestañas INICIAR SESIÓN / CREAR CUENTA, campo de correo solo en registro, "JUGAR COMO INVITADO" y botones sociales decorativos.
- Pantalla **Salón de la Fama** en `/salon`: pestañas por juego, podio top 3, tabla de 12 filas y fila "TU MEJOR MARCA" si hay sesión.
- **Navegación** global: logo, links con estado activo, contador decorativo "CRÉDITOS · 03", botón de sesión y panel móvil (hamburguesa + backdrop).
- **Footer** global decorativo: `© 2026 ARCADE VAULT · HECHO CON PIXELES Y NEÓN · v2.6.0`.
- Página 404 temática en `app/not-found.tsx` para ids de juego inexistentes y rutas desconocidas.
- Datos mock tipados en `lib/` y sesión/puntuaciones mock en `localStorage`.

**Fuera de alcance (para specs futuras):**

- Cualquier juego jugable (Bloque Buster, Caída, Serpentina, etc.).
- Autenticación real, backend, base de datos o API.
- OAuth real con Google o GitHub.
- Leaderboards reales: el Salón y el Detalle muestran puntuaciones generadas, no las guardadas.
- Menú desplegable de usuario (cuenta, perfil, ajustes).
- Sistema de créditos funcional.
- Deep-link a la pestaña de juego del Salón (`/salon?juego=…`).
- Tests automatizados (no hay framework configurado).

---

## Modelo de datos

### Juegos — `lib/games.ts`

```ts
export type Category = "ARCADE" | "PUZZLE" | "SHOOTER" | "VERSUS";
export type CategoryFilter = "TODOS" | Category;
export type GameColor = "cyan" | "magenta" | "yellow" | "green";

export interface Game {
  id: string;        // slug usado en la URL: "bloque-buster"
  title: string;     // "BLOQUE BUSTER"
  short: string;     // descripción de tarjeta
  long: string;      // descripción de detalle
  cat: Category;
  cover: string;     // clase CSS de portada: "cover-bricks"
  color: GameColor;  // color del botón JUGAR en la tarjeta
  best: number;      // mejor puntuación global mostrada
  plays: string;     // "12.4K" (texto ya formateado)
}

export const GAMES: Game[];                 // los 8 juegos de data.jsx, mismos valores
export const CATEGORIES: CategoryFilter[];  // ["TODOS", "ARCADE", "PUZZLE", "SHOOTER", "VERSUS"]
export function getGame(id: string): Game | undefined;
```

### Puntuaciones generadas — `lib/scores.ts`

```ts
export interface ScoreRow {
  rank: number;   // 1..n tras ordenar
  name: string;   // de PLAYERS
  score: number;  // >= 1000
  date: string;   // "DD/MM/2026"
}

export const PLAYERS: string[];  // los 18 nombres de data.jsx
export function seededScores(seed: number, count?: number): ScoreRow[];  // mismo algoritmo LCG que data.jsx
export function formatScore(n: number): string;  // n.toLocaleString("es-ES")
```

Semillas (idénticas a la plantilla, para que se vea igual):

- Detalle: `seededScores(id.length * 17 + 3, 10)`.
- Salón: `seededScores(id.length * 23 + 7, 12)`.

`seededScores` es determinista: el resultado es el mismo en servidor y cliente, sin riesgo de hydration mismatch.

### Sesión y puntuaciones mock — `lib/session.ts` (solo cliente)

```ts
export interface User { name: string }  // MAYÚSCULAS, máx. 10 caracteres

export interface SavedScore {
  game: string;   // Game.id
  score: number;
  name: string;
  at: number;     // Date.now()
}
```

Claves de `localStorage` (las mismas de la plantilla):

- `av_user` → `User | null` serializado en JSON.
- `av_scores` → `SavedScore[]` serializado en JSON. Solo se escribe; ninguna pantalla lo lee en esta spec.

API expuesta:

- `useSession(): { user: User | null; signIn(user: User | null): void; signOut(): void }`, implementado con `useSyncExternalStore` sobre `localStorage`, con `getServerSnapshot` que devuelve `null`.
- `saveScore(entry: Omit<SavedScore, "at">): void`.
- Toda lectura/escritura va en `try/catch`. Si `localStorage` falla, la app sigue funcionando como invitado.

---

## Rutas y archivos

| Ruta                  | Archivo                            | Tipo                                                  |
| --------------------- | ---------------------------------- | ----------------------------------------------------- |
| `/`                   | `app/page.tsx`                     | Server Component que monta `<Library />`              |
| `/juegos/[id]`        | `app/juegos/[id]/page.tsx`         | Server Component, `generateStaticParams` con 8 ids    |
| `/juegos/[id]/jugar`  | `app/juegos/[id]/jugar/page.tsx`   | Server Component que monta `<GamePlayer />`           |
| `/login`              | `app/login/page.tsx`               | Server Component que monta `<AuthForm />`             |
| `/salon`              | `app/salon/page.tsx`               | Server Component que monta `<HallOfFame />`           |
| 404                   | `app/not-found.tsx`                | Server Component                                      |

Componentes en `components/`:

- `nav.tsx` — Client (usa `usePathname` y `useSession`).
- `footer.tsx` — Server.
- `game-card.tsx` — Client (tilt con `onMouseMove`).
- `library.tsx` — Client (estado de búsqueda y categoría).
- `leaderboard.tsx` — Server (recibe `ScoreRow[]`).
- `game-player.tsx` — Client (contador, pausa, modal, `saveScore`).
- `auth-form.tsx` — Client (pestañas, formulario, `signIn`).
- `hall-of-fame.tsx` — Client (pestaña activa, fila del usuario).

Archivos que cambian: `app/layout.tsx` (monta `<Nav />`, `<main className="av-main">` y `<Footer />`), `app/page.tsx` (reemplaza el hero actual). `app/globals.css` ya contiene todas las clases de `styles.css` y solo se toca si falta algún estilo de la 404.

Los ids de `[id]` en las páginas se leen con `PageProps<"/juegos/[id]">` (`params` es una `Promise`). Si `getGame(id)` devuelve `undefined`, se llama a `notFound()`.

Estado activo del nav: "Biblioteca" está activo en `/` y en cualquier `/juegos/*`; "Salón de la Fama" en `/salon`; "Iniciar Sesión"/"Cuenta" del panel móvil en `/login`.

---

## Plan de implementación

1. **Datos.** Crear `lib/games.ts` y `lib/scores.ts` con los tipos y valores de la sección anterior. Verificación: `npx tsc --noEmit` pasa.
2. **Sesión mock.** Crear `lib/session.ts` con `useSession` y `saveScore`. Verificación: `npx tsc --noEmit` pasa.
3. **Layout global.** Crear `components/nav.tsx` y `components/footer.tsx`, y montarlos en `app/layout.tsx` alrededor de `<main className="av-main">`. Links con `next/link`. Verificación: `npm run dev`, el nav y el footer se ven en `/` y el panel móvil abre y cierra a < 900px.
4. **Biblioteca.** Crear `components/game-card.tsx` y `components/library.tsx`. Reemplazar `app/page.tsx`. Las tarjetas enlazan a `/juegos/[id]`. Verificación: buscar "rana" deja solo RANARIA; chip PUZZLE deja solo CAÍDA; buscar "zzz" muestra "NO HAY RESULTADOS".
5. **404 temática.** Crear `app/not-found.tsx` con el estilo arcade y botón "VOLVER AL VAULT" a `/`. Verificación: `/no-existe` muestra la 404 temática.
6. **Detalle.** Crear `components/leaderboard.tsx` y `app/juegos/[id]/page.tsx` con `generateStaticParams` y `notFound()`. Verificación: `/juegos/caida` muestra CAÍDA con 10 filas; `/juegos/xyz` muestra la 404.
7. **Reproductor.** Crear `components/game-player.tsx` y `app/juegos/[id]/jugar/page.tsx`. Replicar contador (+10..99 cada 220 ms), subida de nivel, pausa, modal de fin, guardado y "JUGAR DE NUEVO". SALIR vuelve a `/juegos/[id]`. Verificación: manual según criterios de aceptación.
8. **Auth.** Crear `components/auth-form.tsx` y `app/login/page.tsx`. Enviar el formulario hace `signIn({ name })` con el usuario en mayúsculas (o `PLAYER1` si está vacío) y navega a `/`. "JUGAR COMO INVITADO" hace `signIn(null)` y navega a `/`. Verificación: tras entrar como `px_kai`, el nav muestra `PX_KAI ▾`.
9. **Salón de la Fama.** Crear `components/hall-of-fame.tsx` y `app/salon/page.tsx`, con la fila "TU MEJOR MARCA" calculada igual que la plantilla. Verificación: cambiar de pestaña cambia podio y tabla; con sesión aparece la fila amarilla.
10. **Limpieza.** Borrar los SVG de ejemplo de `public/` que no se usen. Ejecutar `npm run lint`, `npx tsc --noEmit` y `npm run build` y corregir lo que falle.

---

## Criterios de aceptación

- [ ] `npm run lint` termina sin errores.
- [ ] `npx tsc --noEmit` termina sin errores.
- [ ] `npm run build` termina sin errores y prerenderiza `/juegos/[id]` para los 8 juegos.
- [ ] Ninguna ruta muestra errores ni warnings de hidratación en la consola del navegador.
- [ ] `/` muestra el hero "ARCADE VAULT" y 8 tarjetas de juego.
- [ ] Escribir "rana" en el buscador deja visible solo la tarjeta RANARIA.
- [ ] Pulsar el chip SHOOTER deja visibles solo INVASORES y ROCAS.
- [ ] Una búsqueda sin coincidencias muestra "NO HAY RESULTADOS".
- [ ] Pulsar una tarjeta o su botón JUGAR navega a `/juegos/<id>` de ese juego.
- [ ] `/juegos/caida` muestra título, descripción larga, stat-strip y 10 filas de leaderboard.
- [ ] `/juegos/inexistente` y `/juegos/inexistente/jugar` muestran la 404 temática.
- [ ] "JUGAR AHORA" navega a `/juegos/<id>/jugar`.
- [ ] En el reproductor la puntuación aumenta sola mientras no está en pausa ni terminado.
- [ ] PAUSA congela la puntuación y muestra "EN PAUSA"; REANUDAR la reanuda.
- [ ] FIN abre el modal "FIN DEL JUEGO" con la puntuación final.
- [ ] "GUARDAR PUNTUACIÓN" añade una entrada a `localStorage.av_scores` y muestra "▸ PUNTUACIÓN GUARDADA_".
- [ ] "JUGAR DE NUEVO" reinicia puntuación a 0, vidas a 3 y nivel a 01.
- [ ] SALIR navega a `/juegos/<id>`.
- [ ] En `/login`, la pestaña CREAR CUENTA muestra el campo "Correo electrónico" y INICIAR SESIÓN lo oculta.
- [ ] Entrar con usuario `px_kai` guarda `{"name":"PX_KAI"}` en `localStorage.av_user`, navega a `/` y el nav muestra `PX_KAI ▾`.
- [ ] Pulsar `PX_KAI ▾` borra `av_user` y el nav vuelve a mostrar "Iniciar Sesión".
- [ ] Recargar la página con sesión iniciada mantiene el nombre en el nav.
- [ ] `/salon` muestra podio de 3 y tabla de 12 filas; cambiar de pestaña cambia los nombres.
- [ ] Con sesión iniciada, `/salon` muestra la fila "▸ TU MEJOR MARCA EN <JUEGO>"; sin sesión no aparece.
- [ ] El link "Biblioteca" del nav está activo en `/`, `/juegos/<id>` y `/juegos/<id>/jugar`; "Salón de la Fama" lo está en `/salon`.
- [ ] A menos de 900px de ancho se ve la hamburguesa, el panel móvil abre al pulsarla y cierra al pulsar el backdrop o un link.
- [ ] Comparadas lado a lado con `references/templates/Arcade Vault.html`, las cinco pantallas usan el mismo markup y las mismas clases CSS.

---

## Decisiones

- **Sí:** rutas reales del App Router (`/`, `/juegos/[id]`, `/juegos/[id]/jugar`, `/login`, `/salon`). URLs compartibles, SSR y lo idiomático en Next.
- **No:** router por hash de la plantilla. Desaprovecha Next y rompe el botón atrás nativo con JSON en la URL.
- **Sí:** réplica fiel reutilizando las clases de `app/globals.css`. La plantilla es el diseño aprobado; reinterpretar abriría debate de diseño fuera de esta spec.
- **No:** reconstruir los estilos con utilidades de Tailwind. Mismo resultado visual con más trabajo y riesgo de divergencia.
- **Sí:** el reproductor simula una partida (contador, pausa, fin, modal). Permite ver todos los estados visuales sin escribir ningún juego.
- **No:** reproductor estático. Dejaría sin validar los estados de pausa y fin.
- **Sí:** sesión y puntuaciones mock en `localStorage` con las claves `av_user` y `av_scores` de la plantilla. Permite ver el estado logueado sin backend.
- **No:** formularios puramente visuales. No se podría revisar el nav ni el Salón con sesión.
- **Sí:** `useSyncExternalStore` para leer `localStorage`. Evita hydration mismatch: el servidor siempre renderiza como invitado.
- **Sí:** datos en `lib/games.ts` y `lib/scores.ts` tipados. Cuando llegue un backend solo cambia `lib/`.
- **No:** un único `lib/data.ts`. Mezcla catálogo y generación de puntuaciones.
- **Sí:** 404 temática con `notFound()` y `generateStaticParams`. Los 8 juegos se prerenderizan y un id inválido no rompe la UI.
- **Sí:** pulsar el nombre de usuario cierra sesión, igual que la plantilla. Un menú desplegable es otra spec.
- **Sí:** botones GOOGLE/GITHUB, contador "CRÉDITOS · 03" y footer se incluyen como decorativos sin funcionalidad.
- **Sí:** la pestaña activa del Salón vive en estado del cliente, como en la plantilla. El deep-link por query param queda fuera.
- **Sí:** semillas de `seededScores` idénticas a la plantilla, para que la comparación visual sea uno a uno.

---

## Riesgos

| Riesgo | Mitigación |
| ------ | ---------- |
| `cacheComponents: true` exige que el acceso a datos dinámicos esté en `<Suspense>` o cacheado; `params` y `usePathname` pueden disparar errores de build. | `generateStaticParams` en `/juegos/[id]` y `/juegos/[id]/jugar`. Consultar `node_modules/next/dist/docs/` antes de escribir cada página. Si el build lo exige, envolver el componente afectado en `<Suspense>`. |
| Hydration mismatch al leer `localStorage` en el primer render. | `useSyncExternalStore` con `getServerSnapshot` que devuelve `null`. Nada lee `localStorage` fuera de efectos o del store. |
| `Math.random()` del contador del reproductor genera valores distintos en servidor y cliente. | El contador arranca en 0 y solo usa `Math.random()` dentro de `setInterval` en un efecto cliente. |
| `localStorage` deshabilitado (modo privado o bloqueado). | `try/catch` en cada acceso. La app sigue funcionando como invitado y el guardado falla en silencio. |
| `toLocaleString("es-ES")` formatea distinto en el runtime de Node y en el navegador. | Centralizar en `formatScore`. Si aparece mismatch, sustituirlo por un formateo manual con separador `.`. |

---

## Lo que **no** entra en esta spec

- Ningún juego jugable.
- Autenticación, backend, base de datos o API reales.
- OAuth con Google o GitHub.
- Leaderboards que lean las puntuaciones guardadas.
- Menú desplegable de usuario.
- Sistema de créditos.
- Deep-link de pestañas del Salón.
- Tests automatizados.

Cada uno, si llega, va en su propia spec.
