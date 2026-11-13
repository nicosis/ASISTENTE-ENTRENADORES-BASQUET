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
| `mesocycles` | Fases: 10 de entrenamiento, más las semanas de vacaciones (Navidad y Semana Santa) y el combine final. Cada fase tiene su rango de semanas, cargas y reglas. |
| `mesocycle_sessions` | Sesiones de una fase, una por día (lunes, miércoles, viernes). |
| `training_blocks` | Bloques de una sesión (activa, rápido, fuerte, juega), con sus minutos y formato. |
| `block_exercises` | Ejercicio dentro de un bloque, con su dosis de formación, de liga y la dosis de cada semana. |
| `exercises` | Ficha de cada ejercicio: nombre, área de movimiento, nivel de aproximación, material, cómo se hace, indicación clave, errores, versión más fácil y más difícil. |
| `home_sessions` | Trabajo en casa de Navidad y Semana Santa (sesiones A, B y C). |
| `tests` | Pruebas del combine (S1, S21 y S42) con su protocolo. |

La sesión se encuentra por fase y día. El rango de semanas es el de la fase, así que no hay una capa intermedia de variantes.

```text
Macrociclo → Fase → Sesión (día) → Bloque → Ejercicio en bloque → Dosis por semana
                                                    ↑ ficha de `exercises`
```

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
2. Se toma la sesión de esa fase para el día pedido.
3. Cada bloque muestra sus ejercicios de `block_exercises`, con la dosis de la semana.
4. Si falta una sesión, un bloque o una dosis, la aplicación informa el motivo.

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
