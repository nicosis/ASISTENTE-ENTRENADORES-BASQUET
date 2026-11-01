export interface ExerciseImages {
  initial: string
  final: string
}

function localImages(exerciseId: string): ExerciseImages {
  return {
    initial: `/images/exercises/${exerciseId}_initial.jpg`,
    final: `/images/exercises/${exerciseId}_final.jpg`,
  }
}

// Keep image locations in one place so local paths can later become cloud URLs.
const exerciseImages: Readonly<Record<string, ExerciseImages>> = {
  EJE0001: localImages('EJE0001'),
  EJE0002: localImages('EJE0002'),
  EJE0003: localImages('EJE0003'),
  EJE0004: localImages('EJE0004'),
  EJE0005: localImages('EJE0005'),
  EJE0006: localImages('EJE0006'),
  EJE0007: localImages('EJE0007'),
  EJE0008: localImages('EJE0008'),
  EJE0009: localImages('EJE0009'),
  EJE0010: localImages('EJE0010'),
  EJE0011: localImages('EJE0011'),
  EJE0012: localImages('EJE0012'),
  EJE0013: localImages('EJE0013'),
  EJE0014: localImages('EJE0014'),
  EJE0015: localImages('EJE0015'),
  EJE0016: localImages('EJE0016'),
  EJE0017: localImages('EJE0017'),
  EJE0018: localImages('EJE0018'),
}

export function getExerciseImages(exerciseId: string): ExerciseImages | undefined {
  return exerciseImages[exerciseId]
}
