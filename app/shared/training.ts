export type Frequency = 1 | 2 | 3
export type TrainingDay = 'dia1' | 'dia2' | 'dia3'
export type AgeCategory = 'alevin' | 'infantil' | 'cadete' | 'juvenil'
export type CompetitiveLevel = 'formacion' | 'liga'
export type PhaseType = 'training' | 'holiday'

export interface ExerciseRecord {
  id: string
  slug: string
  name: string
  category: string
  focus: string
  material: string
  how: string[]
  cue: string
  errors: string[]
  easier: string
  harder: string
}

export interface PlanRecord {
  id: string
  name: string
  ageCategory: AgeCategory
  totalWeeks: number
}

export interface PlanPhaseRecord {
  id: string
  planId: string
  phaseOrder: number
  type: PhaseType
  name: string
  weeksCount: number
  weekStart: number
  weekEnd: number
  color: string
  objective: string
  loadRules: string[]
  plioRule: string
  weeklyProgressionNote: string
  weeklyLoads: number[]
}

export interface PhaseSessionRecord {
  id: string
  phaseId: string
  day: TrainingDay
  order: number
  name: string
  focus: string
  totalMinutes: number
}

export interface SessionBlockRecord {
  id: string
  sessionId: string
  blockOrder: number
  name: string
  minutes: number
  format: string
}

export interface BlockExerciseRecord {
  id: string
  blockId: string
  exerciseId: string
  itemOrder: number
  stationLabel: string
  doseFormacion: string
  doseLiga: string
}

export interface HomeSessionRecord {
  id: string
  planId: string
  code: 'A' | 'B' | 'C'
  name: string
  minutes: number
  format: string
  exerciseId: string
  doseHoliday1: string
  doseHoliday2: string
}

export interface TestRecord {
  id: string
  planId: string
  testOrder: number
  name: string
  protocol: string
  milestoneWeeks: string[]
}

export interface HydratedBlockExercise {
  id: string
  blockId: string
  exerciseId: string
  itemOrder: number
  stationLabel: string
  doseFormacion: string
  doseLiga: string
  dose: string
  exercise: ExerciseRecord
}

export interface HydratedSessionBlock {
  id: string
  sessionId: string
  blockOrder: number
  name: string
  minutes: number
  format: string
  items: HydratedBlockExercise[]
}

export interface HydratedPhaseSession {
  plan: PlanRecord
  phase: PlanPhaseRecord
  weekNumber: number
  weekInPhase: number
  loadIndex: number
  isDeload: boolean
  session: PhaseSessionRecord
  blocks: HydratedSessionBlock[]
}

// ============================================================================
// TABLA 1: exercises (Catálogo maestro de ejercicios - sin dosis ni minutos)
// ============================================================================
export const exercises: ExerciseRecord[] = [
  {
    id: 'EJE0001',
    slug: 'worlds-greatest-stretch',
    name: 'Estiramiento dinámico completo (WGS)',
    category: 'Preparación y movilidad',
    focus: 'Movilidad torácica y cadera',
    material: 'Sin material',
    how: [
      'Zancada larga hacia adelante con las manos en el suelo por dentro del pie delantero.',
      'Rodilla trasera estirada sin tocar el suelo.',
      'Gira el pecho y abre el brazo hacia el techo siguiendo la mano con la mirada.',
    ],
    cue: 'El giro nace de la espalda alta, no solo de mover el brazo.',
    errors: ['Apoyar la rodilla trasera sin control', 'Girar únicamente el brazo sin rotar el pecho'],
    easier: 'Apoyando la rodilla trasera en el suelo.',
    harder: 'Añadir pausa de 2 segundos arriba en cada repetición.',
  },
  {
    id: 'EJE0002',
    slug: 'glute-bridge',
    name: 'Puente de glúteos bilateral',
    category: 'Preparación y movilidad',
    focus: 'Activación de cadera',
    material: 'Sin material',
    how: [
      'Túmbate boca arriba con rodillas flexionadas y pies al ancho de caderas.',
      'Empuja el suelo con los talones hasta alinear hombros, cadera y rodillas.',
      'Mantén 2 segundos arriba y baja con control.',
    ],
    cue: 'Aprieta los glúteos arriba sin arquear la zona lumbar.',
    errors: ['Subir arqueando la espalda baja', 'Empujar con las puntas de los pies'],
    easier: 'Recorrido más corto sin pausa.',
    harder: 'Puente de glúteos a 1 pierna.',
  },
  {
    id: 'EJE0003',
    slug: 'dead-bug',
    name: 'Dead bug (control lumbopélvico)',
    category: 'Core',
    focus: 'Estabilidad anterior del core',
    material: 'Sin material',
    how: [
      'Boca arriba, brazos extendidos al techo y caderas y rodillas a 90°.',
      'Extiende lentamente una pierna y el brazo contrario hasta casi tocar el suelo.',
      'Vuelve al centro y alterna de lado.',
    ],
    cue: 'La zona lumbar permanece pegada al suelo todo el tiempo.',
    errors: ['Despegar la zona lumbar al bajar la pierna', 'Hacer el movimiento rápido y sin control'],
    easier: 'Mover únicamente las piernas.',
    harder: 'Sostener un balón medicinal con las manos.',
  },
  {
    id: 'EJE0004',
    slug: 'mini-band-walk',
    name: 'Pasos laterales con miniband',
    category: 'Prevención',
    focus: 'Glúteo medio y control valgo',
    material: 'Miniband',
    how: [
      'Coloca la banda en tobillos o justo por encima de las rodillas.',
      'Adopta media sentadilla con pecho alto y pies paralelos.',
      'Realiza pasos laterales cortos manteniendo tensión constante en la goma.',
    ],
    cue: 'Las rodillas empujan hacia afuera; que la goma no las cierre.',
    errors: ['Juntar los pies al dar el paso', 'Subir y bajar el tronco en cada desplazamiento'],
    easier: 'Banda por encima de las rodillas.',
    harder: 'Banda en los tobillos o en los pies.',
  },
  {
    id: 'EJE0005',
    slug: 'box-jump-stick',
    name: 'Salto al cajón con aterrizaje estable',
    category: 'Pliometría',
    focus: 'Potencia vertical y absorción',
    material: 'Cajón 30-50 cm',
    how: [
      'Frente al cajón, lleva brazos atrás en media sentadilla.',
      'Salta y aterriza suave sobre el cajón en la misma postura atlética.',
      'Congela la posición 2 segundos y baja caminando.',
    ],
    cue: 'Aterrizaje silencioso como un gato; rodillas alineadas con las puntas.',
    errors: ['Usar un cajón demasiado alto encogiendo las piernas', 'Bajar saltando hacia atrás'],
    easier: 'Salto vertical en el suelo con aterrizaje de 2 segundos.',
    harder: 'Salto desde sentado o aterrizaje a 1 pierna.',
  },
  {
    id: 'EJE0006',
    slug: 'medball-chest-pass',
    name: 'Pase de pecho explosivo con balón medicinal',
    category: 'Balón medicinal',
    focus: 'Potencia de tren superior',
    material: 'Balón medicinal 2-3 kg',
    how: [
      'Frente a la pared o compañero a 2-3 metros con el balón en el pecho.',
      'Da un paso corto al frente y lanza explosivamente.',
      'Recoge y repite con máxima intención.',
    ],
    cue: 'Empuja desde las piernas y termina con pulgares hacia abajo.',
    errors: ['Lanzar solo con los brazos', 'Arquear la espalda al empujar'],
    easier: 'Balón más ligero (2 kg) sin paso.',
    harder: 'Pase de pecho + sprint de 5 metros.',
  },
  {
    id: 'EJE0007',
    slug: 'goblet-squat',
    name: 'Sentadilla goblet',
    category: 'Fuerza de piernas',
    focus: 'Fuerza bilateral de rodilla y cadera',
    material: 'Mancuerna o kettlebell',
    how: [
      'Sujeta la mancuerna vertical pegada al pecho, pies algo más anchos que la cadera.',
      'Baja controlado hasta que los codos toquen la cara interna de las rodillas.',
      'Sube empujando el suelo con todo el pie.',
    ],
    cue: 'Pecho alto y rodillas siguiendo la dirección de los pies.',
    errors: ['Levantar los talones del suelo', 'Meter las rodillas hacia adentro al subir'],
    easier: 'Sentadilla controlada hacia un cajón.',
    harder: 'Pausa de 2 segundos abajo o mayor carga.',
  },
  {
    id: 'EJE0008',
    slug: 'incline-push-up',
    name: 'Flexiones inclinadas en cajón',
    category: 'Empuje',
    focus: 'Fuerza de empuje horizontal',
    material: 'Cajón o banco',
    how: [
      'Apoya las manos en el cajón manteniendo el cuerpo en línea recta.',
      'Baja el pecho hasta tocar el borde del cajón con codos a 45°.',
      'Empuja fuerte hasta extender los brazos.',
    ],
    cue: 'El tronco y la cadera bajan y suben en un solo bloque.',
    errors: ['Dejar caer la cadera', 'Abrir los codos a 90° a la altura de los hombros'],
    easier: 'Apoyo en cajón más alto o pared.',
    harder: 'Flexiones completas en el suelo.',
  },
  {
    id: 'EJE0009',
    slug: 'band-row',
    name: 'Remo con banda elástica',
    category: 'Tracción',
    focus: 'Fuerza de espalda alta y escápulas',
    material: 'Banda elástica anclada',
    how: [
      'Sujeta la goma anclada a la altura del pecho en postura atlética.',
      'Tira llevando las manos hacia las costillas bajas.',
      'Vuelve despacio en 2 segundos sin perder la postura.',
    ],
    cue: 'Primero junta escápulas abajo y atrás, luego flexiona los codos.',
    errors: ['Encoger los hombros hacia las orejas', 'Inclinarse hacia atrás para tirar'],
    easier: 'Dar medio paso hacia el anclaje.',
    harder: 'Remo a 1 brazo o con pausa de 2 segundos atrás.',
  },
  {
    id: 'EJE0010',
    slug: 'front-plank',
    name: 'Plancha frontal activa',
    category: 'Core',
    focus: 'Anti-extensión lumbopélvica',
    material: 'Sin material',
    how: [
      'Apoya antebrazos en el suelo con codos debajo de los hombros.',
      'Aprieta glúteos y abdomen formando una línea recta de cabeza a talones.',
      'Respira corto sin perder tensión.',
    ],
    cue: 'Mejor 20 segundos perfectos que 60 segundos con la cadera hundida.',
    errors: ['Hundir la zona lumbar', 'Subir la cadera en forma de carpa'],
    easier: 'Apoyando rodillas en el suelo.',
    harder: 'Plancha alta con toques de hombro.',
  },
  {
    id: 'EJE0011',
    slug: 'single-leg-calf-raise',
    name: 'Elevación de talón a 1 pierna',
    category: 'Prevención',
    focus: 'Fuerza de tobillo y tendón de Aquiles',
    material: 'Escalón o cajón bajo',
    how: [
      'Apoya la parte delantera del pie en el escalón y usa la pared para equilibrarte.',
      'Baja el talón en 2 segundos por debajo del nivel del escalón.',
      'Sube al máximo de puntillas y mantén 1 segundo arriba.',
    ],
    cue: 'Recorrido completo y controlado, sin rebotar abajo.',
    errors: ['Flexionar la rodilla para impulsarse', 'Hacer repeticiones rápidas y cortas'],
    easier: 'Con los 2 pies a la vez en el suelo.',
    harder: 'Sosteniendo una mancuerna en la mano del mismo lado.',
  },
  {
    id: 'EJE0012',
    slug: 'half-kneeling-hip-flexor',
    name: 'Estiramiento activo de flexor de cadera',
    category: 'Prevención',
    focus: 'Movilidad de cadera y psoas',
    material: 'Sin material',
    how: [
      'Colócate medio arrodillado con cojín bajo la rodilla trasera.',
      'Aprieta fuerte el glúteo de la pierna atrasada y avanza ligeramente la pelvis.',
      'Eleva el brazo del mismo lado de la rodilla apoyada.',
    ],
    cue: 'Si no aprietas el glúteo trasero, arqueas la espalda en vez de estirar el psoas.',
    errors: ['Arquear la espalda baja avanzando demasiado'],
    easier: 'Sin elevar el brazo.',
    harder: 'Añadir una ligera inclinación lateral del tronco.',
  },
  {
    id: 'EJE0013',
    slug: 'accelerate-brake',
    name: 'Aceleración y frenada en 2 tiempos',
    category: 'Velocidad y COD',
    focus: 'Desaceleración y control de rodilla',
    material: 'Conos',
    how: [
      'Acelera fuerte durante 5 a 7 metros.',
      'Frena en 2 apoyos (derecha-izquierda) bajando el centro de gravedad antes de la línea.',
      'Mantén la postura estable durante 2 segundos.',
    ],
    cue: 'Baja la cadera antes de llegar al cono, no frenes con las piernas rígidas.',
    errors: ['Frenar con el tronco inclinado hacia atrás', 'Colapsar la rodilla hacia adentro'],
    easier: 'Aceleración submáxima de 4 metros.',
    harder: 'Frenada en 2 tiempos + salida explosiva en diagonal 5 metros.',
  },
  {
    id: 'EJE0014',
    slug: 'sprint-starts-10m',
    name: 'Salidas de velocidad 10 metros',
    category: 'Velocidad y COD',
    focus: 'Aceleración en primeros 3 pasos',
    material: 'Conos',
    how: [
      'Inicia desde distintas posiciones (de pie, de espaldas, medio arrodillado).',
      'Acelera al máximo durante 10 metros.',
      'Regresa caminando para recuperar al 100%.',
    ],
    cue: 'Primeros 3 pasos potentes empujando el suelo hacia atrás.',
    errors: ['Levantarse erguido en el primer paso'],
    easier: 'Salida estática de pie.',
    harder: 'Salida reactiva a señal visual del entrenador.',
  },
  {
    id: 'EJE0015',
    slug: 'romanian-deadlift',
    name: 'Peso muerto rumano con mancuernas',
    category: 'Fuerza de cadera',
    focus: 'Cadena posterior e isquiotibiales',
    material: 'Mancuernas',
    how: [
      'De pie con mancuernas pegadas a los muslos y rodillas ligeramente desbloqueadas.',
      'Lleva la cadera lejos hacia atrás manteniendo la espalda neutra.',
      'Sube apretando glúteos cuando las mancuernas pasen justo debajo de las rodillas.',
    ],
    cue: 'Imagina cerrar una puerta detrás de ti con la cadera.',
    errors: ['Redondear la espalda por bajar demasiado', 'Flexionar las rodillas como una sentadilla'],
    easier: 'Puente de glúteos a 1 pierna en el suelo.',
    harder: 'Peso muerto rumano a 1 pierna.',
  },
  {
    id: 'EJE0016',
    slug: 'goblet-split-squat',
    name: 'Split squat (zancada estática) goblet',
    category: 'Fuerza de piernas',
    focus: 'Fuerza unilateral de tren inferior',
    material: 'Mancuerna',
    how: [
      'Coloca los pies en posición de zancada amplia con mancuerna al pecho.',
      'Baja en 2 segundos hasta que la rodilla trasera quede a 2 cm del suelo.',
      'Empuja con la pierna delantera sin mover los pies.',
    ],
    cue: 'La rodilla delantera apunta siempre hacia el segundo dedo del pie.',
    errors: ['Colocar un pie detrás del otro como en una cuerda floja'],
    easier: 'Con el propio peso corporal.',
    harder: 'Sentadilla búlgara con pie trasero elevado en cajón.',
  },
  {
    id: 'EJE0017',
    slug: 'countermovement-jump',
    name: 'Salto vertical con contramovimiento (CMJ)',
    category: 'Pliometría',
    focus: 'Potencia vertical reactiva',
    material: 'Sin material',
    how: [
      'Baja rápido a media sentadilla llevando los brazos atrás.',
      'Salta inmediatamente hacia arriba buscando máxima altura.',
      'Aterriza suave en postura atlética y congela 2 segundos.',
    ],
    cue: 'Bajar y subir en un solo gesto continuo y explosivo.',
    errors: ['Aterrizar con piernas rígidas', 'Juntar las rodillas en el despegue o caída'],
    easier: 'Salto vertical con pausa abajo antes de despegar.',
    harder: 'Saltos continuos encadenados.',
  },
  {
    id: 'EJE0018',
    slug: 'nordic-hamstring',
    name: 'Curl nórdico de isquiotibiales',
    category: 'Prevención',
    focus: 'Fuerza excéntrica de isquiotibiales',
    material: 'Compañero + colchoneta',
    how: [
      'De rodillas sobre colchoneta mientras un compañero sujeta fuerte los tobillos.',
      'Inclínate hacia adelante muy despacio manteniendo cadera y tronco alineados.',
      'Amortigua con las manos al final y empuja suave para volver arriba.',
    ],
    cue: 'Frena la bajada todo lo que puedas sin doblar la cadera.',
    errors: ['Sacar la cadera hacia atrás al bajar', 'Dejarse caer de golpe'],
    easier: 'Controlar solo los primeros 30° de recorrido.',
    harder: 'Bajada controlada de 4 a 5 segundos.',
  },
]

// ============================================================================
// TABLA 2: plans (Catálogo maestro por Categoría Formativa - 4 categorías base)
// ============================================================================
export const plans: PlanRecord[] = [
  {
    id: 'PLN0001',
    name: 'Plan Anual Alevín (U12)',
    ageCategory: 'alevin',
    totalWeeks: 18,
  },
  {
    id: 'PLN0002',
    name: 'Plan Anual Infantil (U14)',
    ageCategory: 'infantil',
    totalWeeks: 18,
  },
  {
    id: 'PLN0003',
    name: 'Plan Anual Cadete (U16)',
    ageCategory: 'cadete',
    totalWeeks: 18,
  },
  {
    id: 'PLN0004',
    name: 'Plan Anual Juvenil (U18)',
    ageCategory: 'juvenil',
    totalWeeks: 18,
  },
]

// ============================================================================
// TABLA 3: plan_phases (16 fases iniciales: 4 fases por cada una de las 4 categorías)
// ============================================================================
export const planPhases: PlanPhaseRecord[] = [
  // --- PLN0001: ALEVÍN (U12) ---
  {
    id: 'FAS0001',
    planId: 'PLN0001',
    phaseOrder: 1,
    type: 'training',
    name: 'Fase 1 · Coordinación y Aterrizajes (U12)',
    weeksCount: 4,
    weekStart: 1,
    weekEnd: 4,
    color: '#4f7cac',
    objective: 'Aprender a frenar, aterrizar en equilibrio y coordinar apoyos mediante juegos motores sin carga externa.',
    loadRules: ['2 series · 8-10 reps con peso corporal', 'Calidad de movimiento antes que velocidad'],
    plioRule: 'Nivel 0-1: saltos bajos bipodales congelando caída 2 segundos.',
    weeklyProgressionNote: 'S1: familiarización lúdica · S2-S4: control de rodillas y tronco en aterrizajes.',
    weeklyLoads: [3, 4, 4, 5],
  },
  {
    id: 'FAS0002',
    planId: 'PLN0001',
    phaseOrder: 2,
    type: 'training',
    name: 'Fase 2 · Autocarga y Agilidad (U12)',
    weeksCount: 6,
    weekStart: 5,
    weekEnd: 10,
    color: '#3b8f7f',
    objective: 'Consolidar sentadilla, empuje inclinado y estabilidad a 1 pierna con retos de agilidad y reacción.',
    loadRules: ['2-3 series · 8-12 reps sin peso externo', 'S6 (Semana 10): descarga lúdica'],
    plioRule: 'Multisaltos suaves de baja altura y coordinación de pies.',
    weeklyProgressionNote: 'S5-S9: progresión coordinativa · S10: semana de descarga.',
    weeklyLoads: [4, 5, 5, 6, 6, 3],
  },
  {
    id: 'FAS0003',
    planId: 'PLN0001',
    phaseOrder: 3,
    type: 'holiday',
    name: 'Receso · Retos activos en casa (U12)',
    weeksCount: 2,
    weekStart: 11,
    weekEnd: 12,
    color: '#8a93a5',
    objective: 'Mantener el hábito de movimiento con retos cortos de movilidad, equilibrio y saltos suaves en casa.',
    loadRules: ['2-3 sesiones de 15-20 min sin material'],
    plioRule: 'Saltos suaves a la comba o en línea.',
    weeklyProgressionNote: 'S11-S12: sesiones cortas en días alternos.',
    weeklyLoads: [2, 2],
  },
  {
    id: 'FAS0004',
    planId: 'PLN0001',
    phaseOrder: 4,
    type: 'training',
    name: 'Fase 3 · Velocidad de Reacción y Juegos (U12)',
    weeksCount: 6,
    weekStart: 13,
    weekEnd: 18,
    color: '#c8742f',
    objective: 'Transferir el control postural a salidas rápidas, frenadas reactivas y cambios de dirección jugados.',
    loadRules: ['2-3 series dinámicas · pausas completas en sprints'],
    plioRule: 'Saltos reactivos cortos + sprint de 5-10 metros.',
    weeklyProgressionNote: 'S13: reentrada · S14-S18: velocidad reactiva ante estímulo visual.',
    weeklyLoads: [3, 5, 5, 6, 6, 6],
  },

  // --- PLN0002: INFANTIL (U14) ---
  {
    id: 'FAS0005',
    planId: 'PLN0002',
    phaseOrder: 1,
    type: 'training',
    name: 'Fase 1 · Control Postural y Patrones (U14)',
    weeksCount: 4,
    weekStart: 1,
    weekEnd: 4,
    color: '#4f7cac',
    objective: 'Estabilizar cadera, core y tobillo durante el pico de crecimiento; dominar bisagra y sentadilla.',
    loadRules: ['2-3 series · 8-10 reps (autocarga y bandas)', 'Control excéntrico de 3 segundos'],
    plioRule: 'Nivel 1: salto y recepción silenciosa congelando 2 segundos.',
    weeklyProgressionNote: 'S1: evaluación postural y tests · S2-S4: técnica estricta en circuito.',
    weeklyLoads: [4, 4, 5, 5],
  },
  {
    id: 'FAS0006',
    planId: 'PLN0002',
    phaseOrder: 2,
    type: 'training',
    name: 'Fase 2 · Fuerza con Propio Peso y Gomas (U14)',
    weeksCount: 6,
    weekStart: 5,
    weekEnd: 10,
    color: '#3b8f7f',
    objective: 'Introducir trabajo unilateral (split squat), tracciones con banda y cargas ligeras (mancuerna liviana/balón medicinal).',
    loadRules: ['3 series · 8-10 reps · Esfuerzo 6/10', 'Semana 10: descarga a 2 series'],
    plioRule: 'Nivel 1-2: contramovimiento controlado y frenadas en 2 tiempos.',
    weeklyProgressionNote: 'S5-S9: progresión unilateral · S10: descarga para asimilar crecimiento.',
    weeklyLoads: [5, 5, 6, 6, 6, 4],
  },
  {
    id: 'FAS0007',
    planId: 'PLN0002',
    phaseOrder: 3,
    type: 'holiday',
    name: 'Receso · Trabajo autónomo en casa (U14)',
    weeksCount: 2,
    weekStart: 11,
    weekEnd: 12,
    color: '#8a93a5',
    objective: 'Cuidar movilidad de cadera/tobillo y mantener tono de core durante el receso escolar.',
    loadRules: ['3 sesiones de 20 min sin material (A, B, C)'],
    plioRule: 'Rebotes elásticos suaves.',
    weeklyProgressionNote: 'S11-S12: completar sesiones A, B y C cada semana.',
    weeklyLoads: [2, 2],
  },
  {
    id: 'FAS0008',
    planId: 'PLN0002',
    phaseOrder: 4,
    type: 'training',
    name: 'Fase 3 · Saltos, Aceleración y COD (U14)',
    weeksCount: 6,
    weekStart: 13,
    weekEnd: 18,
    color: '#c8742f',
    objective: 'Aplicar la estabilidad ganada a lanzamientos explosivos con balón medicinal, sprints y cambios de dirección.',
    loadRules: ['3 series · 6-8 reps dinámicas · Esfuerzo 6-7/10'],
    plioRule: 'Nivel 2: saltos encadenados controlados y salidas en diagonal.',
    weeklyProgressionNote: 'S13: reentrada + tests · S14-S18: potencia y velocidad en pista.',
    weeklyLoads: [4, 5, 6, 6, 7, 7],
  },

  // --- PLN0003: CADETE (U16) ---
  {
    id: 'FAS0009',
    planId: 'PLN0003',
    phaseOrder: 1,
    type: 'training',
    name: 'Fase 1 · Fundamentos (U16)',
    weeksCount: 4,
    weekStart: 1,
    weekEnd: 4,
    color: '#4f7cac',
    objective: 'Dominar patrones básicos (sentadilla, bisagra, empuje, tracción y aterrizaje) y crear base de core y tobillos.',
    loadRules: ['2-3 series · 8-10 reps', 'Bajada controlada de 3"', 'Esfuerzo 5-6/10 (4 reps en reserva)'],
    plioRule: 'Nivel 1: saltar y congelar posición 2 segundos. Sin rebote.',
    weeklyProgressionNote: 'S1: 2 series y tests iniciales · S2-S3: 3 series · S4: 3 series con ligero aumento de carga.',
    weeklyLoads: [4, 5, 5, 6],
  },
  {
    id: 'FAS0010',
    planId: 'PLN0003',
    phaseOrder: 2,
    type: 'training',
    name: 'Fase 2 · Fuerza Base (U16)',
    weeksCount: 6,
    weekStart: 5,
    weekEnd: 10,
    color: '#3b8f7f',
    objective: 'Progresar al trabajo unilateral (1 pierna), añadir carga progresiva e introducir saltos con contramovimiento.',
    loadRules: ['3 series · 6-8 reps', 'Esfuerzo 6-7/10 (2-3 reps en reserva)', 'S6 (Semana 10): descarga a 2 series'],
    plioRule: 'Nivel 2: contramovimiento y recepciones estables.',
    weeklyProgressionNote: 'S5-S6: 3 × 8 · S7-S9: 3 × 6 con más peso · S10: semana de descarga (2 series).',
    weeklyLoads: [5, 6, 6, 7, 7, 4],
  },
  {
    id: 'FAS0011',
    planId: 'PLN0003',
    phaseOrder: 3,
    type: 'holiday',
    name: 'Receso · Trabajo en casa (U16)',
    weeksCount: 2,
    weekStart: 11,
    weekEnd: 12,
    color: '#8a93a5',
    objective: 'Descanso de pista manteniendo estímulo corto de fuerza corporal, saltos y movilidad en casa.',
    loadRules: ['3 sesiones cortas de 20-25 min sin material', 'Priorizar movilidad y técnica'],
    plioRule: 'Mantenimiento elástico suave en superficie firme.',
    weeklyProgressionNote: 'S11-S12: realizar sesiones A, B y C en días alternos.',
    weeklyLoads: [2, 2],
  },
  {
    id: 'FAS0012',
    planId: 'PLN0003',
    phaseOrder: 4,
    type: 'training',
    name: 'Fase 3 · Fuerza y Potencia (U16)',
    weeksCount: 6,
    weekStart: 13,
    weekEnd: 18,
    color: '#c8742f',
    objective: 'Reentrada tras receso, repetir batería de tests y transferir la fuerza ganada a gestos explosivos de pista.',
    loadRules: ['3-4 series · 5-6 reps', 'Esfuerzo 7-8/10 (1-2 reps en reserva)', 'S13: reentrada a 2 series + tests'],
    plioRule: 'Nivel 3: contactos rápidos y contraste de fuerza + salto.',
    weeklyProgressionNote: 'S13: reentrada + tests · S14-S15: 3 × 6 · S16-S18: 4 × 5 explosivo.',
    weeklyLoads: [4, 6, 7, 7, 8, 8],
  },

  // --- PLN0004: JUVENIL (U18) ---
  {
    id: 'FAS0013',
    planId: 'PLN0004',
    phaseOrder: 1,
    type: 'training',
    name: 'Fase 1 · Capacidad de Trabajo y Tejido (U18)',
    weeksCount: 4,
    weekStart: 1,
    weekEnd: 4,
    color: '#4f7cac',
    objective: 'Construir tolerancia tendinosa (isquios, rotuliano, Aquiles), movilidad torácica y fuerza estructural tras pretemporada.',
    loadRules: ['3 series · 8 reps · Tempo 3-1-1', 'Esfuerzo 6-7/10 (3 reps en reserva)'],
    plioRule: 'Nivel 1-2: absorción de impactos unipodales y salto al cajón.',
    weeklyProgressionNote: 'S1: tests físicos U18 · S2-S4: incremento progresivo de carga externa.',
    weeklyLoads: [5, 6, 6, 7],
  },
  {
    id: 'FAS0014',
    planId: 'PLN0004',
    phaseOrder: 2,
    type: 'training',
    name: 'Fase 2 · Fuerza Máxima Relativa (U18)',
    weeksCount: 6,
    weekStart: 5,
    weekEnd: 10,
    color: '#3b8f7f',
    objective: 'Desarrollar fuerza pesada unilateral y de cadena posterior (RDL, Split Squat, Nórdico) para producir más fuerza contra el suelo.',
    loadRules: ['3-4 series · 5-6 reps pesadas', 'Esfuerzo 7-8/10', 'Semana 10: descarga activa (2 series)'],
    plioRule: 'Nivel 2: CMJ máximo y desaceleraciones agresivas.',
    weeklyProgressionNote: 'S5-S9: progresión de carga en tren inferior · S10: descarga.',
    weeklyLoads: [6, 7, 7, 8, 8, 4],
  },
  {
    id: 'FAS0015',
    planId: 'PLN0004',
    phaseOrder: 3,
    type: 'holiday',
    name: 'Receso · Mantenimiento Neuromuscular (U18)',
    weeksCount: 2,
    weekStart: 11,
    weekEnd: 12,
    color: '#8a93a5',
    objective: 'Evitar pérdida de rigidez tendinosa y movilidad durante el parón de fiestas con sesiones autónomas.',
    loadRules: ['3 sesiones de 25 min (fuerza unilateral + isométricos + movilidad)'],
    plioRule: 'Contactos elásticos de tobillo y saltos verticales.',
    weeklyProgressionNote: 'S11-S12: sesiones A, B y C con mochila lastrada.',
    weeklyLoads: [3, 3],
  },
  {
    id: 'FAS0016',
    planId: 'PLN0004',
    phaseOrder: 4,
    type: 'training',
    name: 'Fase 3 · Contraste y Potencia Competitiva (U18)',
    weeksCount: 6,
    weekStart: 13,
    weekEnd: 18,
    color: '#c8742f',
    objective: 'Máxima transferencia a velocidad de sprint, salto vertical y potencia repetida en fase decisiva de liga.',
    loadRules: ['4 series · 4-5 reps explosivas (contraste fuerza + pliometría)', 'Esfuerzo 8/10 con máxima velocidad de barra/mancuerna'],
    plioRule: 'Nivel 3: pliometría reactiva de mínimo tiempo de contacto.',
    weeklyProgressionNote: 'S13: reentrada + re-test · S14-S18: pico de potencia competitiva.',
    weeklyLoads: [5, 7, 8, 8, 9, 8],
  },
]

// ============================================================================
// TABLA 4: phase_sessions (36 sesiones: 3 días por cada fase de entrenamiento de las 4 categorías)
// ============================================================================
export const phaseSessions: PhaseSessionRecord[] = [
  // --- PLN0001: ALEVÍN (U12) · Fases FAS0001, FAS0002, FAS0004 ---
  {
    id: 'SES0001',
    phaseId: 'FAS0001',
    day: 'dia1',
    order: 1,
    name: 'Coordinación + Aterrizaje (Fase 1 · U12)',
    focus: 'Aterrizajes bipodales, sentadilla con peso corporal y equilibrio',
    totalMinutes: 30,
  },
  {
    id: 'SES0002',
    phaseId: 'FAS0001',
    day: 'dia2',
    order: 2,
    name: 'Juegos de Frenada y Desplazamiento (Fase 1 · U12)',
    focus: 'Aceleración lúdica, frenada en 2 tiempos y apoyos laterales',
    totalMinutes: 30,
  },
  {
    id: 'SES0003',
    phaseId: 'FAS0001',
    day: 'dia3',
    order: 3,
    name: 'Movilidad, Core y Tobillo (Fase 1 · U12)',
    focus: 'Control lumbopélvico básico y juegos de estabilidad unipodal',
    totalMinutes: 25,
  },
  {
    id: 'SES0004',
    phaseId: 'FAS0002',
    day: 'dia1',
    order: 1,
    name: 'Autocarga + Saltos Controlados (Fase 2 · U12)',
    focus: 'Zancadas sin peso, empuje inclinado y multisaltos bajos',
    totalMinutes: 30,
  },
  {
    id: 'SES0005',
    phaseId: 'FAS0002',
    day: 'dia2',
    order: 2,
    name: 'Agilidad y Cambios de Dirección (Fase 2 · U12)',
    focus: 'Coordinación de pies, frenada reactiva y puente de glúteos',
    totalMinutes: 30,
  },
  {
    id: 'SES0006',
    phaseId: 'FAS0002',
    day: 'dia3',
    order: 3,
    name: 'Reactividad Lúdica + Prevención (Fase 2 · U12)',
    focus: 'Rebotes suaves, fortalecimiento de tobillo y movilidad',
    totalMinutes: 25,
  },
  {
    id: 'SES0007',
    phaseId: 'FAS0004',
    day: 'dia1',
    order: 1,
    name: 'Potencia Lúdica + Autocarga (Fase 3 · U12)',
    focus: 'Saltos reactivos, lanzamientos ligeros y control postural',
    totalMinutes: 30,
  },
  {
    id: 'SES0008',
    phaseId: 'FAS0004',
    day: 'dia2',
    order: 2,
    name: 'Velocidad de Reacción y Persecución (Fase 3 · U12)',
    focus: 'Salidas ante estímulo visual y cambios de dirección jugados',
    totalMinutes: 30,
  },
  {
    id: 'SES0009',
    phaseId: 'FAS0004',
    day: 'dia3',
    order: 3,
    name: 'Activación Pre-partido + Movilidad (Fase 3 · U12)',
    focus: 'Juegos rápidos de reacción y cuidado articular',
    totalMinutes: 25,
  },

  // --- PLN0002: INFANTIL (U14) · Fases FAS0005, FAS0006, FAS0008 ---
  {
    id: 'SES0010',
    phaseId: 'FAS0005',
    day: 'dia1',
    order: 1,
    name: 'Control Postural + Patrones (Fase 1 · U14)',
    focus: 'Sentadilla goblet ligera, aterrizaje al cajón y empuje inclinado',
    totalMinutes: 35,
  },
  {
    id: 'SES0011',
    phaseId: 'FAS0005',
    day: 'dia2',
    order: 2,
    name: 'Desaceleración + Bisagra Básica (Fase 1 · U14)',
    focus: 'Frenada en 2 tiempos, salidas 10m y cadena posterior con propio peso',
    totalMinutes: 35,
  },
  {
    id: 'SES0012',
    phaseId: 'FAS0005',
    day: 'dia3',
    order: 3,
    name: 'Estabilidad de Rodilla y Tobillo (Fase 1 · U14)',
    focus: 'Miniband, recepciones unipodales y control de crecimiento',
    totalMinutes: 30,
  },
  {
    id: 'SES0013',
    phaseId: 'FAS0006',
    day: 'dia1',
    order: 1,
    name: 'Fuerza con Autocarga y Gomas (Fase 2 · U14)',
    focus: 'Split squat controlado, remo con banda y salto CMJ',
    totalMinutes: 35,
  },
  {
    id: 'SES0014',
    phaseId: 'FAS0006',
    day: 'dia2',
    order: 2,
    name: 'Velocidad + Cadena Posterior (Fase 2 · U14)',
    focus: 'Frenada + salida diagonal y bisagra con mancuernas ligeras',
    totalMinutes: 35,
  },
  {
    id: 'SES0015',
    phaseId: 'FAS0006',
    day: 'dia3',
    order: 3,
    name: 'Pliometría Controlada + Prevención (Fase 2 · U14)',
    focus: 'Saltos continuos suaves, isquiotibiales y movilidad de cadera',
    totalMinutes: 30,
  },
  {
    id: 'SES0016',
    phaseId: 'FAS0008',
    day: 'dia1',
    order: 1,
    name: 'Potencia + Fuerza Dinámica (Fase 3 · U14)',
    focus: 'Lanzamientos de balón medicinal, salto vertical y fuerza unilateral',
    totalMinutes: 35,
  },
  {
    id: 'SES0017',
    phaseId: 'FAS0008',
    day: 'dia2',
    order: 2,
    name: 'Aceleración y COD Reactivo (Fase 3 · U14)',
    focus: 'Sprints cortos competitivos, frenadas y tracción',
    totalMinutes: 35,
  },
  {
    id: 'SES0018',
    phaseId: 'FAS0008',
    day: 'dia3',
    order: 3,
    name: 'Chispa Pre-partido + Prevención (Fase 3 · U14)',
    focus: 'Activación elástica de bajo volumen y protección articular',
    totalMinutes: 25,
  },

  // --- PLN0003: CADETE (U16) · Fases FAS0009, FAS0010, FAS0012 ---
  {
    id: 'SES0019',
    phaseId: 'FAS0009',
    day: 'dia1',
    order: 1,
    name: 'Fuerza + Potencia (Fase 1 · U16)',
    focus: 'Patrón de sentadilla, salto al cajón y empuje',
    totalMinutes: 40,
  },
  {
    id: 'SES0020',
    phaseId: 'FAS0009',
    day: 'dia2',
    order: 2,
    name: 'Velocidad, COD + Fuerza (Fase 1 · U16)',
    focus: 'Aceleración, frenada en 2 tiempos y cadena posterior',
    totalMinutes: 40,
  },
  {
    id: 'SES0021',
    phaseId: 'FAS0009',
    day: 'dia3',
    order: 3,
    name: 'Reactividad + Prevención (Fase 1 · U16)',
    focus: 'Recepciones estables, isquiotibiales y tobillo',
    totalMinutes: 30,
  },
  {
    id: 'SES0022',
    phaseId: 'FAS0010',
    day: 'dia1',
    order: 1,
    name: 'Fuerza Unilateral + Potencia (Fase 2 · U16)',
    focus: 'Split squat, contramovimiento y core anti-rotación',
    totalMinutes: 40,
  },
  {
    id: 'SES0023',
    phaseId: 'FAS0010',
    day: 'dia2',
    order: 2,
    name: 'Velocidad Reactiva + Bisagra (Fase 2 · U16)',
    focus: 'Frenada + salida diagonal y peso muerto rumano',
    totalMinutes: 40,
  },
  {
    id: 'SES0024',
    phaseId: 'FAS0010',
    day: 'dia3',
    order: 3,
    name: 'Pliometría + Prevención (Fase 2 · U16)',
    focus: 'Saltos con contramovimiento y excéntrico de isquios',
    totalMinutes: 30,
  },
  {
    id: 'SES0025',
    phaseId: 'FAS0012',
    day: 'dia1',
    order: 1,
    name: 'Contraste Fuerza + Salto (Fase 3 · U16)',
    focus: 'Transferencia de fuerza pesada a potencia vertical',
    totalMinutes: 40,
  },
  {
    id: 'SES0026',
    phaseId: 'FAS0012',
    day: 'dia2',
    order: 2,
    name: 'Velocidad Competitiva + Fuerza (Fase 3 · U16)',
    focus: 'Salidas reactivas, frenadas y cadena posterior pesada',
    totalMinutes: 40,
  },
  {
    id: 'SES0027',
    phaseId: 'FAS0012',
    day: 'dia3',
    order: 3,
    name: 'Activación Pre-partido + Prevención (Fase 3 · U16)',
    focus: 'Mínimo volumen, máxima velocidad de ejecución',
    totalMinutes: 30,
  },

  // --- PLN0004: JUVENIL (U18) · Fases FAS0013, FAS0014, FAS0016 ---
  {
    id: 'SES0028',
    phaseId: 'FAS0013',
    day: 'dia1',
    order: 1,
    name: 'Fuerza Estructural + Absorción (Fase 1 · U18)',
    focus: 'Sentadilla pesada controlada, salto al cajón y empuje completo',
    totalMinutes: 45,
  },
  {
    id: 'SES0029',
    phaseId: 'FAS0013',
    day: 'dia2',
    order: 2,
    name: 'Desaceleración Intensa + Cadena Posterior (Fase 1 · U18)',
    focus: 'Frenadas de alta velocidad, RDL y tracción escapular',
    totalMinutes: 45,
  },
  {
    id: 'SES0030',
    phaseId: 'FAS0013',
    day: 'dia3',
    order: 3,
    name: 'Capacidad Tendinosa + Core (Fase 1 · U18)',
    focus: 'Nórdico asistido, Aquiles con carga y estabilidad anti-extensión',
    totalMinutes: 35,
  },
  {
    id: 'SES0031',
    phaseId: 'FAS0014',
    day: 'dia1',
    order: 1,
    name: 'Fuerza Máxima Unilateral + Potencia (Fase 2 · U18)',
    focus: 'Split squat pesado, CMJ máximo y empuje lastrado',
    totalMinutes: 45,
  },
  {
    id: 'SES0032',
    phaseId: 'FAS0014',
    day: 'dia2',
    order: 2,
    name: 'COD Agresivo + Bisagra Pesada (Fase 2 · U18)',
    focus: 'Re-aceleración tras frenada y peso muerto rumano pesado',
    totalMinutes: 45,
  },
  {
    id: 'SES0033',
    phaseId: 'FAS0014',
    day: 'dia3',
    order: 3,
    name: 'Pliometría Reactiva + Excéntrico (Fase 2 · U18)',
    focus: 'Contactos reactivos, curl nórdico y complejo de tobillo',
    totalMinutes: 35,
  },
  {
    id: 'SES0034',
    phaseId: 'FAS0016',
    day: 'dia1',
    order: 1,
    name: 'Contraste Pesado + Salto Reactivo (Fase 3 · U18)',
    focus: 'Potenciación post-activación (fuerza pesada + salto inmediato)',
    totalMinutes: 45,
  },
  {
    id: 'SES0035',
    phaseId: 'FAS0016',
    day: 'dia2',
    order: 2,
    name: 'Sprint Competitivo + Potencia Cadena Posterior (Fase 3 · U18)',
    focus: 'Salidas explosivas 10-20m y bisagra de alta velocidad',
    totalMinutes: 40,
  },
  {
    id: 'SES0036',
    phaseId: 'FAS0016',
    day: 'dia3',
    order: 3,
    name: 'Primer Paso / Activación Pre-partido (Fase 3 · U18)',
    focus: 'Chispa neural, bajo volumen y frescura competitiva',
    totalMinutes: 30,
  },
]

// ============================================================================
// TABLA 5: session_blocks (Bloques de tiempo dentro de cada sesión)
// ============================================================================
export const sessionBlocks: SessionBlockRecord[] = [
  // Bloques de SES0019 (7 + 8 + 20 + 5 = 40 min)
  {
    id: 'BLK0001',
    sessionId: 'SES0019',
    blockOrder: 1,
    name: 'Preparación y movilidad',
    minutes: 7,
    format: '1 vuelta continua · 40" por ejercicio',
  },
  {
    id: 'BLK0002',
    sessionId: 'SES0019',
    blockOrder: 2,
    name: 'Potencia',
    minutes: 8,
    format: 'Series alternadas · 1 min de descanso completo',
  },
  {
    id: 'BLK0003',
    sessionId: 'SES0019',
    blockOrder: 3,
    name: 'Fuerza · Circuito 4 estaciones',
    minutes: 20,
    format: '3 vueltas · 45" trabajo / 30" cambio · 2 min pausa entre vueltas',
  },
  {
    id: 'BLK0004',
    sessionId: 'SES0019',
    blockOrder: 4,
    name: 'Prevención',
    minutes: 5,
    format: '2 series continuas al cierre de la sesión',
  },

  // Bloques de SES0020 (6 + 12 + 17 + 5 = 40 min)
  {
    id: 'BLK0005',
    sessionId: 'SES0020',
    blockOrder: 1,
    name: 'Preparación dinámica',
    minutes: 6,
    format: '1 vuelta continua · activación de cadera y miniband',
  },
  {
    id: 'BLK0006',
    sessionId: 'SES0020',
    blockOrder: 2,
    name: 'Velocidad y cambios de dirección',
    minutes: 12,
    format: 'Máxima calidad · volver caminando entre repeticiones',
  },
  {
    id: 'BLK0007',
    sessionId: 'SES0020',
    blockOrder: 3,
    name: 'Fuerza · Cadena posterior y tracción',
    minutes: 17,
    format: '3 vueltas · 40" trabajo / 25" cambio',
  },
  {
    id: 'BLK0008',
    sessionId: 'SES0020',
    blockOrder: 4,
    name: 'Prevención y tobillo',
    minutes: 5,
    format: '2 vueltas controladas',
  },

  // Bloques de SES0021 (6 + 10 + 14 = 30 min)
  {
    id: 'BLK0009',
    sessionId: 'SES0021',
    blockOrder: 1,
    name: 'Preparación',
    minutes: 6,
    format: '1 vuelta fluida de movilidad y core',
  },
  {
    id: 'BLK0010',
    sessionId: 'SES0021',
    blockOrder: 2,
    name: 'Pliometría y reacción',
    minutes: 10,
    format: 'Descanso completo · foco en aterrizaje silencioso',
  },
  {
    id: 'BLK0011',
    sessionId: 'SES0021',
    blockOrder: 3,
    name: 'Prevención de isquios y tobillo',
    minutes: 14,
    format: 'Trabajo en parejas para nórdico + movilidad final',
  },

  // Bloques de SES0022 (7 + 8 + 20 + 5 = 40 min)
  {
    id: 'BLK0012',
    sessionId: 'SES0022',
    blockOrder: 1,
    name: 'Preparación y activación',
    minutes: 7,
    format: '1 vuelta · movilidad + glúteo medio',
  },
  {
    id: 'BLK0013',
    sessionId: 'SES0022',
    blockOrder: 2,
    name: 'Potencia con contramovimiento',
    minutes: 8,
    format: 'Series alternadas · máxima intención',
  },
  {
    id: 'BLK0014',
    sessionId: 'SES0022',
    blockOrder: 3,
    name: 'Fuerza Unilateral · Circuito 4 estaciones',
    minutes: 20,
    format: '3 vueltas · 45" trabajo / 30" cambio',
  },
  {
    id: 'BLK0015',
    sessionId: 'SES0022',
    blockOrder: 4,
    name: 'Prevención',
    minutes: 5,
    format: 'Al finalizar la sesión',
  },

  // Bloques de SES0023 (6 + 12 + 22 = 40 min)
  {
    id: 'BLK0016',
    sessionId: 'SES0023',
    blockOrder: 1,
    name: 'Preparación',
    minutes: 6,
    format: '1 vuelta continua',
  },
  {
    id: 'BLK0017',
    sessionId: 'SES0023',
    blockOrder: 2,
    name: 'Velocidad · Frenada y re-aceleración',
    minutes: 12,
    format: 'Descanso completo entre sprints',
  },
  {
    id: 'BLK0018',
    sessionId: 'SES0023',
    blockOrder: 3,
    name: 'Fuerza · Bisagra de cadera y core',
    minutes: 22,
    format: '3 vueltas · 45" trabajo / 25" cambio',
  },

  // Bloques de SES0024 (6 + 10 + 14 = 30 min)
  {
    id: 'BLK0019',
    sessionId: 'SES0024',
    blockOrder: 1,
    name: 'Preparación',
    minutes: 6,
    format: '1 vuelta fluida',
  },
  {
    id: 'BLK0020',
    sessionId: 'SES0024',
    blockOrder: 2,
    name: 'Pliometría reactiva',
    minutes: 10,
    format: 'Calidad máxima en cada salto',
  },
  {
    id: 'BLK0021',
    sessionId: 'SES0024',
    blockOrder: 3,
    name: 'Prevención y tejido',
    minutes: 14,
    format: 'En parejas',
  },

  // Bloques de SES0025, SES0026, SES0027
  {
    id: 'BLK0022',
    sessionId: 'SES0025',
    blockOrder: 1,
    name: 'Preparación',
    minutes: 7,
    format: '1 vuelta continua',
  },
  {
    id: 'BLK0023',
    sessionId: 'SES0025',
    blockOrder: 2,
    name: 'Potencia explosiva',
    minutes: 8,
    format: 'Series alternadas',
  },
  {
    id: 'BLK0024',
    sessionId: 'SES0025',
    blockOrder: 3,
    name: 'Fuerza · Contraste 4 estaciones',
    minutes: 25,
    format: '4 vueltas · 40" trabajo / 20" cambio · carga alta',
  },
  {
    id: 'BLK0025',
    sessionId: 'SES0026',
    blockOrder: 1,
    name: 'Velocidad competitiva',
    minutes: 18,
    format: 'Salidas reactivas + frenada',
  },
  {
    id: 'BLK0026',
    sessionId: 'SES0026',
    blockOrder: 2,
    name: 'Fuerza · Cadena posterior',
    minutes: 22,
    format: '3 vueltas · 45" trabajo / 25" cambio',
  },
  {
    id: 'BLK0027',
    sessionId: 'SES0027',
    blockOrder: 1,
    name: 'Activación elástica y prevención',
    minutes: 30,
    format: 'Bajo volumen, máxima frescura para el partido',
  },
]

// ============================================================================
// TABLA 6: block_exercises (Tabla puente: qué ejercicio + dosis Formación y Liga en cada bloque)
// ============================================================================
export const blockExercises: BlockExerciseRecord[] = [
  // BLK0001 (Preparación)
  { id: 'BEX0001', blockId: 'BLK0001', exerciseId: 'EJE0001', itemOrder: 1, stationLabel: 'Movilidad 1', doseFormacion: '2 por lado', doseLiga: '3 por lado' },
  { id: 'BEX0002', blockId: 'BLK0001', exerciseId: 'EJE0002', itemOrder: 2, stationLabel: 'Activación 2', doseFormacion: '8 reps · 2" arriba', doseLiga: '10 reps · 2" arriba' },
  { id: 'BEX0003', blockId: 'BLK0001', exerciseId: 'EJE0003', itemOrder: 3, stationLabel: 'Core 3', doseFormacion: '4 por lado', doseLiga: '5 por lado' },
  { id: 'BEX0004', blockId: 'BLK0001', exerciseId: 'EJE0004', itemOrder: 4, stationLabel: 'Cadera 4', doseFormacion: '6 pasos por lado', doseLiga: '8 pasos por lado' },

  // BLK0002 (Potencia)
  { id: 'BEX0005', blockId: 'BLK0002', exerciseId: 'EJE0005', itemOrder: 1, stationLabel: 'A1 · Salto', doseFormacion: '2 × 3 · cajón bajo 30 cm', doseLiga: '3 × 3 · cajón 30-40 cm' },
  { id: 'BEX0006', blockId: 'BLK0002', exerciseId: 'EJE0006', itemOrder: 2, stationLabel: 'A2 · Lanzamiento', doseFormacion: '2 × 6 explosivos (2 kg)', doseLiga: '2 × 8 explosivos (3 kg)' },

  // BLK0003 (Fuerza · Circuito 4 estaciones)
  { id: 'BEX0007', blockId: 'BLK0003', exerciseId: 'EJE0007', itemOrder: 1, stationLabel: 'Estación 1', doseFormacion: '8 reps · bajada 3" · peso corporal o 4-6 kg', doseLiga: '8 reps · bajada 3" · 6-10 kg' },
  { id: 'BEX0008', blockId: 'BLK0003', exerciseId: 'EJE0008', itemOrder: 2, stationLabel: 'Estación 2', doseFormacion: '6-8 reps en cajón alto', doseLiga: '8 reps controladas en cajón medio' },
  { id: 'BEX0009', blockId: 'BLK0003', exerciseId: 'EJE0009', itemOrder: 3, stationLabel: 'Estación 3', doseFormacion: '10 reps con banda suave', doseLiga: '12 reps con banda media' },
  { id: 'BEX0010', blockId: 'BLK0003', exerciseId: 'EJE0010', itemOrder: 4, stationLabel: 'Estación 4', doseFormacion: '20-25" isométricos', doseLiga: '30" isométricos' },

  // BLK0004 (Prevención)
  { id: 'BEX0011', blockId: 'BLK0004', exerciseId: 'EJE0011', itemOrder: 1, stationLabel: 'Tobillo', doseFormacion: '2 × 8 por pierna', doseLiga: '2 × 10 por pierna' },
  { id: 'BEX0012', blockId: 'BLK0004', exerciseId: 'EJE0012', itemOrder: 2, stationLabel: 'Cadera', doseFormacion: '25" por lado', doseLiga: '30" por lado' },

  // BLK0005..08 (Sesión Día 2 Fase 1)
  { id: 'BEX0013', blockId: 'BLK0005', exerciseId: 'EJE0001', itemOrder: 1, stationLabel: 'Movilidad', doseFormacion: '2 por lado', doseLiga: '3 por lado' },
  { id: 'BEX0014', blockId: 'BLK0005', exerciseId: 'EJE0004', itemOrder: 2, stationLabel: 'Activación', doseFormacion: '6 pasos por lado', doseLiga: '8 pasos por lado' },
  { id: 'BEX0015', blockId: 'BLK0006', exerciseId: 'EJE0013', itemOrder: 1, stationLabel: 'Desaceleración', doseFormacion: '3 por lado · frenar y aguantar 2"', doseLiga: '4 por lado · solo frenar y aguantar 2"' },
  { id: 'BEX0016', blockId: 'BLK0006', exerciseId: 'EJE0014', itemOrder: 2, stationLabel: 'Aceleración', doseFormacion: '4 × 10 m · salida estática', doseLiga: '6 × 10 m · variando posición inicial' },
  { id: 'BEX0017', blockId: 'BLK0007', exerciseId: 'EJE0002', itemOrder: 1, stationLabel: 'Estación 1', doseFormacion: '6 por pierna (unilateral)', doseLiga: '8 por pierna (unilateral)' },
  { id: 'BEX0018', blockId: 'BLK0007', exerciseId: 'EJE0009', itemOrder: 2, stationLabel: 'Estación 2', doseFormacion: '8-10 reps controladas', doseLiga: '10 reps con pausa 1"' },
  { id: 'BEX0019', blockId: 'BLK0007', exerciseId: 'EJE0003', itemOrder: 3, stationLabel: 'Estación 3', doseFormacion: '5 por lado lentos', doseLiga: '6 por lado lentos' },
  { id: 'BEX0020', blockId: 'BLK0008', exerciseId: 'EJE0011', itemOrder: 1, stationLabel: 'Prevención', doseFormacion: '2 × 10 por pierna', doseLiga: '2 × 12 por pierna' },

  // BLK0009..11 (Sesión Día 3 Fase 1)
  { id: 'BEX0021', blockId: 'BLK0009', exerciseId: 'EJE0001', itemOrder: 1, stationLabel: 'Movilidad', doseFormacion: '2 por lado', doseLiga: '3 por lado' },
  { id: 'BEX0022', blockId: 'BLK0010', exerciseId: 'EJE0005', itemOrder: 1, stationLabel: 'Pliometría', doseFormacion: '2 × 3 · aterrizar y congelar 2"', doseLiga: '3 × 3 · aterrizar y congelar 2"' },
  { id: 'BEX0023', blockId: 'BLK0010', exerciseId: 'EJE0014', itemOrder: 2, stationLabel: 'Reacción', doseFormacion: '3 sprints a señal visual', doseLiga: '4 sprints a señal visual' },
  { id: 'BEX0024', blockId: 'BLK0011', exerciseId: 'EJE0018', itemOrder: 1, stationLabel: 'Excéntrico', doseFormacion: '2 × 2 · recorrido corto controlado', doseLiga: '2 × 3 · bajar solo hasta donde se controle' },
  { id: 'BEX0025', blockId: 'BLK0011', exerciseId: 'EJE0012', itemOrder: 2, stationLabel: 'Vuelta a la calma', doseFormacion: '25" por lado', doseLiga: '30" por lado' },

  // Fase 2 (SES0022, SES0023, SES0024)
  { id: 'BEX0026', blockId: 'BLK0012', exerciseId: 'EJE0001', itemOrder: 1, stationLabel: 'Movilidad', doseFormacion: '2 por lado', doseLiga: '3 por lado' },
  { id: 'BEX0027', blockId: 'BLK0012', exerciseId: 'EJE0004', itemOrder: 2, stationLabel: 'Glúteo medio', doseFormacion: '8 pasos por lado', doseLiga: '10 pasos por lado' },
  { id: 'BEX0028', blockId: 'BLK0013', exerciseId: 'EJE0017', itemOrder: 1, stationLabel: 'A1 · Salto CMJ', doseFormacion: '2 × 4 · aterrizar y aguantar', doseLiga: '3 × 4 · aterrizar y aguantar' },
  { id: 'BEX0029', blockId: 'BLK0013', exerciseId: 'EJE0006', itemOrder: 2, stationLabel: 'A2 · Potencia', doseFormacion: '2 × 6 explosivos', doseLiga: '3 × 6 explosivos' },
  { id: 'BEX0030', blockId: 'BLK0014', exerciseId: 'EJE0016', itemOrder: 1, stationLabel: 'Estación 1', doseFormacion: '8 por pierna · peso corporal o 4-6 kg', doseLiga: '8 por pierna · mancuerna 8-12 kg' },
  { id: 'BEX0031', blockId: 'BLK0014', exerciseId: 'EJE0008', itemOrder: 2, stationLabel: 'Estación 2', doseFormacion: '8 reps en cajón medio', doseLiga: '8-10 reps en suelo o cajón bajo' },
  { id: 'BEX0032', blockId: 'BLK0014', exerciseId: 'EJE0009', itemOrder: 3, stationLabel: 'Estación 3', doseFormacion: '10 reps con banda media', doseLiga: '12 reps con banda media' },
  { id: 'BEX0033', blockId: 'BLK0014', exerciseId: 'EJE0010', itemOrder: 4, stationLabel: 'Estación 4', doseFormacion: '30" plancha activa', doseLiga: '40" o con toques de hombro' },
  { id: 'BEX0034', blockId: 'BLK0015', exerciseId: 'EJE0011', itemOrder: 1, stationLabel: 'Tobillo', doseFormacion: '2 × 10 por pierna', doseLiga: '2 × 12 por pierna' },

  { id: 'BEX0035', blockId: 'BLK0016', exerciseId: 'EJE0002', itemOrder: 1, stationLabel: 'Activación', doseFormacion: '8 reps', doseLiga: '10 reps' },
  { id: 'BEX0036', blockId: 'BLK0017', exerciseId: 'EJE0013', itemOrder: 1, stationLabel: 'COD', doseFormacion: '3 por lado · frenada + salida diagonal 5 m', doseLiga: '4 por lado · frenada + salida diagonal 5 m' },
  { id: 'BEX0037', blockId: 'BLK0018', exerciseId: 'EJE0015', itemOrder: 1, stationLabel: 'Estación 1', doseFormacion: '2-3 × 8 reps · mancuernas ligeras', doseLiga: '3 × 8 reps · mancuernas medias' },
  { id: 'BEX0038', blockId: 'BLK0018', exerciseId: 'EJE0003', itemOrder: 2, stationLabel: 'Estación 2', doseFormacion: '6 por lado controlados', doseLiga: '8 por lado controlados' },

  { id: 'BEX0039', blockId: 'BLK0019', exerciseId: 'EJE0001', itemOrder: 1, stationLabel: 'Movilidad', doseFormacion: '2 por lado', doseLiga: '3 por lado' },
  { id: 'BEX0040', blockId: 'BLK0020', exerciseId: 'EJE0017', itemOrder: 1, stationLabel: 'Pliometría', doseFormacion: '2 × 4 saltos controlados', doseLiga: '3 × 4 saltos máximos' },
  { id: 'BEX0041', blockId: 'BLK0021', exerciseId: 'EJE0018', itemOrder: 1, stationLabel: 'Prevención', doseFormacion: '2 × 3 reps excéntricas suaves', doseLiga: '2 × 4 reps excéntricas' },

  // Fase 3 (SES0025, SES0026, SES0027)
  { id: 'BEX0042', blockId: 'BLK0022', exerciseId: 'EJE0001', itemOrder: 1, stationLabel: 'Movilidad', doseFormacion: '2 por lado', doseLiga: '3 por lado' },
  { id: 'BEX0043', blockId: 'BLK0023', exerciseId: 'EJE0005', itemOrder: 1, stationLabel: 'Potencia', doseFormacion: '2 × 4 · aterrizaje estable', doseLiga: '3 × 4 · máxima altura' },
  { id: 'BEX0044', blockId: 'BLK0024', exerciseId: 'EJE0016', itemOrder: 1, stationLabel: 'Estación 1 (Contraste)', doseFormacion: '6 por pierna carga media + 2 saltos', doseLiga: '5 por pierna pesado + 2 saltos verticales' },
  { id: 'BEX0045', blockId: 'BLK0024', exerciseId: 'EJE0009', itemOrder: 2, stationLabel: 'Estación 2', doseFormacion: '8-10 reps rápidas', doseLiga: '10 reps explosivas' },
  { id: 'BEX0046', blockId: 'BLK0025', exerciseId: 'EJE0014', itemOrder: 1, stationLabel: 'Velocidad', doseFormacion: '4 × 10 m reactivos', doseLiga: '6 × 10 m reactivos' },
  { id: 'BEX0047', blockId: 'BLK0026', exerciseId: 'EJE0015', itemOrder: 1, stationLabel: 'Fuerza cadera', doseFormacion: '3 × 6 reps carga moderada', doseLiga: '4 × 6 reps pesadas' },
  { id: 'BEX0048', blockId: 'BLK0027', exerciseId: 'EJE0017', itemOrder: 1, stationLabel: 'Activación', doseFormacion: '2 × 3 saltos controlados', doseLiga: '2 × 3 saltos rápidos' },
  { id: 'BEX0049', blockId: 'BLK0027', exerciseId: 'EJE0018', itemOrder: 2, stationLabel: 'Prevención', doseFormacion: '2 × 3 reps', doseLiga: '2 × 4 reps' },
]

// ============================================================================
// TABLA 7: home_sessions (Sesiones sin material para vacaciones)
// ============================================================================
export const homeSessions: HomeSessionRecord[] = [
  {
    id: 'HOM0001',
    planId: 'PLN0003',
    code: 'A',
    name: 'Sesión A · Fuerza en casa',
    minutes: 25,
    format: '3 vueltas seguidas · 1 min de descanso entre vueltas',
    exerciseId: 'EJE0016',
    doseHoliday1: '10 por pierna · sin peso',
    doseHoliday2: '8 por pierna · con mochila con libros',
  },
  {
    id: 'HOM0002',
    planId: 'PLN0003',
    code: 'A',
    name: 'Sesión A · Fuerza en casa',
    minutes: 25,
    format: '3 vueltas seguidas · 1 min de descanso entre vueltas',
    exerciseId: 'EJE0008',
    doseHoliday1: '8-10 reps manos en sofá',
    doseHoliday2: '10-12 reps en el suelo',
  },
  {
    id: 'HOM0003',
    planId: 'PLN0003',
    code: 'B',
    name: 'Sesión B · Potencia y carrera',
    minutes: 25,
    format: 'Con zapatillas en suelo firme',
    exerciseId: 'EJE0017',
    doseHoliday1: '3 × 4 saltos controlados',
    doseHoliday2: '3 × 5 saltos continuos',
  },
  {
    id: 'HOM0004',
    planId: 'PLN0003',
    code: 'C',
    name: 'Sesión C · Movilidad y prevención',
    minutes: 20,
    format: 'Fluido y respirando profundo',
    exerciseId: 'EJE0011',
    doseHoliday1: '3 × 12 por pierna en escalón',
    doseHoliday2: '3 × 15 por pierna en escalón',
  },
]

// ============================================================================
// TABLA 8: tests (Batería de evaluaciones físicas de la temporada)
// ============================================================================
export const tests: TestRecord[] = [
  {
    id: 'TST0001',
    planId: 'PLN0003',
    testOrder: 1,
    name: 'Salto vertical (CMJ)',
    protocol: 'De lado a la pared, marcar alcance de pie y saltar con contramovimiento tocando lo más alto posible. Mejor de 3 intentos (diferencia en cm).',
    milestoneWeeks: ['Semana 1 (Octubre)', 'Semana 13 (Reentrada Enero)', 'Semana 18 (Final)'],
  },
  {
    id: 'TST0002',
    planId: 'PLN0003',
    testOrder: 2,
    name: 'Sprint 20 metros',
    protocol: 'Salida de pie a 30 cm de la línea. Cronometrar desde el primer movimiento hasta cruzar los 20 m. Mejor de 2 intentos con 2 min de pausa.',
    milestoneWeeks: ['Semana 1 (Octubre)', 'Semana 13 (Reentrada Enero)', 'Semana 18 (Final)'],
  },
  {
    id: 'TST0003',
    planId: 'PLN0003',
    testOrder: 3,
    name: 'Flexiones en 60 segundos',
    protocol: 'Pecho a un puño del suelo manteniendo el cuerpo en línea recta. Se cuentan solo las repeticiones técnicamente válidas.',
    milestoneWeeks: ['Semana 1 (Octubre)', 'Semana 13 (Reentrada Enero)', 'Semana 18 (Final)'],
  },
  {
    id: 'TST0004',
    planId: 'PLN0003',
    testOrder: 4,
    name: 'Plancha frontal / lateral (máx 90")',
    protocol: 'Tiempo máximo manteniendo cadera alineada sin hundirse ni rotar (tope de 90 segundos).',
    milestoneWeeks: ['Semana 1 (Octubre)', 'Semana 13 (Reentrada Enero)', 'Semana 18 (Final)'],
  },
]

// ============================================================================
// CONSULTAS RELACIONALES (Simulan los JOINs que luego haremos en Sheets/Supabase)
// ============================================================================

export interface TrainingCatalogTables {
  plans: PlanRecord[]
  planPhases: PlanPhaseRecord[]
  phaseSessions: PhaseSessionRecord[]
  sessionBlocks: SessionBlockRecord[]
  blockExercises: BlockExerciseRecord[]
  exercises: ExerciseRecord[]
  homeSessions: HomeSessionRecord[]
  tests: TestRecord[]
}

export const defaultTrainingCatalog: TrainingCatalogTables = {
  plans,
  planPhases,
  phaseSessions,
  sessionBlocks,
  blockExercises,
  exercises,
  homeSessions,
  tests,
}

const BASE_TEMPLATE_PLAN_ID = 'PLN0003'

export function resolvePlan(
  ageCategory: AgeCategory = 'cadete',
  catalog: TrainingCatalogTables = defaultTrainingCatalog,
): PlanRecord {
  const exact = catalog.plans.find((plan) => plan.ageCategory === ageCategory)
  if (exact) return exact
  return (
    catalog.plans.find((plan) => plan.id === BASE_TEMPLATE_PLAN_ID) ?? {
      id: BASE_TEMPLATE_PLAN_ID,
      name: 'Plan Anual Cadete (U16)',
      ageCategory: 'cadete',
      totalWeeks: 18,
    }
  )
}

export interface PhaseWeekContext {
  phase: PlanPhaseRecord
  weekNumber: number
  weekInPhase: number
  loadIndex: number
  isDeload: boolean
}

export interface HydratedHomeSessionRecord extends HomeSessionRecord {
  exercise: ExerciseRecord
}

const fallbackExercise: ExerciseRecord = {
  id: 'EJE0001',
  slug: 'worlds-greatest-stretch',
  name: 'Estiramiento dinámico completo (WGS)',
  category: 'Preparación y movilidad',
  focus: 'Movilidad torácica y cadera',
  material: 'Sin material',
  how: ['Zancada larga hacia adelante y rotación torácica.'],
  cue: 'El giro nace de la espalda alta.',
  errors: ['Girar únicamente el brazo'],
  easier: 'Apoyando la rodilla trasera.',
  harder: 'Pausa de 2 segundos arriba.',
}

const fallbackPhase: PlanPhaseRecord = {
  id: 'FAS0009',
  planId: 'PLN0003',
  phaseOrder: 1,
  type: 'training',
  name: 'Fase 1 · Fundamentos (U16)',
  weeksCount: 4,
  weekStart: 1,
  weekEnd: 4,
  color: '#4f7cac',
  objective: 'Dominar patrones básicos.',
  loadRules: ['2-3 series · 8-10 reps'],
  plioRule: 'Saltar y congelar posición 2 segundos.',
  weeklyProgressionNote: 'S1-S4 progresión básica.',
  weeklyLoads: [4, 5, 5, 6],
}

const fallbackSession: PhaseSessionRecord = {
  id: 'SES0019',
  phaseId: 'FAS0009',
  day: 'dia1',
  order: 1,
  name: 'Fuerza + Potencia (Fase 1 · U16)',
  focus: 'Patrón de sentadilla, salto al cajón y empuje',
  totalMinutes: 40,
}

export function getPlanPhases(
  planId: string,
  catalog: TrainingCatalogTables = defaultTrainingCatalog,
): PlanPhaseRecord[] {
  const direct = catalog.planPhases.filter((phase) => phase.planId === planId)
  if (direct.length) {
    return [...direct].sort((a, b) => a.phaseOrder - b.phaseOrder)
  }
  return catalog.planPhases
    .filter((phase) => phase.planId === BASE_TEMPLATE_PLAN_ID)
    .sort((a, b) => a.phaseOrder - b.phaseOrder)
}

export function getPhaseForWeek(
  planId: string,
  weekNumber: number,
  catalog: TrainingCatalogTables = defaultTrainingCatalog,
): PhaseWeekContext {
  const phases = getPlanPhases(planId, catalog)
  const plan = catalog.plans.find((item) => item.id === planId)
  const maxWeeks = plan?.totalWeeks ?? 18
  const clampedWeek = Math.max(1, Math.min(maxWeeks, weekNumber))
  const phase =
    phases.find(
      (item) => clampedWeek >= item.weekStart && clampedWeek <= item.weekEnd,
    ) ??
    phases[0] ??
    fallbackPhase
  const weekInPhase = Math.max(1, clampedWeek - phase.weekStart + 1)
  const loadIndex =
    phase.weeklyLoads[weekInPhase - 1] ?? phase.weeklyLoads[0] ?? 5
  const isDeload =
    phase.type === 'training' &&
    weekInPhase === phase.weeksCount &&
    loadIndex <= 4
  return {
    phase,
    weekNumber: clampedWeek,
    weekInPhase,
    loadIndex,
    isDeload,
  }
}

export function getWeeklySessionsForPhase(
  phaseId: string,
  frequency: Frequency,
  competitiveLevel: CompetitiveLevel = 'liga',
  catalog: TrainingCatalogTables = defaultTrainingCatalog,
): PhaseSessionRecord[] {
  const direct = catalog.phaseSessions
    .filter((session) => session.phaseId === phaseId)
    .sort((a, b) => a.order - b.order)

  let allDays = direct
  if (!allDays.length) {
    const phase = catalog.planPhases.find((item) => item.id === phaseId)
    const samePlanPhase2 = phase
      ? catalog.planPhases.find(
          (item) => item.planId === phase.planId && item.phaseOrder === 2,
        )
      : undefined
    const fallbackPhaseId =
      samePlanPhase2?.id ??
      (phase?.phaseOrder === 1
        ? 'FAS0009'
        : phase?.phaseOrder === 4
          ? 'FAS0012'
          : 'FAS0010')
    allDays = catalog.phaseSessions
      .filter((session) => session.phaseId === fallbackPhaseId)
      .sort((a, b) => a.order - b.order)
  }

  return allDays.slice(0, frequency)
}

export function getHydratedSession(
  params: {
    ageCategory?: AgeCategory
    competitiveLevel?: CompetitiveLevel
    frequency: Frequency
    weekNumber?: number
    day: TrainingDay
  },
  catalog: TrainingCatalogTables = defaultTrainingCatalog,
): HydratedPhaseSession {
  const ageCategory = params.ageCategory || 'cadete'
  const competitiveLevel = params.competitiveLevel || 'liga'
  const plan = resolvePlan(ageCategory, catalog)
  const { phase, weekNumber, weekInPhase, loadIndex, isDeload } =
    getPhaseForWeek(plan.id, params.weekNumber || 1, catalog)

  const weeklySessions = getWeeklySessionsForPhase(
    phase.id,
    params.frequency,
    competitiveLevel,
    catalog,
  )
  const session =
    weeklySessions.find((item) => item.day === params.day) ??
    weeklySessions[0] ??
    fallbackSession

  const directBlocks = catalog.sessionBlocks
    .filter((block) => block.sessionId === session.id)
    .sort((a, b) => a.blockOrder - b.blockOrder)

  let rawBlocks = directBlocks
  if (!rawBlocks.length) {
    const templatePhaseId =
      phase.phaseOrder === 1
        ? 'FAS0009'
        : phase.phaseOrder === 4
          ? 'FAS0012'
          : 'FAS0010'
    const templateSession =
      catalog.phaseSessions.find(
        (item) => item.phaseId === templatePhaseId && item.day === session.day,
      ) ?? fallbackSession
    rawBlocks = catalog.sessionBlocks
      .filter((block) => block.sessionId === templateSession.id)
      .sort((a, b) => a.blockOrder - b.blockOrder)
  }

  const blocks: HydratedSessionBlock[] = rawBlocks.map((block) => {
    const rawItems = catalog.blockExercises
      .filter((item) => item.blockId === block.id)
      .sort((a, b) => a.itemOrder - b.itemOrder)

    const items: HydratedBlockExercise[] = rawItems.map((item) => {
      const exercise =
        catalog.exercises.find((ex) => ex.id === item.exerciseId) ??
        catalog.exercises[0] ??
        fallbackExercise
      const baseDose =
        competitiveLevel === 'formacion' ? item.doseFormacion : item.doseLiga

      return {
        ...item,
        dose: baseDose,
        exercise,
      }
    })

    return {
      ...block,
      items,
    }
  })

  return {
    plan,
    phase,
    weekNumber,
    weekInPhase,
    loadIndex,
    isDeload,
    session,
    blocks,
  }
}

export function getPlanHomeSessions(
  planId: string,
  catalog: TrainingCatalogTables = defaultTrainingCatalog,
): HydratedHomeSessionRecord[] {
  const direct = catalog.homeSessions.filter((item) => item.planId === planId)
  const list = direct.length
    ? direct
    : catalog.homeSessions.filter(
        (item) => item.planId === BASE_TEMPLATE_PLAN_ID,
      )

  return list.map((item) => ({
    ...item,
    exercise:
      catalog.exercises.find((ex) => ex.id === item.exerciseId) ??
      catalog.exercises[0] ??
      fallbackExercise,
  }))
}

export function getPlanTests(
  planId: string,
  catalog: TrainingCatalogTables = defaultTrainingCatalog,
): TestRecord[] {
  const direct = catalog.tests.filter((item) => item.planId === planId)
  return direct.length
    ? direct
    : catalog.tests.filter((item) => item.planId === BASE_TEMPLATE_PLAN_ID)
}

export function getWeeklyPlan(
  frequency: Frequency,
  weekNumber = 1,
  ageCategory: AgeCategory = 'cadete',
  competitiveLevel: CompetitiveLevel = 'liga',
  catalog: TrainingCatalogTables = defaultTrainingCatalog,
): PhaseSessionRecord[] {
  const plan = resolvePlan(ageCategory, catalog)
  const { phase } = getPhaseForWeek(plan.id, weekNumber, catalog)
  return getWeeklySessionsForPhase(
    phase.id,
    frequency,
    competitiveLevel,
    catalog,
  )
}

export function getSessionTemplate(
  frequency: Frequency,
  day: TrainingDay,
  catalog: TrainingCatalogTables = defaultTrainingCatalog,
): HydratedPhaseSession {
  return getHydratedSession({ frequency, day, weekNumber: 1 }, catalog)
}
