# Pizarra · Asistente de entrenamiento de baloncesto

Prototipo local para configurar equipos y generar una semana de entrenamiento físico de 1, 2 o 3 sesiones.

## Núcleo actual

- Cada temporada indica los días reales de entrenamiento y, por tanto, su frecuencia semanal.
- La frecuencia selecciona una semana reutilizable: 1 sesión integrada; 2 sesiones de fuerza/potencia y velocidad/control; o 3 sesiones de fuerza, velocidad/potencia y prevención/control.
- Cada sesión declara sus ejercicios, objetivo y minutos exactos. La suma de los bloques coincide con la duración total.
- La misma definición se usa para pintar las tarjetas del front y para generar la propuesta desde la API; no hay dos catálogos que puedan desincronizarse.
- Equipos, temporadas y observaciones se guardan temporalmente en `localStorage`.

## Google Sheets: siguiente fase

No hay integración todavía. Cuando la lógica esté validada, las tablas deberán sustituir el catálogo local de ejercicios y plantillas, manteniendo los mismos campos: frecuencia, orden, objetivo, duración, ejercicio y minutos. Así no habrá que rehacer la interfaz ni la API.

## Estructura

```text
app/app.vue                          # Interfaz
app/shared/training.ts               # Catálogo y reglas reutilizables de 1/2/3 días
server/api/generate-training.post.ts # API que compone una sesión desde esas reglas
```

## Ejecutar en local

```bash
npm install
npm run dev
```

Abrir `http://localhost:3000`.

## Próximos pasos

1. Validar plan, pausas, ejercicios y reglas con Laude.
2. Incluir la pretemporada si el plan comienza en septiembre.
3. Modelar los datos definitivos en Supabase.
4. Integrar autenticación y persistencia compartida.
5. Añadir IA limitada por la metodología y la biblioteca validada.
6. Generar el PDF de una sesión.
