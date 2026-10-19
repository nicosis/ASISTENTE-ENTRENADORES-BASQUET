export type Frequency = 1 | 2 | 3
export type TrainingDay = 'dia1' | 'dia2' | 'dia3'

export type Exercise = {
  id: string
  slug: string
  name: string
  focus: string
  dose: string
  description: string
}

type SessionExercise = {
  exerciseId: string
  duration: number
}

export type SessionTemplate = {
  id: string
  frequency: Frequency
  day: TrainingDay
  order: number
  name: string
  objective: string
  duration: number
  blocks: SessionExercise[]
}

export const exercises: Exercise[] = [
  { id: 'EJE001', slug: 'goblet-squat', name: 'Sentadilla goblet', focus: 'Fuerza de piernas', dose: '3 × 8', description: 'Baja con control y mantén el tronco estable.' },
  { id: 'EJE002', slug: 'rdl', name: 'Peso muerto rumano con mancuernas', focus: 'Cadena posterior', dose: '3 × 8', description: 'Cadera atrás, espalda larga y subida controlada.' },
  { id: 'EJE003', slug: 'jump-stick', name: 'Salto vertical con caída estable', focus: 'Potencia y aterrizaje', dose: '3 × 4', description: 'Salta alto y cae silencioso, con rodillas alineadas.' },
  { id: 'EJE004', slug: 'accelerate-brake', name: 'Aceleración y frenada', focus: 'Velocidad y control', dose: '4 × 10 m', description: 'Acelera fuerte, frena en dos apoyos y controla la postura.' },
  { id: 'EJE005', slug: 'side-plank', name: 'Plancha lateral', focus: 'Core lateral', dose: '2 × 20 s/lado', description: 'Mantén una línea recta entre hombro, cadera y tobillo.' },
  { id: 'EJE006', slug: 'calf-raise', name: 'Elevación de gemelo a una pierna', focus: 'Tobillo y pie', dose: '2 × 12/lado', description: 'Sube y baja despacio manteniendo el equilibrio.' },
]

// Este es el núcleo reutilizable. Una frecuencia define una semana completa;
// cada sesión declara su propósito, ejercicios y minutos exactos.
export const sessionTemplates: SessionTemplate[] = [
  { id: 'SES001', frequency: 1, day: 'dia1', order: 1, name: 'Sesión integrada', objective: 'Tocar fuerza, potencia, velocidad y prevención en una sesión.', duration: 45, blocks: [{ exerciseId: 'EJE001', duration: 10 }, { exerciseId: 'EJE003', duration: 8 }, { exerciseId: 'EJE004', duration: 10 }, { exerciseId: 'EJE005', duration: 8 }, { exerciseId: 'EJE006', duration: 9 }] },
  { id: 'SES002', frequency: 2, day: 'dia1', order: 1, name: 'Fuerza y potencia', objective: 'Construir fuerza y terminar con un estímulo de salto.', duration: 40, blocks: [{ exerciseId: 'EJE001', duration: 12 }, { exerciseId: 'EJE002', duration: 12 }, { exerciseId: 'EJE003', duration: 8 }, { exerciseId: 'EJE006', duration: 8 }] },
  { id: 'SES003', frequency: 2, day: 'dia2', order: 2, name: 'Velocidad y control', objective: 'Acelerar, frenar y reforzar el tronco.', duration: 35, blocks: [{ exerciseId: 'EJE004', duration: 15 }, { exerciseId: 'EJE005', duration: 10 }, { exerciseId: 'EJE006', duration: 10 }] },
  { id: 'SES004', frequency: 3, day: 'dia1', order: 1, name: 'Fuerza', objective: 'Trabajar la fuerza básica de tren inferior.', duration: 35, blocks: [{ exerciseId: 'EJE001', duration: 14 }, { exerciseId: 'EJE002', duration: 13 }, { exerciseId: 'EJE006', duration: 8 }] },
  { id: 'SES005', frequency: 3, day: 'dia2', order: 2, name: 'Velocidad y potencia', objective: 'Practicar aceleración, frenada y salto.', duration: 35, blocks: [{ exerciseId: 'EJE004', duration: 18 }, { exerciseId: 'EJE003', duration: 17 }] },
  { id: 'SES006', frequency: 3, day: 'dia3', order: 3, name: 'Prevención y control', objective: 'Reforzar core, tobillo y calidad de movimiento.', duration: 25, blocks: [{ exerciseId: 'EJE005', duration: 13 }, { exerciseId: 'EJE006', duration: 12 }] },
]

export function getWeeklyPlan(frequency: Frequency) {
  return sessionTemplates.filter((template) => template.frequency === frequency)
}

export function getSessionTemplate(frequency: Frequency, day: TrainingDay) {
  return getWeeklyPlan(frequency).find((template) => template.day === day)
}
