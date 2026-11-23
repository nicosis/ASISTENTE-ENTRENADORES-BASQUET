# Pizarra · Asistente de entrenamiento de baloncesto

Aplicación para que entrenadores den el módulo de preparación física de un plan anual. El plan de referencia es `plan_anual_cadete_modelo_cantera.pdf` (Modelo de cantera Boyle · Macner · Moras). **Ante cualquier diferencia, manda el PDF.**

## Principios

1. **Google Sheets es la única fuente.** Si la lectura falla, la aplicación no muestra datos de respaldo.
2. **El catálogo se importa, no se edita a mano.** Lo genera `odd/plan-data/buildCatalog.mjs` a partir de las fuentes revisadas del PDF.
3. **La operación se escribe desde la aplicación.** El catálogo no puede sobrescribirse desde el endpoint de sincronización.
4. **Sin contenido inventado.** Si falta una dosis, un bloque o un ejercicio, la aplicación lo informa; nunca rellena con otro contenido.

## Modelo de datos actual

Hay dos grupos de hojas. Los nombres son los que lee el código hoy.

### Catálogo (se reemplaza desde el PDF)

| Hoja | Contenido |
| --- | --- |
| `macrocycles` | Plan anual completo (42 semanas, categoría cadete). |
| `mesocycles` | Fases del plan: su rango de semanas, tipo, objetivo y carga (intensidad 0-10). Las series, repeticiones y cargas por ejercicio viven en `block_exercise_doses`. |
| `mesocycle_sessions` | Plantilla de sesiones de una fase: `day` (`dia1`–`dia3`), `order` y `name`. El nombre es «Día N» en el generador local; la hoja debe actualizarse a mano porque `sheets-sync` no escribe el catálogo. |
| `training_blocks` | Bloques de una sesión (activa, rápido, fuerte, juega), con sus minutos y formato. |
| `block_exercises` | Ejercicio dentro de un bloque. |
| `block_exercise_doses` | Dosis de un ejercicio de bloque en una semana concreta (una fila por ejercicio y semana). |
| `exercises` | Ficha de cada ejercicio: nombre, área de movimiento, nivel de aproximación, material, cómo se hace, indicación clave, errores, versión más fácil y más difícil. |
| `home_sessions` | Trabajo en casa de Navidad y Semana Santa (sesiones A, B y C). |
| `tests` | Pruebas del combine (S1, S21 y S42) con su protocolo. |

La sesión se encuentra por fase y día. El rango de semanas es el de la fase, así que no hay una capa intermedia de variantes.

```text
Macrociclo → Fase → Sesión (día) → Bloque → Ejercicio en bloque → Dosis por semana
                                                    ↑ ficha de `exercises`
```

### Convenciones de IDs

| Entidad | Formato | Ejemplo | Origen |
| --- | --- | --- | --- |
| Macrociclo | `CAD` + año del plan | `CAD27` | Fijo en `buildCatalog.mjs`. Las 42 semanas son un dato (`totalWeeks`), no parte del ID. |
| Fase | `{macro}-MES{NN}` | `CAD27-MES01` | Derivado del orden de la fase. |
| Sesión | `{fase}-D{NN}` | `CAD27-MES01-D01` | Día de la fase. |
| Bloque | `{sesión}-B{NN}` | `CAD27-MES01-D01-B01` | Orden del bloque. |
| Ejercicio en bloque | `{bloque}-E{NN}` | `CAD27-MES01-D01-B01-E01` | Orden dentro del bloque. |
| Ficha de ejercicio | `EX{NNNN}` | `EX0017` | Persistente: se asigna una vez en `odd/plan-data/exercises.json` y no se recalcula. |
| Test | `{macro}-T{NN}` | `CAD27-T01` | Orden del test. |
| Sesión en casa | `{macro}-H{NN}-{letra}-E{NN}` | `CAD27-H01-A-E01` | Plan de vacaciones y sesión A/B/C. |

Regla: los IDs de ficha (`EX`) no contienen categoría ni macrociclo, porque un ejercicio se reutiliza en varios planes y bloques. La relación se expresa con tablas (`block_exercises`, `block_exercise_doses`), no con el ID.

### Qué informa cada tabla de forma única

- `mesocycles` informa cuántas fases hay, su rango de semanas, tipo, objetivo y `load` (intensidad de la fase, 0-10; `0` en vacaciones y combine). No guarda series, repeticiones ni color.
- `block_exercise_doses` es la única fuente de dosis: una fila por ejercicio y semana, con el texto de la dosis (series, repeticiones, carga).
- El color lo decide el front (`app/shared/phaseColors.ts`).

### Operación (la escribe la aplicación)

| Hoja | Contenido |
| --- | --- |
| `coaches` | Entrenadores, con rol `admin` o `coach`. |
| `teams` | Equipos, activos o archivados. |
| `players` | Jugadores. |
| `team_players` | Pertenencia de un jugador a un equipo, con fechas de alta y baja. |
| `seasons` | Temporada de un equipo: fechas, días de entrenamiento y semanas de vacaciones. |
| `microcycles` | Una fila por semana de temporada, generada al crear la temporada. |
| `weekly_reviews` | Observaciones de cada semana. |

Las filas actuales de la operación son de prueba. Las pestañas se conservan vacías (solo encabezados).

## Cómo se genera una sesión

1. Se toma la semana de la temporada y, a partir de ella, la fase.
2. Se toman las primeras N sesiones de la fase (N = frecuencia de la temporada), ordenadas por `order`.
3. Cada bloque muestra sus ejercicios de `block_exercises`, con la dosis de la semana.
4. Si falta una sesión, un bloque o una dosis, la aplicación informa el motivo.

En la pantalla de la semana, cada tarjeta muestra `SESIÓN N · DÍA M`. **N** es el número acumulado en toda la temporada: suma `frequency` por cada semana de entrenamiento anterior, y las semanas de vacaciones no suman (`getSeasonSessionOffset` en `app/shared/training.ts`). **M** es el orden dentro de la semana.

## Cómo se crea una temporada

El flujo completo, con las pestañas que toca cada paso, está en `odd/docs/flujo-creacion-temporada.pdf`. En resumen:

1. El formulario pide el inicio (`dd/mm/aaaa`, con calendario), la frecuencia, las vacaciones (solo cadete) y el contexto.
2. Al crear la temporada se cierran las activas del equipo, se crea una fila en `seasons` y se generan las semanas en `microcycles` (42 en cadete).
3. La operación se sincroniza con `POST /api/sheets-sync`. El catálogo no se toca.

Las sesiones no se generan al crear la temporada; se calculan al abrir cada día.

## Google Sheets

La base es una hoja de cálculo de Google compartida con la cuenta de servicio configurada. El ID puede guardarse en el repositorio; las credenciales, no.

```env
GOOGLE_SPREADSHEET_ID=tu-spreadsheet-id
GOOGLE_SERVICE_ACCOUNT_EMAIL=tu-cuenta-de-servicio@tu-proyecto.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
```

No subas `.env` ni la clave privada al repositorio.

- La lectura usa `GET /api/sheets-db`.
- La escritura operativa usa `POST /api/sheets-sync`. No puede sobrescribir el catálogo.
- El catálogo se reemplaza solo con la importación local explícita:

```bash
node odd/plan-data/importCatalog.mjs --replace-catalog
```

## Imágenes de ejercicios

Las imágenes están en construcción. Todas las vistas usan `public/images/exercises/imagen-base.jpg` con el aviso «Imágenes en construcción» (`app/shared/exerciseImages.ts`). Las imágenes anteriores siguen en el historial de git si hay que recuperarlas.

## Estructura del código

```text
app/
  components/      # Componentes de la interfaz
  composables/     # Estado y flujos de la pantalla (useCoachWorkspace, useTrainingPlan…)
  shared/          # Lógica de dominio compartida: catálogo, calendario de 42 semanas, sesiones
server/
  api/             # Endpoints: generación de sesión, lectura y sincronización de Sheets
  utils/           # Cliente de Google Sheets y rangos de hojas
odd/plan-data/     # Fuentes del catálogo, constructor e importador
odd/tasks/         # Documento de la funcionalidad y su registro
tests/             # Pruebas con node:test
```

## Ejecutar en local

Requiere una versión compatible de Node.js y npm.

```bash
npm install
npm run dev     # http://localhost:3000
npm run build
node --test tests/*.test.mjs
```

## Endpoints

| Método | Ruta | Descripción |
| --- | --- | --- |
| `POST` | `/api/generate-training` | Genera una sesión según fase, semana y día. |
| `GET` | `/api/sheets-db` | Carga las hojas desde Google Sheets. Acepta `?refresh=1` para ignorar la caché breve. |
| `POST` | `/api/sheets-sync` | Escribe las hojas operativas. Requiere credenciales. |

## Pendiente

1. Definir el flujo inicial de uso: qué hace el entrenador al empezar y qué datos necesita cargar.
2. Definir una identidad autenticada y exigir autorización de administrador en el servidor antes de permitir escrituras.
3. Validar con el cuerpo técnico la metodología, los ejercicios, las pausas, las dosis y las reglas de progresión.
4. Decidir si el nivel formación/liga sigue existiendo; no aparece en el PDF.
5. Evitar que snapshots de distintos clientes se pisen.
6. Evaluar una base de datos transaccional para producción y generación de PDF.
7. Actualizar en Sheets la columna `name` de `mesocycle_sessions` (30 filas) de «Lunes», «Miércoles» y «Viernes» a «Día 1», «Día 2» y «Día 3». La aplicación no puede hacerlo.
8. Decidir si las semanas de vacaciones deben aparecer como semanas sin sesiones en la numeración de la temporada (hoy no suman).
9. Renombrar `exercises.category` a `level`: hoy guarda el nivel de movimiento (`Nivel I`, `Nivel 0−`…), no una categoría.
10. Corregir el slug que termina en guion (`dead-bug-bicho-muerto-`); la normalización no recorta los extremos.
11. Decidir si las semanas de descanso dentro de una fase de cadete deben mostrar una carga distinta de la fase. Antes mostraban 3; ahora muestran `load` de la fase.
12. `home_sessions` todavía guarda `week_doses_json` y `dose_holiday_1/2`. Unificarlo con `block_exercise_doses` está pendiente.
13. Mostrar en la pantalla de equipos el acceso compartido (`team_coaches`). La pestaña existe y el tipo está en el código; falta la interfaz.
14. El chequeo de tipos (`nuxi typecheck`) no corre en este entorno porque requiere instalar `golar`. Los cambios de esta sesión se validaron con las pruebas y lectura de código.
15. Los cambios de código de esta sesión no tienen commit todavía.
