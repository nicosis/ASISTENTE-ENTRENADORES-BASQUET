type Intensity = 'Baja' | 'Media' | 'Alta'
type Exercise = { id: string; title: string; category: string; objective: string; description: string; intensity: Intensity; minPlayers: number; maxPlayers: number; ageMin: number; ageMax: number }

const exercises: Exercise[] = [
  { id: 'warmup-ball', title: 'Activación con balón', category: 'Calentamiento', objective: 'Elevar la temperatura y activar coordinación', description: 'Movilidad dinámica, cambios de mano y finalizaciones suaves por parejas.', intensity: 'Baja', minPlayers: 4, maxPlayers: 16, ageMin: 12, ageMax: 18 },
  { id: 'finish-2v1', title: 'Finalización 2 contra 1', category: 'Finalización', objective: 'Leer al defensor y decidir cerca del aro', description: 'Dos atacantes salen desde medio campo contra un defensor y deben resolver en ventaja.', intensity: 'Media', minPlayers: 6, maxPlayers: 14, ageMin: 14, ageMax: 18 },
  { id: 'finish-closeouts', title: 'Finalizar ante closeout', category: 'Finalización', objective: 'Atacar el espacio tras recepción', description: 'Recepción en perímetro, lectura del cierre defensivo y finalización con contacto controlado.', intensity: 'Alta', minPlayers: 6, maxPlayers: 12, ageMin: 14, ageMax: 18 },
  { id: 'finish-advantage', title: 'Ventajas en superioridad', category: 'Finalización', objective: 'Finalizar tras crear una ventaja', description: 'Situaciones 3 contra 2 continuas priorizando pase extra y ocupación de calles.', intensity: 'Media', minPlayers: 8, maxPlayers: 15, ageMin: 14, ageMax: 18 },
  { id: 'finish-footwork', title: 'Pies y ángulos de finalización', category: 'Finalización', objective: 'Dominar paradas y ángulos bajo el aro', description: 'Circuito breve de eurostep, parada en dos tiempos y uso del tablero.', intensity: 'Baja', minPlayers: 4, maxPlayers: 14, ageMin: 12, ageMax: 18 },
  { id: 'shoot-relocation', title: 'Tiro tras pase y reubicación', category: 'Tiro', objective: 'Recibir preparado y tirar con equilibrio', description: 'Pase, desplazamiento corto y tiro desde posiciones definidas.', intensity: 'Media', minPlayers: 4, maxPlayers: 14, ageMin: 12, ageMax: 18 },
  { id: 'shoot-pressure', title: 'Tiro con presión temporal', category: 'Tiro', objective: 'Sostener mecánica bajo presión', description: 'Series de tiro por equipos con objetivo de aciertos y reloj visible.', intensity: 'Alta', minPlayers: 6, maxPlayers: 16, ageMin: 14, ageMax: 18 },
  { id: 'defense-1v1', title: 'Defensa individual en el balón', category: 'Defensa', objective: 'Contener sin cometer falta', description: '1 contra 1 desde ventaja corta, con foco en postura y primer desplazamiento.', intensity: 'Media', minPlayers: 6, maxPlayers: 14, ageMin: 12, ageMax: 18 },
  { id: 'defense-shell', title: 'Shell defensivo 4 contra 4', category: 'Defensa', objective: 'Coordinar ayudas y recuperaciones', description: 'Trabajo sin y con balón para ajustar posiciones, comunicación y closeouts.', intensity: 'Media', minPlayers: 8, maxPlayers: 16, ageMin: 14, ageMax: 18 },
  { id: 'pass-advantage', title: 'Pase en ventaja', category: 'Pase', objective: 'Encontrar al compañero libre a tiempo', description: 'Rueda de pase con defensor activo y progresión a decisiones en 3 contra 3.', intensity: 'Media', minPlayers: 6, maxPlayers: 15, ageMin: 12, ageMax: 18 },
  { id: 'pass-pressure', title: 'Conservar y progresar', category: 'Pase', objective: 'Cuidar el balón bajo presión', description: 'Juego reducido que puntúa las secuencias de pases y castiga pérdidas.', intensity: 'Alta', minPlayers: 8, maxPlayers: 16, ageMin: 14, ageMax: 18 },
  { id: 'transition-lanes', title: 'Calles de contraataque', category: 'Transición', objective: 'Correr, pasar y ocupar espacios', description: 'Salidas tras rebote con tres calles, pase adelantado y llegada al aro.', intensity: 'Media', minPlayers: 6, maxPlayers: 15, ageMin: 12, ageMax: 18 },
  { id: 'transition-back', title: 'Balance defensivo', category: 'Transición', objective: 'Frenar el contraataque rival', description: 'Transición ida y vuelta donde el equipo sin balón debe proteger aro y comunicar.', intensity: 'Alta', minPlayers: 8, maxPlayers: 16, ageMin: 14, ageMax: 18 },
  { id: 'cooldown', title: 'Vuelta a la calma y revisión', category: 'Cierre', objective: 'Bajar carga y fijar aprendizajes', description: 'Movilidad suave, respiración y dos preguntas rápidas sobre las decisiones tomadas.', intensity: 'Baja', minPlayers: 1, maxPlayers: 20, ageMin: 10, ageMax: 20 },
]

function level(intensity: Intensity) { return ['Baja', 'Media', 'Alta'].indexOf(intensity) }

export default defineEventHandler(async (event) => {
  const body = await readBody<{ team?: string; objective?: string; duration?: number; intensity?: Intensity; context?: string }>(event)
  const objective = body.objective || 'Finalización'
  const duration = [60, 75, 90, 120].includes(Number(body.duration)) ? Number(body.duration) : 90
  const intensity = ['Baja', 'Media', 'Alta'].includes(body.intensity || '') ? body.intensity as Intensity : 'Media'
  const team = body.team || 'Cadete A · U16'
  const age = Number(team.match(/U(\d+)/)?.[1] || 16)
  const players = 12
  const compatible = exercises.filter((exercise) => exercise.ageMin <= age && exercise.ageMax >= age && exercise.minPlayers <= players && exercise.maxPlayers >= players && level(exercise.intensity) <= level(intensity))
  const selected = compatible.filter((exercise) => exercise.category === objective).slice(0, 3)
  const warmup = exercises.find((exercise) => exercise.id === 'warmup-ball')!
  const cooldown = exercises.find((exercise) => exercise.id === 'cooldown')!
  const workMinutes = duration - 15
  const base = Math.floor(workMinutes / selected.length / 5) * 5
  const remainder = workMinutes - base * selected.length
  const minutes = selected.map((_, index) => base + (index === selected.length - 1 ? remainder : 0))
  const contextLine = body.context?.trim() ? 'El contexto indicado se ha usado para mantener una progresión prudente y una carga acorde.' : 'La sesión progresa de la activación a decisiones específicas y termina con una revisión breve.'
  return {
    team, objective, duration, intensity, context: body.context?.trim() || '', candidatesCount: compatible.length, rationale: contextLine,
    blocks: [
      { order: 1, phase: 'ACTIVACIÓN', title: warmup.title, duration: 10, objective: warmup.objective, description: warmup.description, why: 'Prepara al grupo antes de elevar la exigencia.' },
      ...selected.map((exercise, index) => ({ order: index + 2, phase: `BLOQUE ${index + 1}`, title: exercise.title, duration: minutes[index], objective: exercise.objective, description: exercise.description, why: `Es compatible con ${team}, el objetivo de ${objective.toLowerCase()} y una carga ${intensity.toLowerCase()}.` })),
      { order: selected.length + 2, phase: 'CIERRE', title: cooldown.title, duration: 5, objective: cooldown.objective, description: cooldown.description, why: 'Permite recuperar y convertir lo trabajado en una referencia clara para el próximo entrenamiento.' },
    ],
  }
})
