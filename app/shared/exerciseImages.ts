export interface ExerciseImages {
  initial: string
  final: string
}

const initialFilenames: Record<string, string> = {
  EJE0001: 'EJE0001-Movilidad_de_tobillo.jpg',
  EJE0002: 'EJE0002-Desplazamiento_lateral_defensivo.jpg',
  EJE0003: 'EJE0003-Sentadilla_búlgara.jpg',
  EJE0004: 'EJE0004-Peso_muerto_a_una_pierna.jpg',
  EJE0005: 'EJE0005-Flexiones.jpg',
  EJE0006: 'EJE0006-Salto_al_cajón.jpg',
  EJE0007: 'EJE0007-Pases_a_una_diana.jpg',
  EJE0008: 'EJE0008-Carrera.jpg',
  EJE0009: 'EJE0009-Contraataque_de_tres_calles.jpg',
  EJE0010: 'EJE0010-Uno_contra_uno_a_toda.jpg',
  EJE0011: 'EJE0011-Curl_nórdico.jpg',
  EJE0012: 'EJE0012-Elevación_de_talones_b2fdb82a.jpg',
  EJE0013: 'EJE0013-Tiro_a_canasta.jpg',
  EJE0014: 'EJE0014-Salto_de_valla_1da.jpg',
  EJE0015: 'EJE0015-Salto_lateral_Heiden.jpg',
  EJE0016: 'EJE0016-Lanzamiento_lateral_de_balón_medicinal.jpg',
  EJE0017: 'EJE0017-Paseo_del_granjero.jpg',
  EJE0018: 'EJE0018-Relevos_con_balón.jpg',
}

export function getExerciseImages(exerciseId: string): ExerciseImages | undefined {
  if (!Object.hasOwn(initialFilenames, exerciseId)) return undefined
  const filename = initialFilenames[exerciseId]
  return {
    initial: `/images/exercises/${encodeURIComponent(filename)}`,
    final: `/images/exercises/${exerciseId}-final.jpg`,
  }
}
