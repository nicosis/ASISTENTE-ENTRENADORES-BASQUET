export interface ExerciseImages {
  initial: string
  final: string
}

// Temporary: every exercise uses the placeholder until the real images are rebuilt.
export const EXERCISE_IMAGE_PLACEHOLDER_URL = '/images/exercises/imagen-base.jpg'

export const exerciseImagesInConstruction: ExerciseImages = {
  initial: EXERCISE_IMAGE_PLACEHOLDER_URL,
  final: EXERCISE_IMAGE_PLACEHOLDER_URL,
}
