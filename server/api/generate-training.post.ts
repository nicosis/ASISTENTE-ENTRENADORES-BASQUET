import { exercises, getSessionTemplate, type Frequency, type TrainingDay } from '../../app/shared/training'

export default defineEventHandler(async (event) => {
  const body = await readBody<{ day?: TrainingDay; frequency?: Frequency }>(event)
  const frequency: Frequency = body.frequency === 1 || body.frequency === 2 || body.frequency === 3 ? body.frequency : 3
  const day = body.day || 'dia1'
  const template = getSessionTemplate(frequency, day)

  if (!template) {
    throw createError({ statusCode: 400, statusMessage: 'La sesión solicitada no existe para esta frecuencia.' })
  }

  const selectedExercises = template.blocks.map((block) => {
    const exercise = exercises.find((item) => item.id === block.exerciseId)
    if (!exercise) {
      throw createError({ statusCode: 500, statusMessage: 'La plantilla contiene un ejercicio inexistente.' })
    }
    return { ...block, exercise }
  })

  return {
    frequency,
    sessionId: template.id,
    objective: template.name,
    duration: template.duration,
    rationale: `Plantilla para ${frequency} ${frequency === 1 ? 'sesión semanal' : 'sesiones semanales'}: ${template.objective}`,
    blocks: selectedExercises.map(({ exercise, duration }, index) => ({
      order: index + 1,
      phase: exercise.focus.toUpperCase(),
      title: exercise.name,
      duration,
      objective: exercise.focus,
      description: `${exercise.dose}. ${exercise.description}`,
      why: template.objective,
    })),
  }
})
