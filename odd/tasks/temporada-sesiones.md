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
- L8 (2026-11-22): vacaciones fijadas por temporada. Fuente única: `seasons.holiday_weeks`, calculada con fechas reales (`suggestedHolidayWeeks` en `app/shared/cadeteCalendar.ts`). El formulario muestra la lista en solo lectura; se quitó el selector por equipo.
  - La navidad cubre solo 22-31 de diciembre (antes incluía la semana del 4 de enero, que no coincide con lo confirmado). Test ajustado.
  - `isHolidayWeek` / `isTrainingWeek` en el composable: para cadete mandan las vacaciones de la temporada, no las fases del catálogo.
  - Pendiente: las filas de receso del catálogo (CAD27-MES06, CAD27-MES10) siguen en Sheets y en catalog.json; ya no son autoritativas en la app pero hay que decidir si se quitan (requiere reimportar el catálogo).
  - Pendiente: el contador de sesiones de `useTrainingPlan` todavía trata esas fases como holiday en la semana del catálogo.
  - Verificación: node --test tests/*.test.mjs 41/41; nuxi build OK. Sin escrituras en la hoja real.
- L9 (2026-11-22): recesos fuera del catálogo. Se quitan CAD27-MES06 y CAD27-MES10 de `buildCatalog.mjs`; "Potencia y velocidad" pasa a 15-20 y "Pico de rendimiento" a 29-33. Catálogo regenerado: 11 fases, cobertura 1-42 sin huecos. `cadeteAnnualPlan.ts` sin tipos de receso fijo.
  - Tests: 41/41. `nuxi build` OK.
  - Pendiente: reimportar el catálogo a Sheets (`node odd/plan-data/importCatalog.mjs --replace-catalog`). El permiso para ejecutarlo fue denegado; hasta entonces la hoja conserva las filas viejas, y la app sigue correcta porque para cadete manda la temporada.
- L10 (2026-11-22): se quita el selector de nivel competitivo de la creación de temporada. El campo sigue en el modelo y en Sheets, con valor fijo `liga`. Efecto: ya no se puede crear una temporada de `formacion` desde la app.
  - Tests 41/41; `nuxi build` OK.
- L11 (2026-11-22): catálogo reimportado a Sheets (11 fases, cobertura 1-42, sin recesos; verificado con lectura). Se quita el nivel competitivo de todo el código (tipos, Sheets, generador, pruebas, UI) y el selector de frecuencia: solo 3 sesiones por semana. La columna `competitive_level` sale de `seasons`; las columnas posteriores se corren una posición.
  - Tests 41/41; `nuxi build` OK.
- L12 (2026-11-22): el banner de evaluaciones sale de la semana actual y pasa a una subpestaña "Evaluaciones" con todas las pruebas de la temporada agrupadas por semana (S1, S21, S42). Carga visible también en el encabezado de la semana.
  - Tests 41/41; `nuxi build` OK. Sin verificación visual en navegador.
- L13 (2026-11-22): se quita `slug` de ejercicios (generador, tipo, Sheets). Catálogo reimportado y verificado (68 ejercicios, columnas alineadas). Auditoría de datos sin uso: `homeSessions.dose_holiday_2`, `team_players.joined_at/left_at`, `weekly_reviews.created_at`, `seasons.ends_at` y `teams.coach_id` se escriben o se leen pero no alimentan ninguna pantalla ni lógica. Pendiente decidir.
  - Tests 41/41; `nuxi build` OK.
- L14 (2026-11-22): se quitan los datos sin uso: `home_sessions.dose_holiday_2`, `team_players.joined_at/left_at`, `weekly_reviews.created_at`, `seasons.ends_at` y `teams.coach_id`. Catálogo reimportado y verificado (34 sesiones de casa). El cálculo de fin de temporada del formulario se mantiene.
  - Caveat: el equipo ya no guarda quién lo creó; la relación de entrenadores queda solo en `team_coaches`, y `createTeam` no crea esa fila.
  - Tests 41/41; `nuxi build` OK. Las cabeceras de las pestañas operativas se actualizan en el próximo sync.
- L15 (2026-11-22): al crear un equipo se crea su fila en `team_coaches` con rol `owner` (id `EQC…`). El estado carga y envía `teamCoaches` en la sincronización, para que la tabla no se vacíe al guardar.
  - Tests 41/41; `nuxi build` OK. Sin prueba end-to-end en Sheets (no hay equipos todavía).
