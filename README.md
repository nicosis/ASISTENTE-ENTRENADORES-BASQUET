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
- Planificación Cadete (U16); las demás categorías quedan fuera del catálogo beta vigente.
- Nivel competitivo de formación o liga y frecuencia de uno, dos o tres entrenamientos semanales.
- Navegación por semanas, fases, cargas, semanas de descarga, trabajo en vacaciones y tests.
- Generación de sesiones desde el mismo catálogo que utiliza la interfaz. Cada bloque define objetivo, ejercicios, dosis y duración.
- Catálogo Cadete servido desde Google Sheets, con cuatro períodos, sesiones, variantes, bloques y ejercicios relacionados.
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

La planificación Cadete vigente usa cuatro períodos de agosto a junio. El calendario se alinea con los lunes de cada temporada y contempla semanas de vacaciones y descanso:

| Período | Meses de referencia |
| --- | --- |
| Pretemporada (`PT`) | Agosto–septiembre |
| Período 1 (`M1`) | Octubre–diciembre |
| Período 2 (`M2`) | Enero–marzo |
| Período 3 (`M3`) | Abril–junio |

La cantidad de semanas se calcula a partir del lunes de inicio de la temporada y puede variar según el calendario.

### Configuración aplicada

- Un macrociclo Cadete y cuatro períodos definidos en `mesocycles`.
- Doce sesiones, doce variantes, cuarenta bloques y ochenta y cuatro relaciones bloque–ejercicio.
- Dieciocho ejercicios y tres sesiones autónomas en `home_sessions`; la tabla `tests` está vacía.
- La fase, las semanas y la carga se consultan desde Sheets; el calendario alinea el catálogo con la temporada y las vacaciones seleccionadas.

El catálogo Cadete está en beta. Los ejercicios y las dosis propuestas requieren validación del cuerpo técnico antes de usarse como prescripción definitiva.

### Creación de una temporada

Al crear una temporada, la aplicación **no duplica ni genera nuevos mesociclos**.
Busca el macrociclo de referencia correspondiente a la categoría y lo vincula a
la nueva fila de `seasons`. Los mesociclos, sesiones, variantes y bloques siguen
siendo datos reutilizables de la Biblia.

Los `microcycles` sí son datos propios de cada temporada porque contienen fechas
reales, carga, objetivo y estado semanal. Al crear una temporada se generan
automáticamente `macrocycles.total_weeks` filas, con lunes como inicio y domingo
como cierre. Cada fila se vincula al período cuyo intervalo incluye esa semana
y comienza en estado `planned`.

Los microciclos usan IDs globalmente únicos de seis dígitos (`MIC000001`). Se
aceptan IDs antiguos de cuatro dígitos durante la lectura y se normalizan al
nuevo formato; los IDs `MAC####` y `MES####` conservan cuatro dígitos.

## Google Sheets

La aplicación usa un spreadsheet de Google como almacenamiento compartido. Google Sheets es la fuente única del catálogo y de los datos operativos. Si la lectura falla, el backend devuelve un error y la interfaz no muestra datos de respaldo.

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

La lectura se realiza mediante `GET /api/sheets-db`. Las mutaciones operativas se sincronizan mediante `POST /api/sheets-sync`; la interfaz actual envía las planillas operativas completas. Por ello, Google Sheets es apropiado para el prototipo y para un uso coordinado con cautela, pero aún no ofrece control de concurrencia ni permisos de servidor por usuario.

### Estado de migración Cadete — 8 de noviembre de 2026

La aplicación lee el catálogo y los datos operativos desde Sheets, sin usar catálogos, perfiles ni tablas operativas locales como respaldo. Al iniciar, elimina las claves heredadas conocidas de `localStorage`. La sincronización de tablas limpia y escribe en un único `batchUpdate`, valida la respuesta y conserva las hojas y sus encabezados.

La hoja quedó con 1 macrociclo, 4 períodos, 12 sesiones, 12 variantes, 40 bloques, 84 relaciones bloque–ejercicio, 18 ejercicios, 3 sesiones de casa y 0 tests. Se conservaron los 3 entrenadores. Equipos, temporadas, jugadores, membresías, revisiones y microciclos quedaron vacíos. También se borraron 36 referencias antiguas de imágenes en Sheets y se eliminaron 37 archivos locales de imágenes heredadas.

Se verificó el recorrido por API contra Sheets: lectura, escritura temporal de equipo/temporada/48 microciclos, generación de una sesión de 25 minutos con 3 bloques y 7 elementos, y limpieza posterior. La comprobación final dejó equipos, temporadas y microciclos en cero y conservó los 3 entrenadores. La cola de guardados serializa snapshots y evita que una recuperación atrasada sobrescriba cambios nuevos.

Verificación local observada: `node --test tests/*.test.mjs` pasó 7/7, `npm run build` terminó correctamente y `git diff --check` pasó. La inspección visual no pudo completarse porque el host del navegador no estuvo disponible.

El commit de la feature sigue pendiente: el último hook Guardian lo rechazó. Reportó un tipo incompatible en el cálculo de fechas del resumen anual, un `macrocycleId` opcional que puede llegar como `undefined` a Sheets, el límite de lectura de 499 filas frente a reescrituras completas y la pérdida de errores específicos de vacaciones/semana fuera de rango. Revisiones anteriores también señalaron que el backend aún no valida una identidad de administrador, que los snapshots completos no detectan escrituras de otros clientes y que la generación acepta parámetros que pueden contradecir la temporada guardada. La validación de fechas de Sheets sigue pendiente. La sugerencia de dividir los componentes es una mejora estructural separada, no un bloqueo funcional identificado.

**Próximo paso bloqueante:** corregir los defectos de tipo y de integridad reportados por Guardian, y definir qué identidad autenticada debe usar el backend para autorizar escrituras administrativas. No se hizo commit ni push. Los cambios de la feature están preparados en el índice de Git; las ediciones preexistentes de `.atl/` se dejaron fuera. El push requiere además un destino remoto y una sesión/credencial explícitamente autorizados.

## Estructura

```text
app/
  app.vue                              # Interfaz principal
  composables/
    useCoachWorkspace.ts               # Estado y flujos de equipos/temporadas
    useCoachStorage.ts                 # Tipos, validación y fechas de temporada
    useTrainingPlan.ts                 # Lectura del catálogo y planificación
    useWeeklyReviews.ts                # Observaciones semanales
  shared/cadeteCalendar.ts             # Calendario y alineación del catálogo Cadete
  shared/serialTaskQueue.ts            # Orden de escrituras y control de tareas obsoletas
  shared/training.ts                   # Tipos y reglas de sesión
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

1. Definir una identidad autenticada y exigir autorización de administrador en el servidor antes de permitir escrituras.
2. Leer tablas completas: la lectura actual está limitada a 499 filas por planilla.
3. Evitar que snapshots de distintos clientes se pisen y hacer observable el resultado de cada guardado.
4. Derivar la categoría y el nivel de la temporada guardada al generar sesiones; mantener coherentes día y frecuencia.
5. Preservar errores específicos de calendario y validar las fechas importadas desde Sheets.
6. Validar con el cuerpo técnico la metodología, ejercicios, pausas, dosis y reglas de progresión de la beta.
7. Evaluar una base de datos transaccional para producción, generación de PDF e IA limitada a la metodología validada.
