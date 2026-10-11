export type PhysicalPhase = {
  id: string
  name: string
  startsAt: string
  endsAt: string
  objective: string
  load: string
  plyometrics: string
}

export const cadetPhysicalPlan = {
  teamCode: 'EQU0001',
  name: 'Plan físico Cadete 2026-27',
  scope: 'Cadete A · U16 · Grupo especial FCBQ',
  methodology: 'MBSC',
  weeklyStructure: [
    'Día 1 · 40 min · fuerza y potencia',
    'Día 2 · 40 min · velocidad, cambios de dirección y fuerza',
    'Día 3 · 30 min · reactividad y prevención',
  ],
  phases: [
    { id: 'FIS0001', name: 'Fundamentos', startsAt: '2026-10-12', endsAt: '2026-11-08', objective: 'Aprender los movimientos básicos, crear una base de core y tobillos, y dominar el aterrizaje.', load: '2-3 series · 8-10 repeticiones · esfuerzo 5-6/10', plyometrics: 'Saltar y detenerse, sin rebote.' },
    { id: 'FIS0002', name: 'Fuerza base', startsAt: '2026-11-09', endsAt: '2026-12-20', objective: 'Trabajar sobre una pierna, añadir carga y progresar el aterrizaje.', load: '3 series · 6-8 repeticiones · esfuerzo 6-7/10', plyometrics: 'Contramovimiento y aterrizaje a una pierna.' },
    { id: 'FIS0003', name: 'Fuerza y potencia', startsAt: '2027-01-07', endsAt: '2027-02-14', objective: 'Convertir fuerza en potencia mediante pares de fuerza y salto.', load: '4 series · 5-6 repeticiones · esfuerzo 7-8/10', plyometrics: 'Saltos encadenados cortos y pogos.' },
    { id: 'FIS0004', name: 'Potencia reactiva', startsAt: '2027-02-15', endsAt: '2027-03-21', objective: 'Desarrollar reactividad y cambios de dirección reactivos manteniendo la fuerza.', load: 'Fuerza: 3 series · 4-5 repeticiones; potencia: 3-4 series · 3-5 repeticiones', plyometrics: 'Rebote elástico, depth jumps bajos y saltos continuos.' },
    { id: 'FIS0005', name: 'Transferencia', startsAt: '2027-03-29', endsAt: '2027-05-02', objective: 'Llevar la potencia a situaciones reactivas de pista con menor volumen.', load: 'Fuerza: 3 series · 3-5 repeticiones · esfuerzo 8/10', plyometrics: 'Reactividad, saltos a una pierna y velocidad.' },
    { id: 'FIS0006', name: 'Mantenimiento final', startsAt: '2027-05-03', endsAt: '2027-05-30', objective: 'Mantener fuerza y potencia con el mínimo volumen y llegar fresco al tramo final.', load: '2 series · 3-5 repeticiones · esfuerzo 7-8/10', plyometrics: 'Poco volumen y máxima calidad.' },
  ] satisfies PhysicalPhase[],
  tests: ['Salto vertical (CMJ)', 'Salto horizontal', 'Sprint de 20 m', '5-10-5', 'Flexiones en 60 segundos', 'Plancha lateral'],
  coachRules: [
    'Progresar solo después de dos sesiones consecutivas con técnica correcta.',
    'En saltos, priorizar aterrizaje silencioso y rodillas alineadas antes que cantidad.',
    'Con partido entre semana, ajustar el orden de las sesiones y reducir una serie según el plan.',
  ],
} as const

export function getCadetPhysicalContext(date = new Date()) {
  const dateKey = date.toISOString().slice(0, 10)
  const activePhase = cadetPhysicalPlan.phases.find((phase) => phase.startsAt <= dateKey && phase.endsAt >= dateKey)
  const firstPhase = cadetPhysicalPlan.phases[0]
  const lastPhase = cadetPhysicalPlan.phases.at(-1)!
  const phase = activePhase || (dateKey < firstPhase.startsAt ? firstPhase : lastPhase)
  const status = activePhase ? 'activo' : dateKey < firstPhase.startsAt ? 'próximo' : 'finalizado'
  const message = activePhase
    ? `Fase vigente: ${phase.name}. La parte física acompaña la sesión técnico-táctica, no se incluye automáticamente en esta propuesta.`
    : status === 'próximo'
      ? `El plan comienza el ${firstPhase.startsAt}. Esta es la primera fase programada para el equipo.`
      : 'La temporada física planificada ha finalizado. Revisa los tests y define el siguiente ciclo con Laude.'

  return {
    planName: cadetPhysicalPlan.name,
    status,
    message,
    phase,
    weeklyStructure: cadetPhysicalPlan.weeklyStructure,
  }
}
