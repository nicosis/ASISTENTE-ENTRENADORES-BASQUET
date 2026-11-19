Feature: tabla plana de sesiones por temporada, persistida en Google Sheets y leída por la app.
Objetivo: ver en una sola fila qué sesión N de la temporada es (semana, día, sesión y primer ejercicio) sin recalcular la regla de conteo.
Rama: feat/plan-anual-cadete-limpio. Estrategia de entrega: ask-on-risk. Runner de tests: node --test tests/*.test.mjs.

## Specs
- S1: Al crear una temporada se genera una fila por sesión de la temporada, con número de sesión, semana, día, id de sesión de mesociclo y id del primer ejercicio del bloque 1.
- S2: La fuente de verdad es Google Sheets. La tabla `season_sessions` se guarda en Sheets y la app la lee desde ahí; la app no mantiene una copia independiente.
- S3: La numeración sigue la misma regla que hoy: solo cuentan las semanas de fase `training`, se saltan las semanas de receso y cada semana aporta `frequency` sesiones.
- S4: Las temporadas existentes sin filas en `season_sessions` reciben sus filas una vez, se sincronizan a Sheets y no se recalculan después.
- S5: Al eliminar una temporada se eliminan también sus filas de `season_sessions`.
- S6: En la app se muestra una lista de solo lectura con las sesiones de la temporada activa: sesión N, semana, día, sesión y primer ejercicio.
- S7: No se agregan campos a tablas existentes; el cambio es aditivo.

## Tasks
- T1 (S1, S3): función pura `buildSeasonSessions` en `app/shared/seasonSessions.ts` con tests. Ruta: inline. Estado: hecho (RED→GREEN, 5 tests).
- T2 (S2, S7): escritura y lectura de `season_sessions` en `server/utils/googleSheets.ts`. Ruta: inline. Estado: hecho (cuenta de tablas del snapshot 15→16 en tests/annual-catalog.test.mjs).
- T3 (S1, S4, S5): estado en `useCoachWorkspace`: generar al crear, backfill al cargar, eliminar con la temporada y enviar en la sincronización. Ruta: inline. Estado: hecho (build de Nuxt OK).
- T4 (S6): pestaña "Sesiones de la temporada" de solo lectura en la vista de equipo. Ruta: inline. Estado: hecho.
- T5: verificación. Estado: parcial: tests 39/39 y build de Nuxt OK. Falta probar contra la hoja real (ver L7).

## Log
- L1 (2026-11-19, mensaje original del usuario): "vamos con la 1 entonces, y ambas, recuerda que la unica fuente de verdad es sheets"
  - Contexto: la "1" es la tabla plana por temporada; "ambas" es Sheets y la app; Sheets es la única fuente de verdad.
- L2: Decisión de implementación: el backfill (S4) escribe las filas faltantes una vez y luego las sincroniza; la app no las recalcula en cada carga.
- L3: Cambios previos sin commit en la rama (del bug de semana actual, `seasonWeek`, `devAutoSignIn`) quedan fuera de esta feature.
- L4: Verificación: `node --test tests/*.test.mjs` 39/39; `npx nuxi build` compila sin errores. No hay typecheck de vue-tsc en el proyecto.
- L5: Riesgo: aditivo (tabla nueva, sin cambios en tablas existentes). Risk: none.
- L6: Sin commit. Los cambios quedan en el árbol de trabajo, incluidos los de L3, para decidir la división en unidades de commit.
- L7: Pendiente: probar contra la hoja real. El backfill escribe las filas de temporadas existentes al cargar en dev; conviene confirmar antes de usarlo con datos reales.
