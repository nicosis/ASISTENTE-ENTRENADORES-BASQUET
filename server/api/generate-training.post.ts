import { cadetPhysicalPlan } from '../data/cadet-physical-plan-2026-27'

type TrainingDay = 'dia1' | 'dia2' | 'dia3'
type Block = { order: number; phase: string; exerciseId: string; exerciseSlug: string; title: string; duration: number; objective: string; description: string; why: string }

const dayDetails: Record<TrainingDay, { label: string; duration: number }> = {
  dia1: { label: 'Día 1 · fuerza y potencia', duration: 40 },
  dia2: { label: 'Día 2 · velocidad, cambios de dirección y fuerza', duration: 40 },
  dia3: { label: 'Día 3 · reactividad y prevención', duration: 30 },
}

const phaseFocus: Record<string, Record<TrainingDay, Array<[string, string, string, string]>>> = {
  FIS0001: {
    dia1: [['boxjump', 'Salto al cajón con parada', 'Aterrizaje y potencia', '3 × 3 · cajón de 30-40 cm'], ['goblet', 'Sentadilla goblet', 'Fuerza básica de piernas', 'Circuito de 4 estaciones · 3 vueltas'], ['calfraise', 'Elevación de talón a una pierna', 'Prevención de tobillo y pantorrilla', '2 × 10 por pierna']],
    dia2: [['frenada', 'Frenada en 2 tiempos + salida', 'Aceleración y frenada controlada', '4 por lado · detenerse 2 segundos'], ['slbridge', 'Puente de glúteos a una pierna', 'Fuerza de cadera', 'Circuito de 4 estaciones · 3 vueltas'], ['pallof', 'Pallof press', 'Core y control antirotación', '2 vueltas · 8 por lado']],
    dia3: [['broadjump', 'Salto horizontal con parada', 'Pliometría con aterrizaje seguro', '3 × 3 · detenerse 2 segundos'], ['slam', 'Lanzamiento al suelo', 'Potencia con balón medicinal', '2 × 6'], ['nordic', 'Nórdico de isquiotibiales', 'Prevención posterior', '2 × 3 · bajar bajo control']],
  },
  FIS0002: {
    dia1: [['cmj', 'Salto vertical con contramovimiento', 'Potencia vertical y aterrizaje', '3 × 4'], ['splitsq', 'Split squat goblet', 'Fuerza unilateral', '3 vueltas · 8 por pierna'], ['calfraise', 'Elevación de talón a una pierna', 'Prevención de tobillo y pantorrilla', '2 × 12 por pierna']],
    dia2: [['proagility', '5-10-5', 'Cambio de dirección', '4 repeticiones · 2 por lado'], ['rdl', 'Peso muerto rumano con mancuernas', 'Bisagra de cadera', '3 vueltas · 8 repeticiones'], ['sideplank', 'Plancha lateral', 'Core lateral', '2 vueltas · 6 elevaciones por lado']],
    dia3: [['hopstick', 'Salto a una pierna con parada', 'Control unilateral', '2 × 3 por pierna'], ['slam', 'Lanzamiento al suelo', 'Potencia con balón medicinal', '2 × 8'], ['tibialis', 'Tibial en pared', 'Prevención de la pierna', '2 × 15']],
  },
  FIS0003: {
    dia1: [['pogo', 'Pogos', 'Reactividad de tobillo', '3 × 10'], ['rfess', 'Sentadilla búlgara', 'Fuerza unilateral y contraste', '4 vueltas · 5 por pierna + 2 saltos'], ['calfraise', 'Elevación de talón a una pierna', 'Prevención de tobillo y pantorrilla', '2 × 10 por pierna']],
    dia2: [['mirall', 'Espejo 1 contra 1', 'Velocidad reactiva', '6 × 6 segundos'], ['slrdl', 'Peso muerto a una pierna', 'Bisagra unilateral', '3 vueltas · 6 por pierna'], ['copen', 'Plancha Copenhagen', 'Prevención de aductores', '2 vueltas · 15 segundos por lado']],
    dia3: [['contbroad', 'Saltos horizontales encadenados', 'Pliometría reactiva', '3 × 3 saltos'], ['rotslam', 'Slam rotacional', 'Potencia rotacional', '2 × 5 por lado'], ['tibialis', 'Tibial en pared', 'Prevención de la pierna', '2 × 15']],
  },
  FIS0004: {
    dia1: [['depthjump', 'Salto reactivo desde cajón', 'Potencia reactiva', '3 × 3 · cajón de 30 cm'], ['stepup', 'Subida al cajón con mancuernas', 'Fuerza unilateral', '3 vueltas · 5 por pierna'], ['calfraise', 'Elevación de talón a una pierna', 'Prevención de tobillo y pantorrilla', '2 × 10 por pierna']],
    dia2: [['ttest', 'T-test adaptado', 'Cambios de dirección reactivos', '3 series · a señal'], ['slrdl', 'Peso muerto a una pierna', 'Bisagra unilateral', '3 vueltas · 5 por pierna'], ['sideplank', 'Plancha lateral', 'Core lateral', '2 vueltas · 8 elevaciones por lado']],
    dia3: [['snapdown', 'Snap down + salto', 'Reactividad y frenada', '3 × 3'], ['overback', 'Lanzamiento por encima de la cabeza', 'Potencia con balón medicinal', '3 × 3'], ['nordic', 'Nórdico de isquiotibiales', 'Prevención posterior', '3 × 5']],
  },
  FIS0005: {
    dia1: [['depthjump', 'Salto reactivo desde cajón', 'Transferencia de potencia', '3 × 3'], ['rfess', 'Sentadilla búlgara', 'Fuerza unilateral y contraste', '3 vueltas · 4 por pierna + 2 saltos'], ['calfraise', 'Elevación de talón a una pierna', 'Prevención de tobillo y pantorrilla', '2 × 10 por pierna']],
    dia2: [['rsa', 'Sprints repetidos de 20 m', 'Velocidad específica', '6 × 20 m'], ['slrdl', 'Peso muerto a una pierna', 'Fuerza unilateral', '3 vueltas · 4 por pierna'], ['copen', 'Plancha Copenhagen', 'Prevención de aductores', '2 vueltas · 20 segundos por lado']],
    dia3: [['latbound', 'Saltos laterales continuos', 'Reactividad lateral', '3 × 4'], ['scoop', 'Lanzamiento rotacional a pared', 'Potencia rotacional', '3 × 4 por lado'], ['tibialis', 'Tibial en pared', 'Prevención de la pierna', '2 × 15']],
  },
  FIS0006: {
    dia1: [['cmj', 'Salto vertical con contramovimiento', 'Potencia con volumen reducido', '2 × 3'], ['goblet', 'Sentadilla goblet', 'Mantenimiento de fuerza', '2 vueltas · 5 repeticiones'], ['calfraise', 'Elevación de talón a una pierna', 'Prevención de tobillo y pantorrilla', '2 × 10 por pierna']],
    dia2: [['frenada', 'Frenada en 2 tiempos + salida', 'Frenada y aceleración', '3 por lado'], ['slrdl', 'Peso muerto a una pierna', 'Mantenimiento unilateral', '2 vueltas · 5 por pierna'], ['pallof', 'Pallof press', 'Core y control antirotación', '2 vueltas · 8 por lado']],
    dia3: [['snapdown', 'Snap down + salto', 'Activación prepartido', '2 × 3'], ['chestpass', 'Pase de pecho a pared', 'Potencia con balón medicinal', '2 × 5'], ['wgs', "World's greatest stretch", 'Movilidad y recuperación', '3 por lado']],
  },
}

export default defineEventHandler(async (event) => {
  const body = await readBody<{ team?: string; phaseId?: string; day?: TrainingDay; context?: string }>(event)
  const selectedPhase = cadetPhysicalPlan.phases.find((phase) => phase.id === body.phaseId) || cadetPhysicalPlan.phases[0]
  const day = body.day && dayDetails[body.day] ? body.day : 'dia1'
  const dayDetail = dayDetails[day]
  const exercises = phaseFocus[selectedPhase.id][day]
  const context = body.context?.trim() || ''
  const matchWeek = /partido/i.test(context)
  const rationale = matchWeek
    ? 'El contexto indica partido entre semana: aplica la regla de Laude, ajusta el orden semanal y reduce una serie cuando corresponda.'
    : 'La estructura respeta la fase, el estímulo elegido y la progresión de carga definidas por Laude.'

  const blocks: Block[] = exercises.map(([slug, title, objective, description], index) => ({
    order: index + 1, phase: index === 0 ? 'POTENCIA / VELOCIDAD' : index === 1 ? 'FUERZA' : 'PREVENCIÓN',
    exerciseId: slug, exerciseSlug: slug, title, duration: index === 0 ? 10 : index === 1 ? 20 : 8,
    objective, description, why: selectedPhase.objective,
  }))

  return {
    team: body.team?.trim() || 'Cadete A · U16', objective: selectedPhase.name, duration: dayDetail.duration, intensity: selectedPhase.load,
    context, candidatesCount: 69, rationale, physicalPlanCode: cadetPhysicalPlan.teamCode,
    physicalContext: { planName: cadetPhysicalPlan.name, status: 'activo', message: `${dayDetail.label}. ${selectedPhase.objective}`, phase: selectedPhase, weeklyStructure: cadetPhysicalPlan.weeklyStructure },
    blocks,
  }
})
