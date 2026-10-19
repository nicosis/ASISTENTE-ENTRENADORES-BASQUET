# Reglas de Revisión de Código

## Arquitectura y Vue / Nuxt 3

- Utilizar exclusivamente Composition API con `<script setup lang="ts">`.
- Extraer lógica compleja o reutilizable a Composables (`use*.ts`).
- Declarar tipos e interfaces explícitas; evitar el uso de tipo `any`.
- Comprobar el manejo de errores en llamadas asíncronas y operaciones de base de datos.

## Calidad y Estilo

- Código limpio, legible y modular.
- Variables y funciones en `camelCase`, componentes en `PascalCase`.
- Eliminar logs de depuración (`console.log`) innecesarios antes de enviar a stage.
