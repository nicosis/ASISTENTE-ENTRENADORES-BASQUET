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
  competitiveLevel: CompetitiveLevel
  frequency: Frequency
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
  dose: string
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
    id: 'EJE_WGS',
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
    id: 'EJE_GLUTEBRIDGE',
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
    id: 'EJE_DEADBUG',
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
    id: 'EJE_BANDWALK',
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
    id: 'EJE_BOXJUMP',
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
    id: 'EJE_CHESTPASS',
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
    id: 'EJE_GOBLET',
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
    id: 'EJE_INCLINEPU',
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
    id: 'EJE_BANDROW',
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
    id: 'EJE_PLANK',
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
    id: 'EJE_CALFRAISE',
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
    id: 'EJE_HIPFLEX',
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
    id: 'EJE_FRENADA',
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
    id: 'EJE_SORTIDES',
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
    id: 'EJE_RDL',
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
    id: 'EJE_SPLITSQ',
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
    id: 'EJE_CMJ',
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
    id: 'EJE_NORDIC',
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
// TABLA 2: plans (Combinación de Categoría + Nivel Competitivo + Frecuencia)
// ============================================================================
export const plans: PlanRecord[] = [
  {
    id: 'PLAN_CAD_LIGA_3',
    name: 'Plan Anual Cadete · Liga (3 días/sem)',
    ageCategory: 'cadete',
    competitiveLevel: 'liga',
    frequency: 3,
    totalWeeks: 18,
  },
  {
    id: 'PLAN_CAD_FORM_2',
    name: 'Plan Anual Cadete · Formación (2 días/sem)',
    ageCategory: 'cadete',
    competitiveLevel: 'formacion',
    frequency: 2,
    totalWeeks: 18,
  },
  {
    id: 'PLAN_INF_LIGA_2',
    name: 'Plan Anual Infantil · Liga (2 días/sem)',
    ageCategory: 'infantil',
    competitiveLevel: 'liga',
    frequency: 2,
    totalWeeks: 18,
  },
  {
    id: 'PLAN_ALE_FORM_1',
    name: 'Plan Anual Alevín · Formación (1 día/sem)',
    ageCategory: 'alevin',
    competitiveLevel: 'formacion',
    frequency: 1,
    totalWeeks: 18,
  },
  {
    id: 'PLAN_JUV_LIGA_3',
    name: 'Plan Anual Juvenil · Liga (3 días/sem)',
    ageCategory: 'juvenil',
    competitiveLevel: 'liga',
    frequency: 3,
    totalWeeks: 18,
  },
]

// ============================================================================
// TABLA 3: plan_phases (Fases de 4-6 semanas y semanas de vacaciones)
// ============================================================================
export const planPhases: PlanPhaseRecord[] = [
  {
    id: 'FASE_01',
    planId: 'PLAN_CAD_LIGA_3',
    phaseOrder: 1,
    type: 'training',
    name: 'Fase 1 · Fundamentos',
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
    id: 'FASE_02',
    planId: 'PLAN_CAD_LIGA_3',
    phaseOrder: 2,
    type: 'training',
    name: 'Fase 2 · Fuerza Base',
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
    id: 'FASE_HOL_NADAL',
    planId: 'PLAN_CAD_LIGA_3',
    phaseOrder: 3,
    type: 'holiday',
    name: 'Receso · Trabajo en casa',
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
    id: 'FASE_03',
    planId: 'PLAN_CAD_LIGA_3',
    phaseOrder: 4,
    type: 'training',
    name: 'Fase 3 · Fuerza y Potencia',
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
]

// ============================================================================
// TABLA 4: phase_sessions (Días de entrenamiento dentro de cada fase)
// ============================================================================
export const phaseSessions: PhaseSessionRecord[] = [
  // Fase 1 (Fundamentos)
  {
    id: 'SES_F1_DIA1',
    phaseId: 'FASE_01',
    day: 'dia1',
    order: 1,
    name: 'Fuerza + Potencia (Fase 1)',
    focus: 'Patrón de sentadilla, salto al cajón y empuje',
    totalMinutes: 40,
  },
  {
    id: 'SES_F1_DIA2',
    phaseId: 'FASE_01',
    day: 'dia2',
    order: 2,
    name: 'Velocidad, COD + Fuerza (Fase 1)',
    focus: 'Aceleración, frenada en 2 tiempos y cadena posterior',
    totalMinutes: 40,
  },
  {
    id: 'SES_F1_DIA3',
    phaseId: 'FASE_01',
    day: 'dia3',
    order: 3,
    name: 'Reactividad + Prevención (Fase 1)',
    focus: 'Recepciones estables, isquiotibiales y tobillo',
    totalMinutes: 30,
  },
  // Fase 2 (Fuerza Base)
  {
    id: 'SES_F2_DIA1',
    phaseId: 'FASE_02',
    day: 'dia1',
    order: 1,
    name: 'Fuerza Unilateral + Potencia (Fase 2)',
    focus: 'Split squat, contramovimiento y core anti-rotación',
    totalMinutes: 40,
  },
  {
    id: 'SES_F2_DIA2',
    phaseId: 'FASE_02',
    day: 'dia2',
    order: 2,
    name: 'Velocidad Reactiva + Bisagra (Fase 2)',
    focus: 'Frenada + salida diagonal y peso muerto rumano',
    totalMinutes: 40,
  },
  {
    id: 'SES_F2_DIA3',
    phaseId: 'FASE_02',
    day: 'dia3',
    order: 3,
    name: 'Pliometría + Prevención (Fase 2)',
    focus: 'Saltos con contramovimiento y excéntrico de isquios',
    totalMinutes: 30,
  },
  // Fase 3 (Fuerza y Potencia)
  {
    id: 'SES_F3_DIA1',
    phaseId: 'FASE_03',
    day: 'dia1',
    order: 1,
    name: 'Contraste Fuerza + Salto (Fase 3)',
    focus: 'Transferencia de fuerza pesada a potencia vertical',
    totalMinutes: 40,
  },
  {
    id: 'SES_F3_DIA2',
    phaseId: 'FASE_03',
    day: 'dia2',
    order: 2,
    name: 'Velocidad Competitiva + Fuerza (Fase 3)',
    focus: 'Salidas reactivas, frenadas y cadena posterior pesada',
    totalMinutes: 40,
  },
  {
    id: 'SES_F3_DIA3',
    phaseId: 'FASE_03',
    day: 'dia3',
    order: 3,
    name: 'Activación Pre-partido + Prevención (Fase 3)',
    focus: 'Mínimo volumen, máxima velocidad de ejecución',
    totalMinutes: 30,
  },
]

// ============================================================================
// TABLA 5: session_blocks (Bloques de tiempo dentro de cada sesión)
// ============================================================================
export const sessionBlocks: SessionBlockRecord[] = [
  // Bloques de SES_F1_DIA1 (7 + 8 + 20 + 5 = 40 min)
  {
    id: 'BLK_F1_D1_01',
    sessionId: 'SES_F1_DIA1',
    blockOrder: 1,
    name: 'Preparación y movilidad',
    minutes: 7,
    format: '1 vuelta continua · 40" por ejercicio',
  },
  {
    id: 'BLK_F1_D1_02',
    sessionId: 'SES_F1_DIA1',
    blockOrder: 2,
    name: 'Potencia',
    minutes: 8,
    format: 'Series alternadas · 1 min de descanso completo',
  },
  {
    id: 'BLK_F1_D1_03',
    sessionId: 'SES_F1_DIA1',
    blockOrder: 3,
    name: 'Fuerza · Circuito 4 estaciones',
    minutes: 20,
    format: '3 vueltas · 45" trabajo / 30" cambio · 2 min pausa entre vueltas',
  },
  {
    id: 'BLK_F1_D1_04',
    sessionId: 'SES_F1_DIA1',
    blockOrder: 4,
    name: 'Prevención',
    minutes: 5,
    format: '2 series continuas al cierre de la sesión',
  },

  // Bloques de SES_F1_DIA2 (6 + 12 + 17 + 5 = 40 min)
  {
    id: 'BLK_F1_D2_01',
    sessionId: 'SES_F1_DIA2',
    blockOrder: 1,
    name: 'Preparación dinámica',
    minutes: 6,
    format: '1 vuelta continua · activación de cadera y miniband',
  },
  {
    id: 'BLK_F1_D2_02',
    sessionId: 'SES_F1_DIA2',
    blockOrder: 2,
    name: 'Velocidad y cambios de dirección',
    minutes: 12,
    format: 'Máxima calidad · volver caminando entre repeticiones',
  },
  {
    id: 'BLK_F1_D2_03',
    sessionId: 'SES_F1_DIA2',
    blockOrder: 3,
    name: 'Fuerza · Cadena posterior y tracción',
    minutes: 17,
    format: '3 vueltas · 40" trabajo / 25" cambio',
  },
  {
    id: 'BLK_F1_D2_04',
    sessionId: 'SES_F1_DIA2',
    blockOrder: 4,
    name: 'Prevención y tobillo',
    minutes: 5,
    format: '2 vueltas controladas',
  },

  // Bloques de SES_F1_DIA3 (6 + 10 + 14 = 30 min)
  {
    id: 'BLK_F1_D3_01',
    sessionId: 'SES_F1_DIA3',
    blockOrder: 1,
    name: 'Preparación',
    minutes: 6,
    format: '1 vuelta fluida de movilidad y core',
  },
  {
    id: 'BLK_F1_D3_02',
    sessionId: 'SES_F1_DIA3',
    blockOrder: 2,
    name: 'Pliometría y reacción',
    minutes: 10,
    format: 'Descanso completo · foco en aterrizaje silencioso',
  },
  {
    id: 'BLK_F1_D3_03',
    sessionId: 'SES_F1_DIA3',
    blockOrder: 3,
    name: 'Prevención de isquios y tobillo',
    minutes: 14,
    format: 'Trabajo en parejas para nórdico + movilidad final',
  },

  // Bloques de SES_F2_DIA1 (7 + 8 + 20 + 5 = 40 min)
  {
    id: 'BLK_F2_D1_01',
    sessionId: 'SES_F2_DIA1',
    blockOrder: 1,
    name: 'Preparación y activación',
    minutes: 7,
    format: '1 vuelta · movilidad + glúteo medio',
  },
  {
    id: 'BLK_F2_D1_02',
    sessionId: 'SES_F2_DIA1',
    blockOrder: 2,
    name: 'Potencia con contramovimiento',
    minutes: 8,
    format: 'Series alternadas · máxima intención',
  },
  {
    id: 'BLK_F2_D1_03',
    sessionId: 'SES_F2_DIA1',
    blockOrder: 3,
    name: 'Fuerza Unilateral · Circuito 4 estaciones',
    minutes: 20,
    format: '3 vueltas · 45" trabajo / 30" cambio',
  },
  {
    id: 'BLK_F2_D1_04',
    sessionId: 'SES_F2_DIA1',
    blockOrder: 4,
    name: 'Prevención',
    minutes: 5,
    format: 'Al finalizar la sesión',
  },

  // Bloques de SES_F2_DIA2 (6 + 12 + 22 = 40 min)
  {
    id: 'BLK_F2_D2_01',
    sessionId: 'SES_F2_DIA2',
    blockOrder: 1,
    name: 'Preparación',
    minutes: 6,
    format: '1 vuelta continua',
  },
  {
    id: 'BLK_F2_D2_02',
    sessionId: 'SES_F2_DIA2',
    blockOrder: 2,
    name: 'Velocidad · Frenada y re-aceleración',
    minutes: 12,
    format: 'Descanso completo entre sprints',
  },
  {
    id: 'BLK_F2_D2_03',
    sessionId: 'SES_F2_DIA2',
    blockOrder: 3,
    name: 'Fuerza · Bisagra de cadera y core',
    minutes: 22,
    format: '3 vueltas · 45" trabajo / 25" cambio',
  },

  // Bloques de SES_F2_DIA3 (6 + 10 + 14 = 30 min)
  {
    id: 'BLK_F2_D3_01',
    sessionId: 'SES_F2_DIA3',
    blockOrder: 1,
    name: 'Preparación',
    minutes: 6,
    format: '1 vuelta fluida',
  },
  {
    id: 'BLK_F2_D3_02',
    sessionId: 'SES_F2_DIA3',
    blockOrder: 2,
    name: 'Pliometría reactiva',
    minutes: 10,
    format: 'Calidad máxima en cada salto',
  },
  {
    id: 'BLK_F2_D3_03',
    sessionId: 'SES_F2_DIA3',
    blockOrder: 3,
    name: 'Prevención y tejido',
    minutes: 14,
    format: 'En parejas',
  },

  // Bloques de SES_F3_DIA1, DIA2, DIA3
  {
    id: 'BLK_F3_D1_01',
    sessionId: 'SES_F3_DIA1',
    blockOrder: 1,
    name: 'Preparación',
    minutes: 7,
    format: '1 vuelta continua',
  },
  {
    id: 'BLK_F3_D1_02',
    sessionId: 'SES_F3_DIA1',
    blockOrder: 2,
    name: 'Potencia explosiva',
    minutes: 8,
    format: 'Series alternadas',
  },
  {
    id: 'BLK_F3_D1_03',
    sessionId: 'SES_F3_DIA1',
    blockOrder: 3,
    name: 'Fuerza · Contraste 4 estaciones',
    minutes: 25,
    format: '4 vueltas · 40" trabajo / 20" cambio · carga alta',
  },
  {
    id: 'BLK_F3_D2_01',
    sessionId: 'SES_F3_DIA2',
    blockOrder: 1,
    name: 'Velocidad competitiva',
    minutes: 18,
    format: 'Salidas reactivas + frenada',
  },
  {
    id: 'BLK_F3_D2_02',
    sessionId: 'SES_F3_DIA2',
    blockOrder: 2,
    name: 'Fuerza · Cadena posterior',
    minutes: 22,
    format: '3 vueltas · 45" trabajo / 25" cambio',
  },
  {
    id: 'BLK_F3_D3_01',
    sessionId: 'SES_F3_DIA3',
    blockOrder: 1,
    name: 'Activación elástica y prevención',
    minutes: 30,
    format: 'Bajo volumen, máxima frescura para el partido',
  },
]

// ============================================================================
// TABLA 6: block_exercises (Tabla puente: qué ejercicio + qué dosis en cada bloque)
// ============================================================================
export const blockExercises: BlockExerciseRecord[] = [
  // BLK_F1_D1_01 (Preparación)
  { id: 'BE_001', blockId: 'BLK_F1_D1_01', exerciseId: 'EJE_WGS', itemOrder: 1, stationLabel: 'Movilidad 1', dose: '3 por lado' },
  { id: 'BE_002', blockId: 'BLK_F1_D1_01', exerciseId: 'EJE_GLUTEBRIDGE', itemOrder: 2, stationLabel: 'Activación 2', dose: '10 reps · 2" arriba' },
  { id: 'BE_003', blockId: 'BLK_F1_D1_01', exerciseId: 'EJE_DEADBUG', itemOrder: 3, stationLabel: 'Core 3', dose: '5 por lado' },
  { id: 'BE_004', blockId: 'BLK_F1_D1_01', exerciseId: 'EJE_BANDWALK', itemOrder: 4, stationLabel: 'Cadera 4', dose: '8 pasos por lado' },

  // BLK_F1_D1_02 (Potencia)
  { id: 'BE_005', blockId: 'BLK_F1_D1_02', exerciseId: 'EJE_BOXJUMP', itemOrder: 1, stationLabel: 'A1 · Salto', dose: '3 × 3 · cajón 30-40 cm' },
  { id: 'BE_006', blockId: 'BLK_F1_D1_02', exerciseId: 'EJE_CHESTPASS', itemOrder: 2, stationLabel: 'A2 · Lanzamiento', dose: '2 × 8 explosivos' },

  // BLK_F1_D1_03 (Fuerza · Circuito 4 estaciones)
  { id: 'BE_007', blockId: 'BLK_F1_D1_03', exerciseId: 'EJE_GOBLET', itemOrder: 1, stationLabel: 'Estación 1', dose: '8 reps · bajada 3" · 6-10 kg' },
  { id: 'BE_008', blockId: 'BLK_F1_D1_03', exerciseId: 'EJE_INCLINEPU', itemOrder: 2, stationLabel: 'Estación 2', dose: '8 reps controladas' },
  { id: 'BE_009', blockId: 'BLK_F1_D1_03', exerciseId: 'EJE_BANDROW', itemOrder: 3, stationLabel: 'Estación 3', dose: '12 reps' },
  { id: 'BE_010', blockId: 'BLK_F1_D1_03', exerciseId: 'EJE_PLANK', itemOrder: 4, stationLabel: 'Estación 4', dose: '30" isométricos' },

  // BLK_F1_D1_04 (Prevención)
  { id: 'BE_011', blockId: 'BLK_F1_D1_04', exerciseId: 'EJE_CALFRAISE', itemOrder: 1, stationLabel: 'Tobillo', dose: '2 × 10 por pierna' },
  { id: 'BE_012', blockId: 'BLK_F1_D1_04', exerciseId: 'EJE_HIPFLEX', itemOrder: 2, stationLabel: 'Cadera', dose: '30" por lado' },

  // BLK_F1_D2_01..04 (Sesión Miércoles Fase 1)
  { id: 'BE_013', blockId: 'BLK_F1_D2_01', exerciseId: 'EJE_WGS', itemOrder: 1, stationLabel: 'Movilidad', dose: '3 por lado' },
  { id: 'BE_014', blockId: 'BLK_F1_D2_01', exerciseId: 'EJE_BANDWALK', itemOrder: 2, stationLabel: 'Activación', dose: '8 pasos por lado' },
  { id: 'BE_015', blockId: 'BLK_F1_D2_02', exerciseId: 'EJE_FRENADA', itemOrder: 1, stationLabel: 'Desaceleración', dose: '4 por lado · solo frenar y aguantar 2"' },
  { id: 'BE_016', blockId: 'BLK_F1_D2_02', exerciseId: 'EJE_SORTIDES', itemOrder: 2, stationLabel: 'Aceleración', dose: '6 × 10 m · variando posición inicial' },
  { id: 'BE_017', blockId: 'BLK_F1_D2_03', exerciseId: 'EJE_GLUTEBRIDGE', itemOrder: 1, stationLabel: 'Estación 1', dose: '8 por pierna (unilateral)' },
  { id: 'BE_018', blockId: 'BLK_F1_D2_03', exerciseId: 'EJE_BANDROW', itemOrder: 2, stationLabel: 'Estación 2', dose: '10 reps con pausa 1"' },
  { id: 'BE_019', blockId: 'BLK_F1_D2_03', exerciseId: 'EJE_DEADBUG', itemOrder: 3, stationLabel: 'Estación 3', dose: '6 por lado lentos' },
  { id: 'BE_020', blockId: 'BLK_F1_D2_04', exerciseId: 'EJE_CALFRAISE', itemOrder: 1, stationLabel: 'Prevención', dose: '2 × 12 por pierna' },

  // BLK_F1_D3_01..03 (Sesión Viernes Fase 1)
  { id: 'BE_021', blockId: 'BLK_F1_D3_01', exerciseId: 'EJE_WGS', itemOrder: 1, stationLabel: 'Movilidad', dose: '3 por lado' },
  { id: 'BE_022', blockId: 'BLK_F1_D3_02', exerciseId: 'EJE_BOXJUMP', itemOrder: 1, stationLabel: 'Pliometría', dose: '3 × 3 · aterrizar y congelar 2"' },
  { id: 'BE_023', blockId: 'BLK_F1_D3_02', exerciseId: 'EJE_SORTIDES', itemOrder: 2, stationLabel: 'Reacción', dose: '4 sprints a señal visual' },
  { id: 'BE_024', blockId: 'BLK_F1_D3_03', exerciseId: 'EJE_NORDIC', itemOrder: 1, stationLabel: 'Excéntrico', dose: '2 × 3 · bajar solo hasta donde se controle' },
  { id: 'BE_025', blockId: 'BLK_F1_D3_03', exerciseId: 'EJE_HIPFLEX', itemOrder: 2, stationLabel: 'Vuelta a la calma', dose: '30" por lado' },

  // Fase 2 (SES_F2_DIA1, DIA2, DIA3) - Observa cómo reutilizamos los mismos ejercicios con otra dosis
  { id: 'BE_026', blockId: 'BLK_F2_D1_01', exerciseId: 'EJE_WGS', itemOrder: 1, stationLabel: 'Movilidad', dose: '3 por lado' },
  { id: 'BE_027', blockId: 'BLK_F2_D1_01', exerciseId: 'EJE_BANDWALK', itemOrder: 2, stationLabel: 'Glúteo medio', dose: '10 pasos por lado' },
  { id: 'BE_028', blockId: 'BLK_F2_D1_02', exerciseId: 'EJE_CMJ', itemOrder: 1, stationLabel: 'A1 · Salto CMJ', dose: '3 × 4 · aterrizar y aguantar' },
  { id: 'BE_029', blockId: 'BLK_F2_D1_02', exerciseId: 'EJE_CHESTPASS', itemOrder: 2, stationLabel: 'A2 · Potencia', dose: '3 × 6 explosivos' },
  { id: 'BE_030', blockId: 'BLK_F2_D1_03', exerciseId: 'EJE_SPLITSQ', itemOrder: 1, stationLabel: 'Estación 1', dose: '8 por pierna · mancuerna 8-12 kg' },
  { id: 'BE_031', blockId: 'BLK_F2_D1_03', exerciseId: 'EJE_INCLINEPU', itemOrder: 2, stationLabel: 'Estación 2', dose: '8-10 reps en suelo o cajón bajo' },
  { id: 'BE_032', blockId: 'BLK_F2_D1_03', exerciseId: 'EJE_BANDROW', itemOrder: 3, stationLabel: 'Estación 3', dose: '12 reps con banda media' },
  { id: 'BE_033', blockId: 'BLK_F2_D1_03', exerciseId: 'EJE_PLANK', itemOrder: 4, stationLabel: 'Estación 4', dose: '40" o con toques de hombro' },
  { id: 'BE_034', blockId: 'BLK_F2_D1_04', exerciseId: 'EJE_CALFRAISE', itemOrder: 1, stationLabel: 'Tobillo', dose: '2 × 12 por pierna' },

  { id: 'BE_035', blockId: 'BLK_F2_D2_01', exerciseId: 'EJE_GLUTEBRIDGE', itemOrder: 1, stationLabel: 'Activación', dose: '10 reps' },
  { id: 'BE_036', blockId: 'BLK_F2_D2_02', exerciseId: 'EJE_FRENADA', itemOrder: 1, stationLabel: 'COD', dose: '4 por lado · frenada + salida diagonal 5 m' },
  { id: 'BE_037', blockId: 'BLK_F2_D2_03', exerciseId: 'EJE_RDL', itemOrder: 1, stationLabel: 'Estación 1', dose: '3 × 8 reps · mancuernas medias' },
  { id: 'BE_038', blockId: 'BLK_F2_D2_03', exerciseId: 'EJE_DEADBUG', itemOrder: 2, stationLabel: 'Estación 2', dose: '8 por lado controlados' },

  { id: 'BE_039', blockId: 'BLK_F2_D3_01', exerciseId: 'EJE_WGS', itemOrder: 1, stationLabel: 'Movilidad', dose: '3 por lado' },
  { id: 'BE_040', blockId: 'BLK_F2_D3_02', exerciseId: 'EJE_CMJ', itemOrder: 1, stationLabel: 'Pliometría', dose: '3 × 4 saltos máximos' },
  { id: 'BE_041', blockId: 'BLK_F2_D3_03', exerciseId: 'EJE_NORDIC', itemOrder: 1, stationLabel: 'Prevención', dose: '2 × 4 reps excéntricas' },

  // Fase 3 (SES_F3_DIA1, DIA2, DIA3)
  { id: 'BE_042', blockId: 'BLK_F3_D1_01', exerciseId: 'EJE_WGS', itemOrder: 1, stationLabel: 'Movilidad', dose: '3 por lado' },
  { id: 'BE_043', blockId: 'BLK_F3_D1_02', exerciseId: 'EJE_BOXJUMP', itemOrder: 1, stationLabel: 'Potencia', dose: '3 × 4 · máxima altura' },
  { id: 'BE_044', blockId: 'BLK_F3_D1_03', exerciseId: 'EJE_SPLITSQ', itemOrder: 1, stationLabel: 'Estación 1 (Contraste)', dose: '5 por pierna pesado + 2 saltos verticales' },
  { id: 'BE_045', blockId: 'BLK_F3_D1_03', exerciseId: 'EJE_BANDROW', itemOrder: 2, stationLabel: 'Estación 2', dose: '10 reps explosivas' },
  { id: 'BE_046', blockId: 'BLK_F3_D2_01', exerciseId: 'EJE_SORTIDES', itemOrder: 1, stationLabel: 'Velocidad', dose: '6 × 10 m reactivos' },
  { id: 'BE_047', blockId: 'BLK_F3_D2_02', exerciseId: 'EJE_RDL', itemOrder: 1, stationLabel: 'Fuerza cadera', dose: '4 × 6 reps pesadas' },
  { id: 'BE_048', blockId: 'BLK_F3_D3_01', exerciseId: 'EJE_CMJ', itemOrder: 1, stationLabel: 'Activación', dose: '2 × 3 saltos rápidos' },
  { id: 'BE_049', blockId: 'BLK_F3_D3_01', exerciseId: 'EJE_NORDIC', itemOrder: 2, stationLabel: 'Prevención', dose: '2 × 4 reps' },
]

// ============================================================================
// TABLA 7: home_sessions (Sesiones sin material para vacaciones)
// ============================================================================
export const homeSessions: HomeSessionRecord[] = [
  {
    id: 'HOME_01',
    planId: 'PLAN_CAD_LIGA_3',
    code: 'A',
    name: 'Sesión A · Fuerza en casa',
    minutes: 25,
    format: '3 vueltas seguidas · 1 min de descanso entre vueltas',
    exerciseId: 'EJE_SPLITSQ',
    doseHoliday1: '10 por pierna · sin peso',
    doseHoliday2: '8 por pierna · con mochila con libros',
  },
  {
    id: 'HOME_02',
    planId: 'PLAN_CAD_LIGA_3',
    code: 'A',
    name: 'Sesión A · Fuerza en casa',
    minutes: 25,
    format: '3 vueltas seguidas · 1 min de descanso entre vueltas',
    exerciseId: 'EJE_INCLINEPU',
    doseHoliday1: '8-10 reps manos en sofá',
    doseHoliday2: '10-12 reps en el suelo',
  },
  {
    id: 'HOME_03',
    planId: 'PLAN_CAD_LIGA_3',
    code: 'B',
    name: 'Sesión B · Potencia y carrera',
    minutes: 25,
    format: 'Con zapatillas en suelo firme',
    exerciseId: 'EJE_CMJ',
    doseHoliday1: '3 × 4 saltos controlados',
    doseHoliday2: '3 × 5 saltos continuos',
  },
  {
    id: 'HOME_04',
    planId: 'PLAN_CAD_LIGA_3',
    code: 'C',
    name: 'Sesión C · Movilidad y prevención',
    minutes: 20,
    format: 'Fluido y respirando profundo',
    exerciseId: 'EJE_CALFRAISE',
    doseHoliday1: '3 × 12 por pierna en escalón',
    doseHoliday2: '3 × 15 por pierna en escalón',
  },
]

// ============================================================================
// TABLA 8: tests (Batería de evaluaciones físicas de la temporada)
// ============================================================================
export const tests: TestRecord[] = [
  {
    id: 'TEST_01',
    planId: 'PLAN_CAD_LIGA_3',
    testOrder: 1,
    name: 'Salto vertical (CMJ)',
    protocol: 'De lado a la pared, marcar alcance de pie y saltar con contramovimiento tocando lo más alto posible. Mejor de 3 intentos (diferencia en cm).',
    milestoneWeeks: ['Semana 1 (Octubre)', 'Semana 13 (Reentrada Enero)', 'Semana 18 (Final)'],
  },
  {
    id: 'TEST_02',
    planId: 'PLAN_CAD_LIGA_3',
    testOrder: 2,
    name: 'Sprint 20 metros',
    protocol: 'Salida de pie a 30 cm de la línea. Cronometrar desde el primer movimiento hasta cruzar los 20 m. Mejor de 2 intentos con 2 min de pausa.',
    milestoneWeeks: ['Semana 1 (Octubre)', 'Semana 13 (Reentrada Enero)', 'Semana 18 (Final)'],
  },
  {
    id: 'TEST_03',
    planId: 'PLAN_CAD_LIGA_3',
    testOrder: 3,
    name: 'Flexiones en 60 segundos',
    protocol: 'Pecho a un puño del suelo manteniendo el cuerpo en línea recta. Se cuentan solo las repeticiones técnicamente válidas.',
    milestoneWeeks: ['Semana 1 (Octubre)', 'Semana 13 (Reentrada Enero)', 'Semana 18 (Final)'],
  },
  {
    id: 'TEST_04',
    planId: 'PLAN_CAD_LIGA_3',
    testOrder: 4,
    name: 'Plancha frontal / lateral (máx 90")',
    protocol: 'Tiempo máximo manteniendo cadera alineada sin hundirse ni rotar (tope de 90 segundos).',
    milestoneWeeks: ['Semana 1 (Octubre)', 'Semana 13 (Reentrada Enero)', 'Semana 18 (Final)'],
  },
]

// ============================================================================
// CONSULTAS RELACIONALES (Simulan los JOINs que luego haremos en Sheets/Supabase)
// ============================================================================

const BASE_TEMPLATE_PLAN_ID = 'PLAN_CAD_LIGA_3'

export function resolvePlan(
  ageCategory: AgeCategory = 'cadete',
  competitiveLevel: CompetitiveLevel = 'liga',
  frequency: Frequency = 3,
): PlanRecord {
  const exact = plans.find(
    (plan) =>
      plan.ageCategory === ageCategory &&
      plan.competitiveLevel === competitiveLevel &&
      plan.frequency === frequency,
  )
  if (exact) return exact

  const categoryLabels: Record<AgeCategory, string> = {
    alevin: 'Alevín',
    infantil: 'Infantil',
    cadete: 'Cadete',
    juvenil: 'Juvenil',
  }
  const levelLabels: Record<CompetitiveLevel, string> = {
    formacion: 'Formación',
    liga: 'Liga',
  }

  return {
    id: `PLAN_${ageCategory.toUpperCase()}_${competitiveLevel.toUpperCase()}_${frequency}`,
    name: `Plan Anual ${categoryLabels[ageCategory]} · ${levelLabels[competitiveLevel]} (${frequency} ${frequency === 1 ? 'día' : 'días'}/sem)`,
    ageCategory,
    competitiveLevel,
    frequency,
    totalWeeks: 18,
  }
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
  id: 'EJE_WGS',
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
  id: 'FASE_01',
  planId: 'PLAN_CAD_LIGA_3',
  phaseOrder: 1,
  type: 'training',
  name: 'Fase 1 · Fundamentos',
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
  id: 'SES_F1_DIA1',
  phaseId: 'FASE_01',
  day: 'dia1',
  order: 1,
  name: 'Fuerza + Potencia (Fase 1)',
  focus: 'Patrón de sentadilla, salto al cajón y empuje',
  totalMinutes: 40,
}

export function getPlanPhases(planId: string): PlanPhaseRecord[] {
  const direct = planPhases.filter((phase) => phase.planId === planId)
  if (direct.length) {
    return [...direct].sort((a, b) => a.phaseOrder - b.phaseOrder)
  }
  return planPhases
    .filter((phase) => phase.planId === BASE_TEMPLATE_PLAN_ID)
    .sort((a, b) => a.phaseOrder - b.phaseOrder)
}

export function getPhaseForWeek(
  planId: string,
  weekNumber: number,
): PhaseWeekContext {
  const phases = getPlanPhases(planId)
  const clampedWeek = Math.max(1, Math.min(18, weekNumber))
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
): PhaseSessionRecord[] {
  const effectivePhaseId = phaseId === 'FASE_HOL_NADAL' ? 'FASE_02' : phaseId
  const allDays = phaseSessions
    .filter((session) => session.phaseId === effectivePhaseId)
    .sort((a, b) => a.order - b.order)

  const selected = allDays.slice(0, frequency)
  const durationDelta = competitiveLevel === 'formacion' ? -5 : 0

  return selected.map((session) => ({
    ...session,
    totalMinutes: Math.max(25, session.totalMinutes + durationDelta),
  }))
}

export function getHydratedSession(params: {
  ageCategory?: AgeCategory
  competitiveLevel?: CompetitiveLevel
  frequency: Frequency
  weekNumber?: number
  day: TrainingDay
}): HydratedPhaseSession {
  const ageCategory = params.ageCategory || 'cadete'
  const competitiveLevel = params.competitiveLevel || 'liga'
  const plan = resolvePlan(ageCategory, competitiveLevel, params.frequency)
  const { phase, weekNumber, weekInPhase, loadIndex, isDeload } =
    getPhaseForWeek(plan.id, params.weekNumber || 1)

  const weeklySessions = getWeeklySessionsForPhase(
    phase.id,
    params.frequency,
    competitiveLevel,
  )
  const session =
    weeklySessions.find((item) => item.day === params.day) ??
    weeklySessions[0] ??
    fallbackSession

  const rawBlocks = sessionBlocks
    .filter((block) => block.sessionId === session.id)
    .sort((a, b) => a.blockOrder - b.blockOrder)

  const blocks: HydratedSessionBlock[] = rawBlocks.map((block) => {
    const rawItems = blockExercises
      .filter((item) => item.blockId === block.id)
      .sort((a, b) => a.itemOrder - b.itemOrder)

    const items: HydratedBlockExercise[] = rawItems.map((item) => {
      const exercise =
        exercises.find((ex) => ex.id === item.exerciseId) ??
        exercises[0] ??
        fallbackExercise
      const adjustedDose =
        competitiveLevel === 'formacion' && isDeload
          ? `${item.dose} (descarga: 1 serie menos)`
          : item.dose

      return {
        ...item,
        dose: adjustedDose,
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
): HydratedHomeSessionRecord[] {
  const direct = homeSessions.filter((item) => item.planId === planId)
  const list = direct.length
    ? direct
    : homeSessions.filter((item) => item.planId === BASE_TEMPLATE_PLAN_ID)

  return list.map((item) => ({
    ...item,
    exercise:
      exercises.find((ex) => ex.id === item.exerciseId) ??
      exercises[0] ??
      fallbackExercise,
  }))
}

export function getPlanTests(planId: string): TestRecord[] {
  const direct = tests.filter((item) => item.planId === planId)
  return direct.length
    ? direct
    : tests.filter((item) => item.planId === BASE_TEMPLATE_PLAN_ID)
}

export function getWeeklyPlan(
  frequency: Frequency,
  weekNumber = 1,
  ageCategory: AgeCategory = 'cadete',
  competitiveLevel: CompetitiveLevel = 'liga',
): PhaseSessionRecord[] {
  const plan = resolvePlan(ageCategory, competitiveLevel, frequency)
  const { phase } = getPhaseForWeek(plan.id, weekNumber)
  return getWeeklySessionsForPhase(phase.id, frequency, competitiveLevel)
}

export function getSessionTemplate(
  frequency: Frequency,
  day: TrainingDay,
): HydratedPhaseSession {
  return getHydratedSession({ frequency, day, weekNumber: 1 })
}
