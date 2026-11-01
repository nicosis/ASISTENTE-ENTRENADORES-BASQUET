<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from 'vue'
import { getExerciseImages } from '~/shared/exerciseImages'

const props = defineProps<{ exerciseId: string; exerciseName: string }>()
const failedUrls = ref<string[]>([])
const selectedImage = ref<ExerciseImage | null>(null)
const selectedImageLabel = ref<string | null>(null)
const closeButton = ref<HTMLButtonElement | null>(null)

interface ExerciseImage {
  label: string
  url?: string
}

const images = computed(() => {
  const urls = getExerciseImages(props.exerciseId)
  return [
    { label: 'Posición inicial', url: urls?.initial },
    { label: 'Posición final', url: urls?.final },
  ]
})

function markUnavailable(url: string): void {
  if (!failedUrls.value.includes(url)) failedUrls.value.push(url)
}

async function openImage(image: ExerciseImage): Promise<void> {
  selectedImage.value = image
  selectedImageLabel.value = image.label
  await nextTick()
  closeButton.value?.focus()
}

function closeImage(): void {
  selectedImage.value = null
  selectedImageLabel.value = null
}

function handleKeydown(event: KeyboardEvent): void {
  if (event.key === 'Escape' && selectedImage.value) closeImage()
}

onMounted(() => window.addEventListener('keydown', handleKeydown))
onBeforeUnmount(() => window.removeEventListener('keydown', handleKeydown))
</script>

<template>
  <div class="exercise-images" :aria-label="`Imágenes de ${exerciseName}`">
    <span class="exercise-id-badge">{{ exerciseId }}</span>
    <figure v-for="image in images" :key="image.label" class="exercise-image">
      <figcaption>{{ image.label }}</figcaption>
      <button
        v-if="image.url && !failedUrls.includes(image.url)"
        type="button"
        class="exercise-image-button"
        :aria-label="`Ampliar ${image.label.toLowerCase()} de ${exerciseName}`"
        @click="openImage(image)"
      >
        <img
          :src="image.url"
          :alt="`${image.label} de ${exerciseName}`"
          loading="lazy"
          @error="markUnavailable(image.url)"
        />
      </button>
      <div v-else class="exercise-image-missing">Imagen no disponible</div>
    </figure>
  </div>

  <Teleport to="body">
    <div
      v-if="selectedImage"
      class="exercise-image-modal"
      role="dialog"
      aria-modal="true"
      :aria-label="`${exerciseId} · ${exerciseName}`"
      @click.self="closeImage"
    >
      <div class="exercise-image-modal-content">
        <button
          ref="closeButton"
          type="button"
          class="exercise-image-modal-close"
          aria-label="Cerrar imagen ampliada"
          @click="closeImage"
        >
          ×
        </button>
        <p>
          <span class="exercise-id-badge">{{ exerciseId }}</span>
          {{ exerciseName }}
        </p>
        <div class="exercise-image-modal-grid">
          <figure v-for="image in images" :key="`modal-${image.label}`" class="exercise-image-modal-figure">
            <figcaption :class="{ 'is-selected': image.label === selectedImageLabel }">
              {{ image.label }}
            </figcaption>
            <img
              v-if="image.url && !failedUrls.includes(image.url)"
              :src="image.url"
              :alt="`${image.label} de ${exerciseName}`"
            />
            <div v-else class="exercise-image-missing">Imagen no disponible</div>
          </figure>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.exercise-images {
  position: relative;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
  align-content: start;
  padding: 12px;
  background: var(--soft);
}
.exercise-id-badge {
  display: inline-flex;
  grid-column: 1 / -1;
  width: fit-content;
  border-radius: 4px;
  padding: 3px 6px;
  color: var(--ink);
  background: rgba(255, 255, 255, 0.8);
  font-size: 10px;
  font-weight: 800;
  letter-spacing: 0.04em;
}
.exercise-image { min-width: 0; margin: 0; }
.exercise-image figcaption { margin-bottom: 5px; font-size: 11px; font-weight: 700; }
.exercise-image-button {
  display: block;
  width: 100%;
  padding: 0;
  border: 0;
  border-radius: 6px;
  background: transparent;
  cursor: zoom-in;
}
.exercise-image-button:focus-visible {
  outline: 3px solid var(--accent);
  outline-offset: 3px;
}
.exercise-image img, .exercise-image-missing {
  display: block;
  width: 100%;
  aspect-ratio: 1;
  border-radius: 6px;
}
.exercise-image img { object-fit: contain; background: #fff; }
.exercise-image-missing {
  display: grid;
  place-items: center;
  padding: 8px;
  background: #fff;
  color: var(--muted);
  font-size: 11px;
  text-align: center;
}
.exercise-image-modal {
  position: fixed;
  z-index: 1000;
  inset: 0;
  display: grid;
  place-items: center;
  padding: 24px;
  background: rgba(16, 29, 22, 0.82);
}
.exercise-image-modal-content {
  position: relative;
  display: grid;
  width: min(92vw, 760px);
  max-height: 92vh;
  gap: 10px;
  padding: 18px;
  border-radius: 14px;
  background: var(--surface);
  box-shadow: 0 24px 80px rgba(0, 0, 0, 0.35);
}
.exercise-image-modal-content p {
  margin: 0;
  padding-right: 36px;
  color: var(--ink);
  font-size: 14px;
  font-weight: 700;
}
.exercise-image-modal-content img {
  width: 100%;
  max-height: calc(92vh - 90px);
  object-fit: contain;
  border-radius: 8px;
  background: #fff;
}
.exercise-image-modal-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
  min-width: 0;
}
.exercise-image-modal-figure {
  min-width: 0;
  margin: 0;
}
.exercise-image-modal-figure figcaption {
  margin-bottom: 6px;
  font-size: 12px;
  font-weight: 800;
}
.exercise-image-modal-figure figcaption.is-selected {
  color: var(--accent);
}
.exercise-image-modal-figure img,
.exercise-image-modal-figure .exercise-image-missing {
  width: 100%;
  max-height: calc(92vh - 150px);
  aspect-ratio: 1;
}
.exercise-image-modal-close {
  position: absolute;
  top: 10px;
  right: 10px;
  width: 32px;
  height: 32px;
  border: 0;
  border-radius: 50%;
  color: var(--ink);
  background: var(--soft);
  cursor: pointer;
  font-size: 24px;
  line-height: 1;
}
.exercise-image-modal-close:focus-visible {
  outline: 3px solid var(--accent);
  outline-offset: 2px;
}
@media (max-width: 640px) {
  .exercise-image-modal {
    padding: 12px;
  }
  .exercise-image-modal-content {
    width: 100%;
    max-height: 96vh;
    padding: 14px;
  }
  .exercise-image-modal-grid {
    grid-template-columns: 1fr;
    max-height: calc(96vh - 90px);
    overflow-y: auto;
  }
  .exercise-image-modal-figure img,
  .exercise-image-modal-figure .exercise-image-missing {
    max-height: none;
  }
}
</style>
