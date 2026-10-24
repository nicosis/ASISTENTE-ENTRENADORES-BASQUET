# Pizarra · Asistente de entrenamiento de baloncesto

Aplicación web para que entrenadores de baloncesto organicen equipos y temporadas, recorran una planificación física por fases y generen sesiones semanales de una, dos o tres jornadas.

Está construida con Nuxt 4 y Vue 3. El catálogo de planificación vive en código como fuente de respaldo y puede cargarse y sincronizarse con una hoja de cálculo de Google Sheets.

## Funcionalidad actual

- Gestión de equipos, plantilla, temporadas y observaciones semanales.
- Estados de equipo (`active` / `archived`) y de temporada (`active` / `closed`).
- Roles visuales de entrenador y administrador; el administrador puede eliminar un equipo junto a sus temporadas y observaciones.
- Planificación por categoría: Alevín (U12), Infantil (U14), Cadete (U16) y Juvenil (U18).
- Nivel competitivo de formación o liga y frecuencia de uno, dos o tres entrenamientos semanales.
- Navegación por semanas, fases, cargas, semanas de descarga, trabajo en vacaciones y tests.
- Generación de sesiones desde el mismo catálogo que utiliza la interfaz. Cada bloque define objetivo, ejercicios, dosis y duración.
- Persistencia local en el navegador como respaldo y sincronización de catálogo y datos operativos con Google Sheets cuando existen credenciales configuradas.

## Modelo de datos

El catálogo de entrenamiento se organiza en ocho planillas relacionadas:

1. `plantillas_macrociclo`
2. `mesociclos`
3. `sesiones_planificadas`
4. `bloques_sesion`
5. `ejercicios_bloque`
6. `ejercicios`
7. `sesiones_transitorias`
8. `evaluaciones`

Los datos operativos se almacenan en otras cuatro planillas:

1. `entrenadores`
2. `equipos`
3. `macrociclos`
4. `revisiones_microciclo`

Los identificadores siguen el formato de tres letras y cuatro dígitos, por ejemplo `PLN0001`, `EQU0001` y `OBS0001`.

### Periodización anual

Una fila de `macrociclos` aplica una `plantillas_macrociclo` a un equipo. Esa instancia representa el **macrociclo**; `mesociclos` define sus fases y cada semana es un **microciclo**. Las sesiones se descomponen en bloques y ejercicios.

```text
Equipo → Macrociclo (temporada) → Mesociclos (fases) → Microciclos (semanas) → Sesiones → Bloques → Ejercicios
```

La duración total se configura con `plantillas_macrociclo.total_weeks`. Cada fila de `mesociclos` define su propio intervalo con `week_start`, `week_end` y `weeks_count`.

La periodización objetivo, basada en [ESTRUCTURA DE UNA TEMPORADA](https://docs.google.com/spreadsheets/d/1sXNf5-OCUkx607aGiFqyW0HwbXSMLMzVDMEDcgjUtIo/edit), consta de 45 semanas:

| Mesociclo | Semanas | Duración |
| --- | --- | ---: |
| Pretemporada | 1–4 | 4 semanas |
| Período competitivo 1 | 5–16 | 12 semanas |
| Período transitorio de Navidad | 17–18 | 2 semanas |
| Período competitivo 2 | 19–29 | 11 semanas |
| Período transitorio de Semana Santa | 30 | 1 semana |
| Período competitivo 3 | 31–41 | 11 semanas |
| Período transitorio final | 42–45 | 4 semanas |

Las cuatro plantillas del catálogo ya están configuradas con 45 semanas y siete mesociclos. Los períodos competitivos incluyen ejemplos de ejercicios y los transitorios proponen trabajo autónomo de baja carga.

### Configuración aplicada

- Cada `plantillas_macrociclo` tiene `total_weeks = 45`.
- Hay 28 filas en `mesociclos`: siete por categoría y sin huecos entre las semanas 1 y 45.
- `weekly_loads` contiene un valor por semana del mesociclo. La última semana de cada período competitivo es una descarga.
- Los períodos de Navidad, Semana Santa y cierre de temporada usan `type = holiday`; la interfaz muestra entonces las sesiones autónomas de `sesiones_transitorias`.
- Las evaluaciones de Cadete (U16) se sitúan en las semanas 1, 19, 31 y 41.

Los ejemplos incluidos deben validarse con el cuerpo técnico antes de utilizarlos como prescripción definitiva:

| Categoría | Ejemplos en los períodos competitivos |
| --- | --- |
| U12 | Carreras de persecución, salto y frenada, zancada asistida y plancha lateral. |
| U14 | Lanzamiento de balón medicinal, split squat, sprint de 10 m y remo con banda. |
| U16 | Split squat con mancuerna, CMJ, sprint reactivo, RDL y nórdico asistido. |
| U18 | RDL, split squat pesado, CMJ, sprint de 10–20 m y curl nórdico. |

Las sesiones del tercer período competitivo reutilizan la plantilla de sesiones del primer período competitivo de su categoría y se muestran con el nombre y objetivo del mesociclo activo. Es una decisión transitoria: queda pendiente diseñar filas específicas en `sesiones_planificadas`, `bloques_sesion` y `ejercicios_bloque` para cada uno de esos cuatro mesociclos.

## Google Sheets

La aplicación puede usar un spreadsheet de Google como almacenamiento compartido. Si las credenciales no están disponibles o falla la conexión, la API usa el catálogo local de respaldo y la interfaz conserva el estado local del navegador.

### Hoja vinculada

La base de datos actual del proyecto es [Pizarra Basquet DB](https://docs.google.com/spreadsheets/d/1GjkD61x4q5FGWhQcfm8GmepCQBj8Q32WMJQsYlDmvtk/edit), con el identificador `1GjkD61x4q5FGWhQcfm8GmepCQBj8Q32WMJQsYlDmvtk`.

El acceso depende de que la hoja esté compartida con la cuenta de servicio configurada o con la cuenta de Google Drive conectada. El ID de la hoja puede guardarse en el repositorio; las credenciales de la cuenta de servicio, no.

1. Crea una cuenta de servicio en Google Cloud con acceso a la API de Google Sheets.
2. Comparte el spreadsheet con el correo de esa cuenta de servicio.
3. Copia `.env.example` como `.env` y completa las variables:

```env
GOOGLE_SPREADSHEET_ID=tu-spreadsheet-id
GOOGLE_SERVICE_ACCOUNT_EMAIL=tu-cuenta-de-servicio@tu-proyecto.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
```

No subas el archivo `.env` ni la clave privada al repositorio.

La lectura se realiza mediante `GET /api/sheets-db`. Las mutaciones de equipos, macrociclos y observaciones se sincronizan mediante `POST /api/sheets-sync`; la interfaz actual envía las planillas operativas completas. Por ello, Google Sheets es apropiado para el prototipo y para un uso coordinado con cautela, pero aún no ofrece control de concurrencia ni permisos de servidor por usuario.

## Estructura

```text
app/
  app.vue                              # Interfaz principal
  composables/
    useCoachWorkspace.ts               # Estado y flujos de equipos/temporadas
    useCoachStorage.ts                 # Tipos, validación y localStorage
    useTrainingPlan.ts                 # Lectura del catálogo y planificación
    useWeeklyReviews.ts                # Observaciones semanales
  shared/training.ts                   # Catálogo, tipos y reglas de sesión
server/
  api/
    generate-training.post.ts          # Generación de una sesión
    sheets-db.get.ts                   # Lectura de Google Sheets o fallback local
    sheets-sync.post.ts                # Sincronización hacia Google Sheets
  utils/googleSheets.ts                # Cliente y mapeo de las 12 planillas
```

## Ejecutar en local

Requiere una versión compatible de Node.js y npm.

```bash
npm install
npm run dev
```

Abre `http://localhost:3000`.

Para crear una compilación de producción:

```bash
npm run build
```

## Endpoints

| Método | Ruta | Descripción |
| --- | --- | --- |
| `POST` | `/api/generate-training` | Compone una sesión según día, frecuencia, semana, categoría y nivel competitivo. |
| `GET` | `/api/sheets-db` | Carga las doce planillas desde Google Sheets; acepta `?refresh=1` para ignorar la caché breve. |
| `POST` | `/api/sheets-sync` | Crea o actualiza las planillas en Google Sheets. Requiere credenciales configuradas. |

## Limitaciones y próximos pasos

1. Implementar autenticación real y autorización en el servidor; los roles actuales son una convención de interfaz, no una barrera de seguridad.
2. Sustituir la escritura completa de planillas por operaciones por entidad con control de concurrencia.
3. Añadir pruebas automatizadas, lint y comprobación de tipos al proyecto.
4. Validar con el cuerpo técnico la metodología, pausas, ejercicios de ejemplo y reglas de progresión.
5. Diseñar sesiones, bloques y dosis específicos para el período competitivo 3 de cada categoría, en lugar de reutilizar la plantilla competitiva inicial.
6. Separar las sesiones autónomas de Navidad, Semana Santa y transición final si requieren objetivos o dosis diferentes.
7. Evaluar una base de datos transaccional para producción y generar PDF de las sesiones.
8. Añadir IA limitada por la metodología validada y la biblioteca de ejercicios aprobada.
