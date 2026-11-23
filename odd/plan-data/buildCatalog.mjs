import { readFile, writeFile } from 'node:fs/promises'

const sessions = JSON.parse(await readFile(new URL('./sessions.json', import.meta.url), 'utf8'))
const exerciseSource = JSON.parse(await readFile(new URL('./exercises.json', import.meta.url), 'utf8'))
const macrocycleId = 'CAD27'
const pad2 = value => String(value).padStart(2, '0')

const phaseDefinitions = [
  { name: 'Reencuentro y tests', range: [1, 3], type: 'training', effort: [4, 5], objective: 'Volver a moverse después del verano, medir el punto de partida y aprender (o recordar) la técnica de los ejercicios básicos.' },
  { name: 'Construcción', range: [4, 6], type: 'training', effort: [5, 6], objective: 'Construir la base de fuerza y aprender a frenar y cambiar de dirección antes de que empiece la liga.' },
  { name: 'Fuerza base', range: [7, 10], type: 'training', effort: [6, 7], objective: 'Fuerza a 1 pierna con carga y saltos con contramovimiento. Empieza la competición: el bloque no se recorta, se adapta.' },
  { name: 'Fuerza y potencia', range: [11, 14], type: 'training', effort: [7, 7], objective: 'Convertir la fuerza en potencia: saltos desde el cajón, lanzamientos rotacionales y primeros contrastes fuerza + salto.' },
  { name: 'Potencia y velocidad', range: [15, 20], type: 'training', effort: [7, 8], objective: 'Saltos reactivos, aceleración y 1x1 a toda pista. Llegar a Navidad con el mejor nivel del primer tramo.' },
  { name: 'Reentrada y fuerza', range: [21, 24], type: 'training', effort: [6, 7], objective: 'Volver de Navidad sin lesiones, repetir los tests y recuperar la fuerza del primer tramo.' },
  { name: 'Potencia reactiva', range: [25, 28], type: 'training', effort: [7, 8], objective: 'Contactos cortos con el suelo, salidas de contraataque y recuperaciones defensivas a máxima velocidad.' },
  { name: 'Pico de rendimiento', range: [29, 33], type: 'training', effort: [8, 8], objective: 'La carga más alta de la temporada: fuerza pesada con pocas reps, contraste y 1x1 a toda pista.' },
  { name: 'Transferencia', range: [34, 37], type: 'training', effort: [7, 7], objective: 'Llevar la fuerza y la potencia a las acciones de juego: más situaciones con balón y decisiones, menos volumen en la sala.' },
  { name: 'Fases finales', range: [38, 41], type: 'training', effort: [6, 7], objective: 'Llegar frescos a las fases finales: mantener la fuerza y la potencia con el mínimo volumen y cuidar los tejidos.' },
  { name: 'Combine final', range: [42, 42], type: 'assessment', effort: [0, 0], objective: 'Combine final, comparación con agosto y enero.' },
]

const phaseId = phase => `${macrocycleId}-MES${pad2(phase.order)}`
const exerciseItems = exerciseSource.exercises
  .slice()
  .sort((a, b) => a.page - b.page || a.name.localeCompare(b.name, 'es'))
const exercises = exerciseItems.map((item, index) => ({
  id: item.id,
  name: item.name,
  movementLevel: item.level,
  movementArea: item.movement_area,
  material: item.material,
  how: item.instructions,
  cue: item.cue,
  errors: item.errors ? item.errors.split(' · ').filter(Boolean) : [],
  easier: item.easier,
  harder: item.harder,
}))
if (exercises.some(item => !/^EX\d{4}$/.test(item.id))) throw new Error('exercises.json: every exercise needs a persistent id like EX0001.')
const exerciseIdByName = new Map(exercises.map(item => [item.name, item.id]))
const phaseByName = new Map(phaseDefinitions.map((phase, index) => [phase.name, { ...phase, order: index + 1 }]))
const macrocycles = [{ id: macrocycleId, name: 'Plan anual cadete · 42 semanas', ageCategory: 'cadete', totalWeeks: 42 }]
const mesocycles = phaseDefinitions.map((phase, index) => {
  const [start, end] = phase.range
  const [low, high] = phase.effort
  // One intensity per phase: midpoint of the PDF effort band (0 for holidays and assessments).
  const load = low === 0 ? 0 : (low + high) / 2
  return {
    id: phaseId({ order: index + 1 }), macrocycleId, phaseOrder: index + 1,
    type: phase.type, name: phase.name,
    weekStart: start, weekEnd: end, objective: phase.objective, load,
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
  const sessionId = `${phaseKey}-D${pad2(dayNumber)}`
  mesocycleSessions.push({
    id: sessionId, mesocycleId: phaseKey, day: `dia${dayNumber}`,
    order: dayNumber, name: `Día ${dayNumber}`, focus: phase.name,
    totalMinutes: source.blocks.reduce((total, block) => total + block.minutes, 0),
  })
  for (const sourceBlock of source.blocks) {
    const blockId = `${sessionId}-B${pad2(sourceBlock.order)}`
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
        blockId, exerciseId, itemOrder: itemIndex + 1,
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
    const id = `${macrocycleId}-H${pad2(planIndex + 1)}-${home.code}`
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
        doseHoliday1: weeklyDoses[initialWeek],
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
if (mesocycles.length !== 11 || mesocycles[0].weekStart !== 1 || mesocycles.at(-1).weekEnd !== 42) throw new Error('Annual phases do not cover the 42-week model.')
if (mesocycleSessions.length !== 30 || tests.length !== 7 || homeSessions.length !== 34 || !referencedExercises) throw new Error('Catalog coverage or references are incomplete.')

await writeFile(new URL('./catalog.json', import.meta.url), `${JSON.stringify(catalog, null, 2)}\n`, 'utf8')
console.log(JSON.stringify({ macrocycles: macrocycles.length, phases: mesocycles.length, trainingSessions: mesocycleSessions.length, blocks: trainingBlocks.length, blockExercises: blockExercises.length, exercises: exercises.length, homeExercises: homeSessions.length, tests: tests.length }, null, 2))
