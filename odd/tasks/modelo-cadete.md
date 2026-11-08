# Modelo de cadete: Pista y Sala

Rama: feat/modelo-cadete; entrega: ask-on-risk. Verificación: `node --test tests/*.test.mjs`, `npm run build` y recorrido funcional de Sheets.
Fuente: documento «Model S&C de Cantera · Pista + Sala» del 2 de noviembre de 2026.

## Specs

- S1: «tenemos que configurar solamente cara cadete, podemos ovbiar las otra categorias».
- S2: «cuanod veas una diferencia me preguntas en los tiempo, lo importante que que coincidasn los totales diarios con la suma de los nidukos»; «ajusta los totales del dia».
- S3: Semana propuesta y aceptada: lunes, activación 5 min, sala 18 min, reto 2 min; miércoles, activación 5 min, pista 13 min, prevención 7 min, reto 2 min; viernes, activación 5 min, sala 20 min, reto 2 min. Total: 25, 27 y 27 min.
- S4: «si configurala porfa y los datops que teniaamos antes eliminalos, no quiero tener fantasmas ni datos muertos resagados»; «si todo, los equipos actuales y temporadas son de testing»; «quiero que alimines el catalogo en sheets y comienzes de cero con el la nueva estructura, no quiero datos en local la unica fuente es sheets»; «VERIFICA DE INICIO A FIN, ELIMINA LO HEREDADO». Sheets es la única fuente persistente de catálogo y datos operativos; limpiar los datos de prueba y los cachés locales heredados, conservando encabezados y entrenadores. Pretemporada de agosto a septiembre.
- S5: «inventas mas ejercicios si es necesario»; aplicar los ejercicios y cargas del modelo de cadete, en castellano, y distinguir las propuestas de lo establecido en el documento.

## Tasks

- [x] T1 (S1–S3, S5): Catálogo relacional de cadete y calendario; ruta inline; pruebas 6/6.
- [ ] T2 (S1–S5): Aplicación conectada a Sheets como única fuente, generación y consistencia de operaciones; ruta inline; reabierta por hallazgos del hook Guardian, pendiente de corrección y nuevo cierre.
- [x] T3 (S4): Reemplazo verificado y limpieza de datos locales/remotos heredados; ruta inline; tablas operativas restauradas a su estado limpio.

## Log

- L1: «levanta el contenido, pasalo a castellano y tenemos que adaptar el contenido de las tablas para mostrralo tal como se explica en el socumento, los mesosiclos, los modilos, los ejercicios y los tiempo y cargas, puedes hacerlo? pordemos eliminar todo lo que tenemos y arracnar nuevamente ocn este enfoque».
- La lectura de Sheets es la fuente de datos de la aplicación. La sincronización actual limpia y reescribe tablas completas; no ejecutar una sincronización vacía como mecanismo de exploración.
- El usuario aceptó la propuesta de semana de cadete, con ejercicios adicionales cuando sean necesarios, y autorizó reemplazar los datos existentes de prueba.
- Cada semana pertenece al período del mes de su lunes. `app/shared/cadeteCalendar.ts` calcula semanas desde un lunes de agosto hasta junio; `node --test tests/cadete-calendar.test.mjs` pasó dos pruebas. Aún no está integrado con la creación de temporadas.
- El entrenador seleccionará las semanas de vacaciones. El calendario marca las semanas seleccionadas y valida que estén dentro de la temporada; todavía falta la interfaz y la persistencia.
- `app/shared/cadetePlan.ts` registra la semana aceptada y las cargas de referencia; los seis tests disponibles pasan. El catálogo sigue sin conectarse a Sheets ni a las vistas.
- El usuario confirmó que el volumen de saltos se aplicará solo a las sesiones que los incluyen; es ajustable más adelante. Los siete tests disponibles pasan.
- El usuario confirmó que las vacaciones cuentan como descanso y reinician el ciclo de tres semanas. El calendario también reinicia el ciclo al comenzar un período nuevo. Las nueve pruebas disponibles pasan; la integración sigue pendiente.
- Handoff: «guarda todo en engram y seguimos luego». El hook de Engram bloqueó tanto `mem_save` como `mem_session_summary` porque la sesión del host no está registrada. Este archivo conserva el estado local; no se ha guardado un espejo en Engram.
- Pendiente: integrar el calendario dinámico, el selector de vacaciones, las sesiones y cargas con las vistas, la generación y la persistencia; preparar y verificar el reemplazo de las tablas y los datos de prueba antes de ejecutar cualquier borrado. No se han cambiado datos remotos ni creado commits de esta rama.
- Node v22.21.1 está disponible fuera del sandbox; `node --test tests/*.test.mjs` pasó 9/9. Los cambios de `.atl` eran preexistentes y no forman parte de esta tarea.
- Espejo de Engram pendiente: el hook indicó que la sesión no está registrada.
- Se consultó el documento fuente compartido por el usuario: https://docs.google.com/document/d/1GJ_NpEIeTio_mQzw9cRTUq-KbCl6O7Dx/edit. Confirma las cargas registradas y un máximo de 30 saltos reactivos en M2; este límite se añadió a `cadeteLoads`. `node --test tests/*.test.mjs`: 10/10. Falta integrar el límite y el resto del modelo en las tablas y la aplicación.
- La ficha de sesión muestra un aviso condicional del máximo de 30 saltos reactivos para cadete en semanas de enero a marzo, calculado a partir del lunes mostrado. `node --test tests/*.test.mjs`: 11/11. El aviso no modifica automáticamente las dosis, que todavía son texto libre en Sheets; la integración del catálogo y el reemplazo siguen pendientes.
- `npm run build` terminó correctamente; Nuxt informó advertencias de imports duplicados y una advertencia de deprecación.
- El usuario autorizó completar el funcionamiento de la beta y proponer datos faltantes: «hace todo para que quede funcional, si falta datos inventalo siguiendo una logica coherente ya que estamos ne la beta, luego se revisaran ejercision y dosis».
- El usuario confirmó: «tenes autorizacion para reemplazar lo que sea necesario para que funciones d epunta a punta». El destino de Sheets requiere confirmar qué credencial o sesión utilizar antes de acceder a él; el reemplazo completo sigue sin prepararse ni ejecutarse.
- El usuario autorizó leer Pizarra Basquet DB con la cuenta de servicio indicada. La lectura confirmó 1 macrociclo cadete, 7 mesociclos de semanas fijas, 21 sesiones, 96 variantes, 63 bloques, 252 relaciones de ejercicios, 18 ejercicios, 4 sesiones de casa y 4 tests; hay 5 equipos, 5 temporadas, 1 revisión y 180 microciclos. Las sesiones de entrenamiento existentes duran 30 o 40 minutos y no corresponden al modelo nuevo. No se escribieron datos remotos.
- Se creó `app/shared/cadeteCatalog.ts` como borrador local de catálogo por fecha de inicio, con cuatro períodos, sesiones, variantes, bloques y ejercicios propuestos. La prueba `node --test tests/cadete-catalog.test.mjs` pasó. Aún no se integra en la lectura o escritura de Sheets; faltan sesiones de casa, tests, vacaciones y descansos, y revisar dosis por ejercicio antes de usarlo.
- Se ajustaron las dosis de ejemplo de saltos, nórdicos y gemelos para no usar indiscriminadamente la dosis de fuerza. `node --test tests/*.test.mjs`: 13/13. No se ejecutó una compilación después de añadir el catálogo aislado.
- El usuario indicó: «quiero que alimines el catalogo en sheets y comienzes de cero con el la nueva estructura, no quiero datos en local la unica fuente es sheets». La aplicación debe leer el catálogo exclusivamente de Sheets; el borrador local no es la fuente final.
- El usuario pidió: «VERIFICA DE INICIO A FIN, ELIMINA LO HEREDADO» y luego «intenta nuevamente».
- Lectura en vivo de Sheets: 1 macrociclo, 4 fases, 12 sesiones, 12 variantes, 40 bloques, 84 relaciones ejercicio-bloque, 18 ejercicios, 3 sesiones de casa y 0 tests. Se conservaron 3 entrenadores; equipos, temporadas, jugadores, membresías, revisiones y microciclos quedaron en 0.
- Se encontraron 36 registros antiguos en `exercise_images`, ligados a IDs de ejercicios reutilizados. Se borraron sus valores conservando encabezados y formato, y se eliminaron 37 imágenes locales sin referencias funcionales.
- La interfaz dejó de leer o escribir perfiles y tablas operativas en `localStorage`; limpia al iniciar las claves heredadas conocidas. El acceso se habilita solo cuando Sheets terminó de cargar. Si falla una escritura, la aplicación vuelve a leer la fuente remota y comunica el error.
- Recorrido funcional por API local contra Sheets: creó temporalmente equipo, temporada y 48 microciclos; generó «Fuerza y potencia», fase «Pretemporada», duración 25 minutos, 3 bloques y 7 elementos; eliminó los registros temporales y confirmó 0 equipos, 0 temporadas y 0 microciclos, con los 3 entrenadores preservados.
- `npm run build`: correcto (quedan advertencias preexistentes de imports duplicados y deprecación). `node --test tests/*.test.mjs`: 6/6. `git diff --check`: correcto.
- El control visual del navegador no pudo ejecutarse: el host del navegador está inaccesible. La verificación HTTP directa de `/api/sheets-db`, `/api/sheets-sync` y `/api/generate-training` sí completó el flujo.
- El hook de commit rechazó el primer intento y reportó riesgos en la escritura por separado de limpiar/escribir, guardados concurrentes, microciclos huérfanos, selección de temporada, visibilidad de errores, datos incompletos y un patrón de fecha. Se corrigió la sincronización con un único `spreadsheets.batchUpdate` validado, cola de snapshots, recuperación solo del guardado más reciente, cascada completa, selección por equipo, alertas globales, estado de plan incompleto y patrón de fecha. Se eliminaron validadores que solo servían a la persistencia local ya retirada.
- Después de esas correcciones: compilación Nuxt correcta, 6/6 pruebas, `git diff --check` correcto. El flujo temporal volvió a ejecutarse contra la nueva sincronización atómica: sesión de 25 minutos, 3 bloques, 7 elementos; limpieza verificada y 3 entrenadores preservados.
- La revisión independiente reprodujo la carrera entre una recuperación atrasada y un guardado nuevo. Tras serializar escrituras y descartar lecturas obsoletas, repitió el intercalado: las filas remotas y visibles conservaron A y B incluso después del siguiente guardado. La prueba focal pasó 1/1; el spot check del padre también pasó 1/1.
- Cierre de verificación: `node --test tests/*.test.mjs` pasó 7/7, `npm run build` terminó correctamente y `git diff --check` no encontró errores. El recorrido de API contra Sheets cubrió carga, escritura, generación y limpieza; la prueba visual quedó pendiente porque el host del navegador no estuvo disponible.
- El usuario pidió: «guarda todo el progreso en el readme» y «luego comitea y pushea todo».
- Se actualizó `README.md` con el catálogo vigente, el estado real de Sheets, la limpieza heredada, el recorrido por API, las pruebas, la limitación visual y los bloqueos. `git diff --check -- README.md` pasó.
- El intento posterior de commit volvió a ser rechazado por Guardian: informó un tipo incompatible entre `Date` y `string` en la etiqueta de semanas, un `macrocycleId` opcional que puede serializarse como `undefined`, lectura limitada a 499 filas antes de reescribir tablas completas y pérdida de errores concretos de calendario. Una revisión anterior también señaló falta de autorización de administrador en servidor y riesgos con snapshots entre clientes.
- No se hizo commit ni push. La identidad administrativa requerida por el servidor sigue sin definirse; tampoco se autorizó un destino remoto y una sesión/credencial concreta para el push.
- Risk: item 1 (se reemplazaron datos persistidos en Sheets con autorización explícita); item 3 (Sheets queda como contrato único de persistencia de catálogo y operación). El commit permanece bloqueado por hallazgos del hook; no se saltó el control.
- Engram espejo pendiente: el runtime no proporcionó una identidad de sesión registrada para escritura.
