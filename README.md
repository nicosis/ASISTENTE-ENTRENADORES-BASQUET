# Pizarra · Asistente de entrenamiento de baloncesto

Beta inicial para organizar y preparar sesiones físicas de baloncesto a partir del plan Cadete 2026-27 de Laude.

## Qué hace la beta

- Acceso local con nombre de entrenador, sin cuenta real.
- Dos equipos de demostración: Cadete A · U16 y Cadete B · U16.
- Consulta de un plan anual de 33 semanas, seis fases y períodos de pausa.
- Navegación por calendario, por semana anterior/siguiente o desde la vista de plan anual.
- Tres estímulos semanales fijos: Día 1, Día 2 y Día 3.
- Modificación de la fecha de cada sesión, consulta de semanas anteriores y marcado de entrenamiento realizado.
- Propuesta física con bloques, dosis, objetivo, motivo e imágenes de referencia.
- Guardado local de propuestas, sesiones realizadas y nombre del entrenador.
- Botón de PDF visible como funcionalidad futura; todavía no genera un archivo.

## Generación de sesiones: estado real

Al pulsar **Preparar sesión física** se llama a una ruta de servidor de Nuxt. Actualmente no utiliza una IA externa: compone una propuesta determinista según la fase y el día seleccionados, a partir de reglas definidas en el proyecto.

En la siguiente etapa, ese mismo punto de entrada incorporará IA para adaptar la propuesta al contexto del entrenador —partido, fatiga, material o disponibilidad— sin salir de los ejercicios, cargas y reglas validadas por Laude.

## Fuente de conocimiento

Las hojas de Google Drive son la fuente editable de trabajo. El estado contrastado el 12/10/2026 es:

- `07 - Planes físicos`: plan `PLF0001`, Cadete 2026-27, metodología MBSC.
- `08 - Fases físicas`: seis fases entre el 12/10/2026 y el 30/05/2027.
- `04 - Ejercicios físicos`: 69 ejercicios físicos con ficha técnica.
- `03 - Equipos`: cuatro equipos disponibles; la beta muestra de momento Cadete A y Cadete B.

No existe sincronización automática entre Google Sheets y Nuxt. Los datos revisados se trasladan manualmente al código hasta que se implemente Supabase.

## Tecnologías

| Tecnología | Uso |
| --- | --- |
| Nuxt 4 | Framework principal. |
| Vue 3 | Interfaz reactiva. |
| TypeScript | Tipado de interfaz, plan y ruta de servidor. |
| Nitro / server routes | Generación actual de la propuesta. |
| CSS personalizado | Diseño y responsive en `app/app.vue`. |
| `localStorage` | Persistencia temporal en el navegador. |
| JPG estáticos | Imágenes de ejercicios en `public/images/physical`. |
| Vercel | Destino de despliegue de la beta. |

### Tecnologías no conectadas todavía

- Tailwind CSS no está instalado: se usa CSS personalizado.
- Supabase no está conectado: aún no hay base de datos ni autenticación real.
- Google Sheets no se consulta en tiempo real.
- No hay proveedor de IA externo integrado.

## Estructura

```text
app/app.vue                                  # Interfaz de la beta
server/api/generate-training.post.ts         # Generador determinista actual
server/data/cadet-physical-plan-2026-27.ts   # Plan anual y reglas
public/images/physical/                      # Imágenes de ejercicios
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
