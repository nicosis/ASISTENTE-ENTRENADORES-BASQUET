import { readFile, writeFile } from 'node:fs/promises'

const sessions = JSON.parse(await readFile(new URL('./sessions.json', import.meta.url), 'utf8'))
const exerciseSource = JSON.parse(await readFile(new URL('./exercises.json', import.meta.url), 'utf8'))
const macrocycleId = 'CAD42'

const phaseDefinitions = [
  { name: 'Reencuentro y tests', range: [1, 3], type: 'training', color: '#4f7cac', effort: [4, 5], objective: 'Volver a moverse después del verano, medir el punto de partida y aprender (o recordar) la técnica de los ejercicios básicos.', loadRules: ['2-3 series · 8-10 reps', 'Peso ligero: podrían hacer 4 más', 'Saltos: aterrizar y aguantar 2"'], progression: 'S1 incluye dosis de tests; S2-S3 siguen la progresión indicada en cada ejercicio.' },
  { name: 'Construcción', range: [4, 6], type: 'training', color: '#5387a5', effort: [5, 6], objective: 'Construir la base de fuerza y aprender a frenar y cambiar de dirección antes de que empiece la liga.', loadRules: ['3 series · 6-10 reps', 'Peso moderado: podrían hacer 3 más', 'Saltos: primeros contramovimientos'], progression: 'Usar las dosis semanales literales del catálogo.' },
  { name: 'Fuerza base', range: [7, 10], type: 'training', color: '#678a55', effort: [6, 7], objective: 'Fuerza a 1 pierna con carga y saltos con contramovimiento. Empieza la competición: el bloque no se recorta, se adapta.', loadRules: ['3 series · 6-8 reps', 'Podrían hacer 2 más', 'Semana 4: descarga (2 series, mismo peso)'], progression: 'S10 es semana de descarga según el esquema de la fase.' },
  { name: 'Fuerza y potencia', range: [11, 14], type: 'training', color: '#8a8547', effort: [7, 7], objective: 'Convertir la fuerza en potencia: saltos desde el cajón, lanzamientos rotacionales y primeros contrastes fuerza + salto.', loadRules: ['3-4 series · 5-6 reps', 'Podrían hacer 1-2 más', 'Contraste: ejercicio de fuerza + 2 saltos'], progression: 'S14 es la cuarta semana de la fase; respetar las dosis literales del PDF.' },
  { name: 'Potencia y velocidad', range: [15, 18], type: 'training', color: '#9b7144', effort: [7, 8], objective: 'Saltos reactivos, aceleración y 1x1 a toda pista. Llegar a Navidad con el mejor nivel del primer tramo.', loadRules: ['4 series · 4-5 reps', 'Podrían hacer 1-2 más', 'S18: descarga antes de Navidad'], progression: 'S18 es descarga previa a Navidad.' },
  { name: 'Navidad · trabajo en casa', range: [19, 20], type: 'holiday', color: '#69778a', effort: [0, 0], objective: 'Trabajo en casa: 3 sesiones por semana. La segunda semana repite A, B y C; los días de fiesta, descanso.', loadRules: ['3 sesiones cortas por semana', 'Sin material'], progression: 'S20 repite las dosis de S19 según el PDF.' },
  { name: 'Reentrada y fuerza', range: [21, 24], type: 'training', color: '#63875c', effort: [6, 7], objective: 'Volver de Navidad sin lesiones, repetir los tests y recuperar la fuerza del primer tramo.', loadRules: ['De 2 series (S21) a 4 series (S24)', '5-8 reps', 'Peso de diciembre a partir de la S23'], progression: 'S21 incluye dosis de tests; progresar hasta S24 según el PDF.' },
  { name: 'Potencia reactiva', range: [25, 28], type: 'training', color: '#a27447', effort: [7, 8], objective: 'Contactos cortos con el suelo, salidas de contraataque y recuperaciones defensivas a máxima velocidad.', loadRules: ['Fuerza: 3-4 series · 4-5 reps', 'Potencia: 3-4 × 3-5 a máxima velocidad', 'Descanso completo entre series de saltos'], progression: 'Usar las dosis semanales literales del catálogo.' },
  { name: 'Pico de rendimiento', range: [29, 32], type: 'training', color: '#ad6147', effort: [8, 8], objective: 'La carga más alta de la temporada: fuerza pesada con pocas reps, contraste y 1x1 a toda pista.', loadRules: ['Fuerza: 4 series · 3-4 reps pesadas', 'Contraste fuerza + salto en cada sesión de lunes', 'S32: descarga antes de Semana Santa'], progression: 'S32 es descarga previa a Semana Santa.' },
  { name: 'Semana Santa · trabajo en casa', range: [33, 33], type: 'holiday', color: '#69778a', effort: [0, 0], objective: 'Trabajo en casa, versión más exigente. La fecha cambia cada año.', loadRules: ['Trabajo autónomo en casa'], progression: 'El PDF fija S33 como referencia; la fecha real se ajusta después.' },
  { name: 'Transferencia', range: [34, 37], type: 'training', color: '#497e73', effort: [7, 7], objective: 'Llevar la fuerza y la potencia a las acciones de juego: más situaciones con balón y decisiones, menos volumen en la sala.', loadRules: ['Fuerza: 3 series · 4-6 reps', 'Saltos: 3 × 3 de máxima calidad', 'S34: reentrada después de Semana Santa'], progression: 'S34 es reentrada después de Semana Santa.' },
  { name: 'Fases finales', range: [38, 41], type: 'training', color: '#765f86', effort: [6, 7], objective: 'Llegar frescos a las fases finales: mantener la fuerza y la potencia con el mínimo volumen y cuidar los tejidos.', loadRules: ['2 series · 3-5 reps pesadas', 'Saltos: 2 × 3', 'Juega: corto y a máxima intensidad'], progression: 'Mantener la dosis mínima descrita por el PDF.' },
  { name: 'Combine final', range: [42, 42], type: 'assessment', color: '#526171', effort: [0, 0], objective: 'Combine final, comparación con agosto y enero.', loadRules: ['Combine del club en dos días', 'Registrar las medidas de crecimiento'], progression: 'Hito final: S42.' },
]

const normalize = value => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-')
const phaseId = phase => `CAD42-P${String(phase.order).padStart(2, '0')}`
const exerciseItems = exerciseSource.exercises
  .slice()
  .sort((a, b) => a.page - b.page || a.name.localeCompare(b.name, 'es'))
const exercises = exerciseItems.map((item, index) => ({
  id: `CAD42-E${String(index + 1).padStart(3, '0')}`,
  slug: normalize(item.name),
  name: item.name,
  category: `Nivel ${item.level}`,
  focus: item.movement_area,
  movementLevel: item.level,
  movementArea: item.movement_area,
  material: item.material,
  how: item.instructions,
  cue: item.cue,
  errors: item.errors ? item.errors.split(' · ').filter(Boolean) : [],
  easier: item.easier,
  harder: item.harder,
}))
const exerciseIdByName = new Map(exercises.map(item => [item.name, item.id]))
const phaseByName = new Map(phaseDefinitions.map((phase, index) => [phase.name, { ...phase, order: index + 1 }]))
const macrocycles = [{ id: macrocycleId, name: 'Plan anual cadete · 42 semanas', ageCategory: 'cadete', totalWeeks: 42 }]
const mesocycles = phaseDefinitions.map((phase, index) => {
  const [start, end] = phase.range
  const [low, high] = phase.effort
  // The app stores one numeric load per week; the full PDF effort band stays in loadRules.
  const load = low === 0 ? 0 : (low + high) / 2
  return {
    id: phaseId({ order: index + 1 }), macrocycleId, phaseOrder: index + 1,
    type: phase.type, name: phase.name, weeksCount: end - start + 1,
    weekStart: start, weekEnd: end, color: phase.color, objective: phase.objective,
    loadRules: phase.loadRules, plioRule: phase.loadRules.find(item => /saltos|potencia|contraste/i.test(item)) || 'Seguir la dosis indicada en el PDF.',
    weeklyProgressionNote: phase.progression,
    weeklyLoads: Array.from({ length: end - start + 1 }, () => load),
  }
})
const mesocycleSessions = []
const trainingBlocks = []
const blockExercises = []

for (const source of sessions.trainingSessions) {
  const phase = phaseByName.get(source.phase)
  if (!phase) throw new Error(`Unknown training phase: ${source.phase}`)
  const [weekStart, weekEnd] = source.weekRange.match(/\d+/g).map(Number)
  const phaseKey = phaseId(phase)
  const dayNumber = { Lunes: 1, Miércoles: 2, Viernes: 3 }[source.day]
  if (!dayNumber) throw new Error(`Unknown training day: ${source.day}`)
  const sessionId = `${phaseKey}-D${dayNumber}`
  mesocycleSessions.push({
    id: sessionId, mesocycleId: phaseKey, day: `dia${dayNumber}`,
    order: dayNumber, name: `Día ${dayNumber}`, focus: phase.name,
    totalMinutes: source.blocks.reduce((total, block) => total + block.minutes, 0),
  })
  for (const sourceBlock of source.blocks) {
    const blockId = `${sessionId}-B${sourceBlock.order}`
    trainingBlocks.push({ id: blockId, sessionId, blockOrder: sourceBlock.order, name: sourceBlock.name, minutes: sourceBlock.minutes, format: sourceBlock.formatSourceText || sourceBlock.sourceText })
    for (const [itemIndex, item] of sourceBlock.items.entries()) {
      const exerciseId = exerciseIdByName.get(item.exerciseKey)
      if (!exerciseId) throw new Error(`Exercise fiche not found for session item: ${item.exerciseKey}`)
      const weeklyDoses = {}
      for (let week = weekStart; week <= weekEnd; week += 1) {
        const prescribed = item.weekDoses.find(dose => Number(dose.week.match(/\d+/)?.[0]) === week)?.doseSourceText
        const dose = prescribed || item.fixedDoseSourceText
        if (typeof dose !== 'string' || !dose.trim()) throw new Error(`Missing dose for ${item.exerciseKey} in S${week}`)
        weeklyDoses[week] = dose
      }
      blockExercises.push({
        id: `${blockId}-E${String(itemIndex + 1).padStart(2, '0')}`,
        blockId, exerciseId, itemOrder: itemIndex + 1, stationLabel: '',
        doseFormacion: weeklyDoses[weekStart], doseLiga: weeklyDoses[weekStart],
        weekDoses: weeklyDoses,
      })
    }
  }
}

const homeSessions = []
for (const [planIndex, plan] of sessions.homeSessions.entries()) {
  const weekNumbers = plan.weeks.match(/\d+/g).map(Number)
  const initialWeek = weekNumbers[0]
  for (const home of plan.sessions) {
    const id = `${macrocycleId}-H${planIndex + 1}-${home.code}`
    const format = `${home.titleSourceText}\n${home.formatSourceText}\n${plan.weekSequence}`
    for (const [itemIndex, item] of home.items.entries()) {
      const exerciseId = exerciseIdByName.get(item.exerciseKey)
      if (!exerciseId) throw new Error(`Exercise fiche not found for home item: ${item.exerciseKey}`)
      const weeklyDoses = {}
      for (const week of weekNumbers) {
        const prescribed = item.weekDoses.find(dose => Number(dose.week.match(/\d+/)?.[0]) === week)?.doseSourceText
        const dose = prescribed || item.fixedDoseSourceText
        if (typeof dose !== 'string' || !dose.trim()) throw new Error(`Missing home dose for ${item.exerciseKey} in S${week}`)
        weeklyDoses[week] = dose
      }
      homeSessions.push({
        id: `${id}-E${String(itemIndex + 1).padStart(2, '0')}`,
        macrocycleId, code: home.code, name: `${plan.name} · Sesión ${home.code}`,
        minutes: home.durationMinutes, format, exerciseId,
        doseHoliday1: weeklyDoses[initialWeek], doseHoliday2: weeklyDoses[weekNumbers.at(-1)],
        weekNumbers, weekDoses: weeklyDoses,
      })
    }
  }
}

const tests = sessions.combineProtocol.tests.map(test => ({
  id: `${macrocycleId}-T${String(test.order).padStart(2, '0')}`,
  macrocycleId, testOrder: test.order, name: test.name, protocol: test.instructionsSourceText,
  milestoneWeeks: ['S1', 'S21', 'S42'],
}))

const catalog = { macrocycles, mesocycles, mesocycleSessions, trainingBlocks, blockExercises, exercises, homeSessions, tests }
const knownExercises = new Set(exercises.map(item => item.id))
const referencedExercises = [...blockExercises, ...homeSessions].every(item => knownExercises.has(item.exerciseId))
if (mesocycles.length !== 13 || mesocycles[0].weekStart !== 1 || mesocycles.at(-1).weekEnd !== 42) throw new Error('Annual phases do not cover the 42-week model.')
if (mesocycleSessions.length !== 30 || tests.length !== 7 || homeSessions.length !== 34 || !referencedExercises) throw new Error('Catalog coverage or references are incomplete.')

await writeFile(new URL('./catalog.json', import.meta.url), `${JSON.stringify(catalog, null, 2)}\n`, 'utf8')
console.log(JSON.stringify({ macrocycles: macrocycles.length, phases: mesocycles.length, trainingSessions: mesocycleSessions.length, blocks: trainingBlocks.length, blockExercises: blockExercises.length, exercises: exercises.length, homeExercises: homeSessions.length, tests: tests.length }, null, 2))
