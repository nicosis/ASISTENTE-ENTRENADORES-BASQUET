# Pizarra · Asistente de entrenamiento de baloncesto

Aplicación web para que entrenadores de baloncesto organicen equipos y temporadas, recorran una planificación física por fases y generen sesiones semanales de una, dos o tres jornadas.

Está construida con Nuxt 4 y Vue 3. Google Sheets es la única fuente de datos; si no está disponible, la aplicación queda vacía y muestra un aviso en lugar de usar información local antigua.

## Funcionalidad actual

- Gestión de equipos, plantilla, temporadas y observaciones semanales.
- Panel de equipos con búsqueda por nombre o club, tarjetas con iniciales y acciones para archivar o eliminar.
- Menú de acciones del equipo y menú de usuario adaptado a pantallas móviles.
- Indicador del tiempo transcurrido de la temporada y sesiones anteriores visibles en gris; sus bloques siguen disponibles para consulta.
- Acceso flotante en móvil para añadir o editar la nota de la semana seleccionada.
- Estados de equipo (`active` / `archived`) y de temporada (`active` / `closed`).
- Roles visuales de entrenador y administrador; el administrador puede eliminar un equipo junto a sus temporadas y observaciones.
- Planificación por categoría: Alevín (U12), Infantil (U14), Cadete (U16) y Juvenil (U18).
- Nivel competitivo de formación o liga y frecuencia de uno, dos o tres entrenamientos semanales.
- Navegación por semanas, fases, cargas, semanas de descarga, trabajo en vacaciones y tests.
- Generación de sesiones desde el mismo catálogo que utiliza la interfaz. Cada bloque define objetivo, ejercicios, dosis y duración.
- Base Cadete de 45 semanas, organizada en siete mesociclos, con dos variantes (`A`/`B`) por sesión.
- La sesión del `día 1` es la principal; los días 2 y 3 son refuerzos. La frecuencia del equipo determina si se muestra uno, dos o tres días.
- Lectura exclusiva desde Google Sheets. Cuando Sheets no está disponible, se bloquean las acciones dependientes y se muestra el estado de datos no disponibles.

## Modelo de datos

El catálogo de entrenamiento se organiza en nueve planillas relacionadas:

1. `macrocycles`
2. `mesocycles`
3. `mesocycle_sessions`
4. `session_variants`
5. `training_blocks`
6. `block_exercises`
7. `exercises`
8. `home_sessions`
9. `tests`

Los datos operativos se almacenan en otras siete planillas:

1. `coaches`
2. `teams`
3. `players`
4. `team_players`
5. `seasons`
6. `weekly_reviews`
7. `microcycles`

Los identificadores siguen el formato de tres letras y cuatro dígitos, por ejemplo `MAC0001`, `MES0001`, `EQU0001` y `OBS0001`.

### Periodización anual

Una fila de `seasons` aplica un registro de `macrocycles` a un equipo. Esa instancia representa el **macrociclo**; `mesocycles` define sus bloques de varias semanas y `microcycles` representa cada semana concreta. Las sesiones se descomponen en bloques de entrenamiento y ejercicios.

```text
Equipo → Macrociclo (temporada) → Mesociclos (fases) → Microciclos (semanas) → Sesiones → Bloques → Ejercicios
```

### Variantes de sesión

`session_variants` evita repetir exactamente los mismos ejercicios durante una
fase. Cada sesión puede tener dos variantes (`A` y `B`) con estos campos:

| Campo | Descripción |
| --- | --- |
| `id` | Identificador estable, por ejemplo `VAR0001`. |
| `mesocycle_session_id` | Sesión base a la que pertenece. |
| `variant_code` | `A` o `B`. |
| `name`, `focus` | Texto visible de la alternativa. |
| `week_start`, `week_end` | Intervalo de semanas del mesociclo en el que se aplica la variante. |

La selección usa el número de semana del microciclo y el intervalo configurado
en la variante. Por ejemplo, un mesociclo de cuatro semanas puede usar `A` en
las semanas 1–2 y `B` en las semanas 3–4. Los bloques se mantienen como estructura de
la sesión y `block_exercises.variant_id` selecciona el ejercicio concreto de
la variante. Si falta la variante o un ejercicio relacionado, la aplicación
informa que no hay información disponible; nunca sustituye contenido de otra
categoría.

Ejemplo Cadete:

```text
SES0037 · Fase 3 · Día 1
├── VAR00xx · Variante A · split squat + salto al cajón
└── VAR00yy · Variante B · zancada atrás + salto vertical
```

La duración total se configura con `macrocycles.total_weeks`. Cada fila de `mesocycles` define su propio intervalo con `week_start`, `week_end` y `weeks_count`. Cada fila de `microcycles` representa una semana, con fechas reales, carga y objetivo.

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

La base Cadete del catálogo está configurada con 45 semanas y siete mesociclos. Los períodos competitivos incluyen ejemplos de ejercicios y los transitorios proponen trabajo autónomo de baja carga.

### Configuración aplicada

- El macrociclo Cadete de referencia tiene `total_weeks = 45`.
- Hay siete filas en `mesocycles` para ese macrociclo, sin huecos entre las semanas 1 y 45.
- Cada mesociclo tiene tres sesiones base: día 1 principal y días 2 y 3 de refuerzo.
- Cada sesión tiene dos variantes y la rotación se realiza por paridad semanal.
- `weekly_loads` contiene un valor por semana del mesociclo. La última semana de cada período competitivo es una descarga.
- Los períodos de Navidad, Semana Santa y cierre de temporada usan `type = holiday`; la interfaz muestra entonces las sesiones autónomas de `home_sessions`.
- Las evaluaciones de Cadete (U16) se sitúan en las semanas 1, 19, 31 y 41.

Los ejemplos incluidos deben validarse con el cuerpo técnico antes de utilizarlos como prescripción definitiva:

| Categoría | Ejemplos en los períodos competitivos |
| --- | --- |
| U12 | Carreras de persecución, salto y frenada, zancada asistida y plancha lateral. |
| U14 | Lanzamiento de balón medicinal, split squat, sprint de 10 m y remo con banda. |
| U16 | Split squat con mancuerna, CMJ, sprint reactivo, RDL y nórdico asistido. |
| U18 | RDL, split squat pesado, CMJ, sprint de 10–20 m y curl nórdico. |

Las sesiones de Cadete incluyen variantes A/B para alternar ejercicios dentro de
cada fase. Las categorías que todavía no tienen variantes específicas conservan
su plantilla base hasta que el cuerpo técnico las valide.

### Creación de una temporada

Al crear una temporada, la aplicación **no duplica ni genera nuevos mesociclos**.
Busca el macrociclo de referencia correspondiente a la categoría y lo vincula a
la nueva fila de `seasons`. Los mesociclos, sesiones, variantes y bloques siguen
siendo datos reutilizables de la Biblia.

Los `microcycles` sí son datos propios de cada temporada porque contienen fechas
reales, carga, objetivo y estado semanal. Al crear una temporada se generan
automáticamente exactamente `macrocycles.total_weeks` filas, normalmente 45,
con lunes como inicio y domingo como cierre. Cada fila se vincula al mesociclo
cuyo intervalo incluye esa semana y comienza en estado `planned`.

Los microciclos usan IDs globalmente únicos de seis dígitos (`MIC000001`). Se
aceptan IDs antiguos de cuatro dígitos durante la lectura y se normalizan al
nuevo formato; los IDs `MAC####` y `MES####` conservan cuatro dígitos.

## Google Sheets

La aplicación usa un spreadsheet de Google como almacenamiento compartido. Google Sheets es la fuente única del catálogo, las temporadas y los microciclos. Si la lectura falla, el backend devuelve un error y la interfaz no muestra datos de respaldo.

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
    sheets-db.get.ts                   # Lectura exclusiva de Google Sheets
    sheets-sync.post.ts                # Sincronización hacia Google Sheets
  utils/googleSheets.ts                # Cliente y mapeo de las planillas
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
| `GET` | `/api/sheets-db` | Carga las planillas de catálogo, microciclos y operación desde Google Sheets; acepta `?refresh=1` para ignorar la caché breve. |
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
