<script setup lang="ts">
type SessionBlock = { order: number; phase: string; exerciseId: string; exerciseSlug: string; title: string; duration: number; objective: string; description: string; why: string }
type PhysicalContext = { planName: string; status: string; message: string; phase: { id: string; name: string; objective: string; load: string; plyometrics: string }; weeklyStructure: readonly string[] }
type TrainingSession = { team: string; objective: string; duration: number; intensity: string; context: string; candidatesCount: number; rationale: string; physicalPlanCode: string | null; physicalContext: PhysicalContext | null; blocks: SessionBlock[] }
type DayId = 'dia1' | 'dia2' | 'dia3'
type ViewId = 'week' | 'annual'
type SavedSession = TrainingSession & { savedAt: string; team?: string; planningDate?: string; weekStart?: string; trainingDay?: DayId }
type CompletedSession = { team: string; planningDate: string; trainingDay: DayId; completedAt: string }

const trainerName = ref('')
const signedIn = ref(false)
const activeView = ref<ViewId>('week')
const teams = [
  { id: 'EQU0001', name: 'Cadete A · U16' },
  { id: 'EQU0004', name: 'Cadete B · U16' },
]
const team = ref(teams[0].name)
const planningDate = ref('2026-10-12')
const planningDateDisplay = ref('12/10/2026')
const planningDateError = ref('')
const showDatePicker = ref(false)
const datePickerWasOpen = ref(false)
const calendarMonth = ref('2026-10-01')
const phaseId = ref('FIS0001')
const trainingDay = ref<DayId>('dia1')
const sessionDates = ref<Record<DayId, string>>({ dia1: '2026-10-12', dia2: '2026-10-14', dia3: '2026-10-16' })
const showSessionDateModal = ref(false)
const context = ref('')
const loading = ref(false)
const error = ref('')
const session = ref<TrainingSession | null>(null)
const savedCount = ref(0)
const savedSessions = ref<SavedSession[]>([])
const completedSessions = ref<CompletedSession[]>([])
const weeklySavedDays = ref<DayId[]>([])
const notice = ref('')
const phases = [
  { id: 'FIS0001', name: 'Fundamentos', startsAt: '2026-10-12', endsAt: '2026-11-08' },
  { id: 'FIS0002', name: 'Fuerza base', startsAt: '2026-11-09', endsAt: '2026-12-20' },
  { id: 'FIS0003', name: 'Fuerza y potencia', startsAt: '2027-01-07', endsAt: '2027-02-14' },
  { id: 'FIS0004', name: 'Potencia reactiva', startsAt: '2027-02-15', endsAt: '2027-03-21' },
  { id: 'FIS0005', name: 'Transferencia', startsAt: '2027-03-29', endsAt: '2027-05-02' },
  { id: 'FIS0006', name: 'Mantenimiento final', startsAt: '2027-05-03', endsAt: '2027-05-30' },
]
const phasePreviews: Record<string, { focus: string; load: string; days: Record<DayId, string> }> = {
  FIS0001: { focus: 'Aprender el aterrizaje, crear base de core y tobillo.', load: '2-3 series · esfuerzo 5-6/10', days: { dia1: 'Salto al cajón · sentadilla goblet · tobillo', dia2: 'Frenada · glúteo a una pierna · core', dia3: 'Salto horizontal · balón medicinal · isquiotibiales' } },
  FIS0002: { focus: 'Añadir carga, fuerza unilateral y control de aterrizaje.', load: '3 series · esfuerzo 6-7/10', days: { dia1: 'CMJ · split squat · tobillo', dia2: '5-10-5 · peso muerto rumano · core lateral', dia3: 'Salto a una pierna · balón medicinal · tibial' } },
  FIS0003: { focus: 'Convertir la fuerza en potencia mediante contrastes.', load: '4 series · esfuerzo 7-8/10', days: { dia1: 'Pogos · sentadilla búlgara · pantorrilla', dia2: 'Espejo reactivo · bisagra unilateral · aductores', dia3: 'Saltos encadenados · slam rotacional · tibial' } },
  FIS0004: { focus: 'Desarrollar potencia reactiva y cambios de dirección.', load: '3-4 series · fuerza y potencia', days: { dia1: 'Depth jump · subida al cajón · pantorrilla', dia2: 'T-test · bisagra unilateral · core lateral', dia3: 'Snap down · balón medicinal · isquiotibiales' } },
  FIS0005: { focus: 'Transferir potencia a situaciones reactivas de pista.', load: '3 series · esfuerzo 8/10', days: { dia1: 'Depth jump · fuerza unilateral · pantorrilla', dia2: 'Sprints repetidos · bisagra unilateral · aductores', dia3: 'Saltos laterales · lanzamiento rotacional · tibial' } },
  FIS0006: { focus: 'Mantener fuerza y potencia con volumen reducido.', load: '2 series · esfuerzo 7-8/10', days: { dia1: 'CMJ · sentadilla goblet · pantorrilla', dia2: 'Frenada · bisagra unilateral · core', dia3: 'Snap down · pase de pecho · movilidad' } },
}
const physicalDays = [
  { id: 'dia1', label: 'Día 1', detail: 'Fuerza y potencia', duration: '40 min' },
  { id: 'dia2', label: 'Día 2', detail: 'Velocidad, cambio de dirección y fuerza', duration: '40 min' },
  { id: 'dia3', label: 'Día 3', detail: 'Reactividad y prevención', duration: '30 min' },
] as const
const planStart = '2026-10-12'
const planEnd = '2027-05-30'
function asLocalDate(value: string) { return new Date(`${value}T00:00:00`) }
function setPlanningDate(isoDate: string) {
  const previousWeek = weekStartFor(planningDate.value)
  const targetWeek = weekStartFor(isoDate)
  if (previousWeek !== targetWeek) {
    const monday = asLocalDate(targetWeek)
    const wednesday = new Date(monday); wednesday.setDate(monday.getDate() + 2)
    const friday = new Date(monday); friday.setDate(monday.getDate() + 4)
    sessionDates.value = { dia1: dateKey(monday), dia2: dateKey(wednesday), dia3: dateKey(friday) }
  }
  planningDate.value = isoDate
  sessionDates.value[trainingDay.value] = isoDate
  planningDateDisplay.value = isoDate.split('-').reverse().join('/')
  planningDateError.value = ''
  calendarMonth.value = `${isoDate.slice(0, 7)}-01`
  showDatePicker.value = false
}
function updatePlanningDate() {
  const parts = planningDateDisplay.value.trim().match(/^(\d{2})\/(\d{2})\/(\d{4})$/)
  if (!parts) { planningDateError.value = 'Usa el formato dd/mm/aaaa.'; return }
  const [, day, month, year] = parts
  const date = new Date(Number(year), Number(month) - 1, Number(day))
  const isoDate = `${year}-${month}-${day}`
  if (date.getFullYear() !== Number(year) || date.getMonth() !== Number(month) - 1 || date.getDate() !== Number(day) || isoDate < planStart || isoDate > planEnd) {
    planningDateError.value = 'Elige una fecha entre el 12/10/2026 y el 30/05/2027.'
    return
  }
  setPlanningDate(isoDate)
}
function weekStartFor(value: string) {
  const date = asLocalDate(value)
  const dayOffset = (date.getDay() + 6) % 7
  date.setDate(date.getDate() - dayOffset)
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}
function phaseForDate(value: string) {
  return phases.find((item) => value >= item.startsAt && value <= item.endsAt)
}
function phaseForWeek(start: string, end: string) {
  return phases.find((item) => item.startsAt <= end && item.endsAt >= start)
}
const activePhase = computed(() => phases.find((item) => item.id === phaseId.value) || phases[0])
const planningWeek = computed(() => Math.max(1, Math.min(33, Math.floor((asLocalDate(planningDate.value).getTime() - asLocalDate(planStart).getTime()) / 604800000) + 1)))
const planningWeekRange = computed(() => {
  const start = asLocalDate(weekStartFor(planningDate.value))
  const end = new Date(start)
  end.setDate(end.getDate() + 6)
  return `${new Intl.DateTimeFormat('es-ES', { day: 'numeric', month: 'long' }).format(start)} – ${new Intl.DateTimeFormat('es-ES', { day: 'numeric', month: 'long' }).format(end)}`
})
const weeklyProgress = computed(() => Math.min(weeklySavedDays.value.length, 3))
const weeklyCompleted = computed(() => {
  const currentWeekStart = weekStartFor(planningDate.value)
  return new Set(completedSessions.value
    .filter((item) => item.team === team.value && weekStartFor(item.planningDate) === currentWeekStart)
    .map((item) => item.trainingDay)).size
})
const activePhasePreview = computed(() => phasePreviews[phaseId.value])
function dateKey(date: Date) { return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}` }
function formatShortDate(value: string) { return new Intl.DateTimeFormat('es-ES', { weekday: 'short', day: 'numeric', month: 'short' }).format(asLocalDate(value)).replace('.', '') }
function formatDateRange(start: string, end: string) {
  const formatter = new Intl.DateTimeFormat('es-ES', { day: 'numeric', month: 'short' })
  return `${formatter.format(asLocalDate(start)).replace('.', '')} – ${formatter.format(asLocalDate(end)).replace('.', '')}`
}
const annualWeeks = computed(() => {
  const weeks: { number: number; start: string; end: string; phase?: (typeof phases)[number] }[] = []
  const cursor = asLocalDate(planStart)
  let number = 1
  while (dateKey(cursor) <= planEnd) {
    const start = dateKey(cursor)
    const endDate = new Date(cursor); endDate.setDate(endDate.getDate() + 6)
    const end = dateKey(endDate)
    weeks.push({ number, start, end, phase: phaseForWeek(start, end) })
    cursor.setDate(cursor.getDate() + 7)
    number += 1
  }
  return weeks
})
function savedCountForWeek(weekStart: string) {
  return new Set(savedSessions.value.filter((item) => item.team === team.value && item.weekStart === weekStart && item.trainingDay).map((item) => item.trainingDay)).size
}
function completedCountForWeek(weekStart: string) {
  return new Set(completedSessions.value.filter((item) => item.team === team.value && weekStartFor(item.planningDate) === weekStart).map((item) => item.trainingDay)).size
}
function openAnnualWeek(weekStart: string) {
  setPlanningDate(weekStart)
  activeView.value = 'week'
}
const monthCalendar = computed(() => {
  const firstDay = asLocalDate(calendarMonth.value)
  const offset = (firstDay.getDay() + 6) % 7
  const totalDays = new Date(firstDay.getFullYear(), firstDay.getMonth() + 1, 0).getDate()
  return Array.from({ length: offset + totalDays }, (_, index) => {
    if (index < offset) return null
    const date = new Date(firstDay.getFullYear(), firstDay.getMonth(), index - offset + 1)
    const value = dateKey(date)
    return { value, day: date.getDate(), disabled: value < planStart || value > planEnd }
  })
})
const monthLabel = computed(() => new Intl.DateTimeFormat('es-ES', { month: 'long', year: 'numeric' }).format(asLocalDate(calendarMonth.value)))
function moveCalendarMonth(amount: number) {
  const date = asLocalDate(calendarMonth.value)
  date.setMonth(date.getMonth() + amount, 1)
  calendarMonth.value = dateKey(date)
}
function rememberDatePickerState() {
  datePickerWasOpen.value = showDatePicker.value
}
function toggleDatePicker() {
  showDatePicker.value = !datePickerWasOpen.value
}
function selectTrainingDay(day: DayId) {
  trainingDay.value = day
  const date = sessionDates.value[day]
  planningDate.value = date
  planningDateDisplay.value = date.split('-').reverse().join('/')
}
function toggleSessionDatePicker(day: DayId) {
  if (showSessionDateModal.value && trainingDay.value === day) {
    showSessionDateModal.value = false
    return
  }
  selectTrainingDay(day)
  calendarMonth.value = `${sessionDates.value[day].slice(0, 7)}-01`
  showSessionDateModal.value = true
}
function assignSessionDate(value: string) {
  setPlanningDate(value)
  showSessionDateModal.value = false
}
function syncPhaseToPlanningDate() {
  const current = phases.find((item) => planningDate.value >= item.startsAt && planningDate.value <= item.endsAt)
  if (current) phaseId.value = current.id
}
function refreshWeeklyProgress() {
  const currentWeekStart = weekStartFor(planningDate.value)
  weeklySavedDays.value = [...new Set(savedSessions.value
    .filter((item) => item.team === team.value && item.weekStart === currentWeekStart && item.trainingDay)
    .map((item) => item.trainingDay as DayId))]
}
function savedSessionForDay(day: DayId) {
  return savedSessions.value.find((item) => item.team === team.value && item.planningDate === sessionDates.value[day] && item.trainingDay === day)
}
function isSessionCompleted(day: DayId) {
  return completedSessions.value.some((item) => item.team === team.value && item.planningDate === sessionDates.value[day] && item.trainingDay === day)
}
function toggleSessionCompleted(day: DayId) {
  const planningDateForDay = sessionDates.value[day]
  const existingIndex = completedSessions.value.findIndex((item) => item.team === team.value && item.planningDate === planningDateForDay && item.trainingDay === day)
  const updated = [...completedSessions.value]
  if (existingIndex >= 0) updated.splice(existingIndex, 1)
  else updated.unshift({ team: team.value, planningDate: planningDateForDay, trainingDay: day, completedAt: new Date().toISOString() })
  completedSessions.value = updated
  localStorage.setItem('basket-beta-completed-sessions', JSON.stringify(updated))
}
function openSavedSession(day: DayId) {
  const saved = savedSessionForDay(day)
  if (!saved) return
  selectTrainingDay(day)
  session.value = saved
  notice.value = `Mostrando la sesión guardada del ${formatShortDate(saved.planningDate || sessionDates.value[day])}.`
}
watch(planningDate, () => {
  syncPhaseToPlanningDate()
  refreshWeeklyProgress()
})
watch(team, refreshWeeklyProgress)
const exerciseImages: Record<string, { src: string; alt: string }> = {
  boxjump: { src: '/images/physical/boxjump_20261012110810.jpg', alt: 'Demostración de salto al cajón con parada' },
  goblet: { src: '/images/physical/goblet_20261012110810.jpg', alt: 'Demostración de sentadilla goblet' },
  calfraise: { src: '/images/physical/calfraise_20261012110810.jpg', alt: 'Demostración de elevación de talón a una pierna' },
  frenada: { src: '/images/physical/frenada_20261012110810.jpg', alt: 'Demostración de frenada en dos tiempos' },
  slam: { src: '/images/physical/slam_20261012110810.jpg', alt: 'Demostración de lanzamiento al suelo con balón medicinal' },
  nordic: { src: '/images/physical/nordic_20261012110810.jpg', alt: 'Demostración de nórdico de isquiotibiales' },
}
const fallbackExerciseImage = { src: '/images/physical/exercise-placeholder.png', alt: 'Material de entrenamiento: imagen de referencia pendiente' }

function imageForExercise(slug: string) {
  return exerciseImages[slug] || fallbackExerciseImage
}

function enter() {
  if (!trainerName.value.trim()) return
  signedIn.value = true
  localStorage.setItem('basket-beta-trainer', trainerName.value.trim())
  loadSavedSessions()
}
function signOut() {
  localStorage.removeItem('basket-beta-trainer')
  signedIn.value = false
  trainerName.value = ''
  session.value = null
  notice.value = ''
}
function loadSavedSessions() {
  const saved = JSON.parse(localStorage.getItem('basket-beta-sessions') || '[]')
  const completed = JSON.parse(localStorage.getItem('basket-beta-completed-sessions') || '[]')
  savedSessions.value = Array.isArray(saved) ? saved : []
  completedSessions.value = Array.isArray(completed) ? completed : []
  savedCount.value = savedSessions.value.length
  refreshWeeklyProgress()
}
async function generateTraining() {
  loading.value = true; error.value = ''; notice.value = ''
  try {
    session.value = await $fetch<TrainingSession>('/api/generate-training', { method: 'POST', body: { team: team.value, phaseId: phaseId.value, day: trainingDay.value, context: context.value } })
  } catch { error.value = 'No se pudo generar la propuesta. Inténtalo de nuevo.' } finally { loading.value = false }
}
function saveSession() {
  if (!session.value) return
  const saved = JSON.parse(localStorage.getItem('basket-beta-sessions') || '[]') as SavedSession[]
  saved.unshift({ ...session.value, team: team.value, planningDate: planningDate.value, weekStart: weekStartFor(planningDate.value), trainingDay: trainingDay.value, savedAt: new Date().toISOString() })
  localStorage.setItem('basket-beta-sessions', JSON.stringify(saved))
  savedSessions.value = saved
  savedCount.value = saved.length; refreshWeeklyProgress(); notice.value = 'Sesión guardada para esta semana en este dispositivo.'
}
onMounted(() => {
  const savedTrainer = localStorage.getItem('basket-beta-trainer')
  syncPhaseToPlanningDate()
  if (savedTrainer) { trainerName.value = savedTrainer; signedIn.value = true; loadSavedSessions() }
})
</script>

<template>
  <main class="app-shell">
    <section v-if="!signedIn" class="welcome-panel">
      <div class="brand-mark">B</div>
      <p class="eyebrow">BETA LOCAL · ASISTENTE DE ENTRENAMIENTO</p>
      <h1>Prepara mejores sesiones.<br><em>En menos tiempo.</em></h1>
      <p class="intro">Una primera versión para convertir la metodología del entrenador en sesiones claras, adaptadas a cada equipo.</p>
      <form class="access-form" @submit.prevent="enter">
        <label for="trainer">¿Cómo te llamas?</label>
        <input id="trainer" v-model="trainerName" placeholder="Nombre del entrenador" autocomplete="name">
        <button class="primary-button" type="submit" :disabled="!trainerName.trim()">Entrar a la beta <span>→</span></button>
      </form>
      <p class="microcopy">No hace falta crear una cuenta para esta prueba.</p>
    </section>
    <template v-else>
      <header class="topbar">
        <div class="topbar-left"><div class="brand"><span class="brand-ball">B</span><span>pizarra</span></div><nav class="main-nav" aria-label="Navegación principal"><button type="button" :class="{ active: activeView === 'week' }" @click="activeView = 'week'; session = null">Semana</button><button type="button" :class="{ active: activeView === 'annual' }" @click="activeView = 'annual'; session = null; showDatePicker = false">Plan anual</button></nav></div>
        <div class="topbar-right"><span class="beta-pill">BETA</span><span class="trainer">Hola, {{ trainerName }}</span><button class="sign-out-button" type="button" @click="signOut">Salir</button></div>
      </header>
      <div class="workspace">
        <aside class="side-panel">
          <p class="eyebrow">PLAN DE LAUDE</p><h2>Prepara la sesión física</h2>
          <p class="side-copy">Organiza la semana del plan anual y prepara cada sesión según su fase activa.</p>
          <div class="saved"><strong>{{ savedCount }}</strong><span>sesiones guardadas<br>en este dispositivo</span></div>
          <div class="beta-note"><span>✦</span> Esta beta usa el plan físico Cadete 2026-27 de Laude como fuente principal.</div>
        </aside>
        <section class="content-panel">
          <section v-if="activeView === 'annual'" class="annual-plan"><p class="eyebrow">PLAN ANUAL · CADETE 2026-27</p><div class="annual-plan-heading"><div><h1>El mapa de la temporada.</h1><p>Consulta las fases y abre cualquier semana para preparar o revisar sus sesiones.</p></div><button class="secondary-button" type="button" @click="activeView = 'week'">Volver a mi semana</button></div><section class="annual-plan-summary"><div><span>INICIO</span><strong>12 oct 2026</strong></div><div><span>FINAL</span><strong>30 may 2027</strong></div><div><span>ESTRUCTURA</span><strong>33 semanas · 6 fases</strong></div></section><section class="phase-roadmap" aria-label="Fases del plan anual"><article v-for="phase in phases" :key="phase.id" :class="{ active: phase.id === phaseId }"><p>{{ phase.id }}</p><strong>{{ phase.name }}</strong><span>{{ formatDateRange(phase.startsAt, phase.endsAt) }}</span></article></section><section class="annual-weeks" aria-label="Semanas del plan"><button v-for="week in annualWeeks" :key="week.start" type="button" :disabled="!week.phase" :class="{ current: week.start === weekStartFor(planningDate), pause: !week.phase }" @click="openAnnualWeek(week.start)"><span>SEMANA {{ week.number }}</span><strong>{{ week.phase?.name || 'Pausa y transición' }}</strong><small>{{ formatDateRange(week.start, week.end) }}</small><em>{{ week.phase ? `${savedCountForWeek(week.start)} guardadas · ${completedCountForWeek(week.start)} realizadas` : 'Sin sesiones programadas' }}</em></button></section></section>
          <div v-else-if="!session" class="generator">
            <p class="eyebrow">PLAN ANUAL · CADETE 2026-27</p><h1>Organiza tu semana física.</h1><p class="subhead">La fecha sitúa al equipo en su fase anual. Después prepara cada estímulo de la semana.</p>
            <form @submit.prevent="generateTraining">
              <div class="field-grid">
                <label>Equipo<select v-model="team"><option v-for="item in teams" :key="item.id" :value="item.name">{{ item.name }}</option></select></label>
                <div class="date-field"><label>Fecha de la sesión<input v-model="planningDateDisplay" type="text" inputmode="numeric" autocomplete="off" placeholder="dd/mm/aaaa" @mousedown="rememberDatePickerState" @focus="showDatePicker = true" @click="toggleDatePicker" @change="updatePlanningDate"><small>Ubica esta sesión en la fase y semana del plan anual.</small></label><section v-if="showDatePicker" class="date-picker" aria-label="Calendario para elegir fecha"><div class="date-picker-header"><button type="button" aria-label="Mes anterior" @click="moveCalendarMonth(-1)">←</button><strong>{{ monthLabel }}</strong><button type="button" aria-label="Mes siguiente" @click="moveCalendarMonth(1)">→</button></div><div class="date-picker-weekdays"><span v-for="weekday in ['L', 'M', 'X', 'J', 'V', 'S', 'D']" :key="weekday">{{ weekday }}</span></div><div class="date-picker-days"><span v-for="(date, index) in monthCalendar" :key="date?.value || `empty-${index}`"><button v-if="date" type="button" :disabled="date.disabled" :class="{ selected: planningDate === date.value }" @click="setPlanningDate(date.value)">{{ date.day }}</button></span></div></section></div>
              </div>
              <p v-if="planningDateError" class="date-error">{{ planningDateError }}</p>
              <section class="annual-status" aria-live="polite"><p>PLAN ACTIVO · {{ team }}</p><strong>Semana {{ planningWeek }} · {{ activePhase.name }}</strong><span>{{ planningWeekRange }} · {{ weeklyProgress }} guardadas · {{ weeklyCompleted }} realizadas</span><small>Inicio del plan: 12/10/2026 · Fin: 30/05/2027</small><em>{{ activePhasePreview.focus }}</em></section>
              <details class="phase-adjustment"><summary>Ajustar fase manualmente</summary><label>Usa esta opción solo si la planificación real difiere del calendario.<select v-model="phaseId"><option v-for="item in phases" :key="item.id" :value="item.id">{{ item.name }}</option></select></label></details>
              <fieldset><legend>3 sesiones de esta semana · {{ activePhase.name }}</legend><div class="choice-row"><article v-for="item in physicalDays" :key="item.id" class="day-choice" :class="{ selected: trainingDay === item.id, completed: isSessionCompleted(item.id) }"><button class="day-choice-main" type="button" @click="selectTrainingDay(item.id)"><strong>{{ item.label }}</strong><span>{{ item.detail }}</span><small>{{ formatShortDate(sessionDates[item.id]) }} · {{ isSessionCompleted(item.id) ? 'Realizada' : weeklySavedDays.includes(item.id) ? 'Guardada' : item.duration }}</small><em>{{ activePhasePreview.days[item.id] }}</em></button><div class="day-choice-actions"><label class="completion-toggle"><input type="checkbox" :checked="isSessionCompleted(item.id)" @change="toggleSessionCompleted(item.id)"><span>Realizada</span></label><button class="day-date-button" type="button" @click="toggleSessionDatePicker(item.id)">Modificar fecha</button><button v-if="savedSessionForDay(item.id)" class="day-history-button" type="button" @click="openSavedSession(item.id)">Ver guardada</button></div><section v-if="showSessionDateModal && trainingDay === item.id" class="day-date-picker" :aria-label="`Modificar fecha de ${item.label}`"><div class="date-picker-header"><button type="button" aria-label="Mes anterior" @click="moveCalendarMonth(-1)">←</button><strong>{{ monthLabel }}</strong><button type="button" aria-label="Mes siguiente" @click="moveCalendarMonth(1)">→</button></div><div class="date-picker-weekdays"><span v-for="weekday in ['L', 'M', 'X', 'J', 'V', 'S', 'D']" :key="weekday">{{ weekday }}</span></div><div class="date-picker-days"><span v-for="(date, index) in monthCalendar" :key="date?.value || `empty-day-${index}`"><button v-if="date" type="button" :disabled="date.disabled" :class="{ selected: sessionDates[trainingDay] === date.value }" @click="assignSessionDate(date.value)">{{ date.day }}</button></span></div><small>Vuelve a pulsar «Modificar fecha» si no quieres realizar cambios.</small></section></article></div></fieldset>
              <label class="context-label">Contexto opcional<textarea v-model="context" rows="3" placeholder="Ej.: hay partido entre semana o el grupo vuelve de vacaciones."></textarea></label>
              <p v-if="error" class="error">{{ error }}</p>
              <button class="primary-button generate" type="submit" :disabled="loading">{{ loading ? 'Preparando sesión…' : 'Preparar sesión física' }} <span>→</span></button>
            </form>
          </div>
          <div v-else class="session-result">
            <div class="result-heading"><div><p class="eyebrow">SESIÓN FÍSICA GENERADA</p><h1>{{ session.objective }}</h1></div><button class="text-button" @click="session = null">← Editar datos</button></div>
            <div class="summary"><span><strong>{{ session.duration }}</strong> min</span><span><strong>{{ session.objective }}</strong></span><span><strong>Intensidad {{ session.intensity }}</strong></span></div>
            <p v-if="session.context" class="context-summary">Contexto considerado: “{{ session.context }}”</p>
            <div class="rationale"><span>✦</span><p>{{ session.rationale }} <strong>{{ session.candidatesCount }} ejercicios compatibles</strong> analizados.</p></div>
            <section v-if="session.physicalContext" class="physical-context">
              <p class="physical-label">PLAN FÍSICO DE LAUDE · {{ session.physicalContext.status }}</p>
              <h2>{{ session.physicalContext.phase.name }}</h2>
              <p>{{ session.physicalContext.message }}</p>
              <div class="physical-details"><span><strong>Carga:</strong> {{ session.physicalContext.phase.load }}</span><span><strong>Pliometría:</strong> {{ session.physicalContext.phase.plyometrics }}</span></div>
              <p class="physical-week">{{ session.physicalContext.weeklyStructure.join(' · ') }}</p>
            </section>
            <ol class="session-list">
              <li v-for="block in session.blocks" :key="block.order" class="session-card">
                <div class="timeline"><span>{{ String(block.order).padStart(2, '0') }}</span><i /></div>
                <article><div class="card-top"><p>{{ block.phase }}</p><span>{{ block.duration }} min</span></div><div class="exercise-card-content"><div><h2>{{ block.title }}</h2><p class="card-objective">{{ block.objective }}</p><p>{{ block.description }}</p></div><figure class="exercise-visual"><img :src="imageForExercise(block.exerciseSlug).src" :alt="imageForExercise(block.exerciseSlug).alt" loading="lazy"><figcaption v-if="!exerciseImages[block.exerciseSlug]">Imagen de referencia</figcaption></figure></div><div class="why"><strong>Motivo de la selección</strong><span>{{ block.why }}</span></div></article>
              </li>
            </ol>
            <div class="result-actions"><button class="secondary-button" type="button" @click="generateTraining">↻ Otra propuesta</button><button class="secondary-button pdf-button" type="button" disabled>⇩ Descargar PDF <small>Próximamente</small></button><button class="primary-button" type="button" @click="saveSession">Guardar sesión <span>→</span></button></div>
            <p v-if="notice" class="saved-notice">✓ {{ notice }}</p>
          </div>
        </section>
      </div>
    </template>
  </main>
</template>

<style>
@import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600;9..40,700&family=Fraunces:opsz,wght@9..144,600;9..144,700&display=swap');
:root { font-family: 'DM Sans', sans-serif; color: #17231d; background: #f4f2eb; font-synthesis: none; } * { box-sizing: border-box; } body { margin: 0; } button, input, select, textarea { font: inherit; } button { cursor: pointer; }
.app-shell { min-height: 100vh; background: #f4f2eb; }.welcome-panel { min-height: 100vh; max-width: 720px; padding: 11vh 32px 70px; margin: auto; }.brand-mark,.brand-ball { display: inline-grid; place-items: center; width: 35px; height: 35px; background: #ed6a45; color: white; border-radius: 50%; font: 700 18px 'Fraunces'; }.eyebrow { margin: 22px 0 11px; color: #69806f; font: 500 11px 'DM Mono'; letter-spacing: .11em; }.welcome-panel h1,.generator h1,.session-result h1 { margin: 0; letter-spacing: -.055em; font: 600 clamp(42px,7vw,70px)/.98 'Fraunces'; }.welcome-panel em { color: #ef704d; font-style: normal; }.intro { max-width: 510px; color: #59665e; font-size: 18px; line-height: 1.55; }.access-form { max-width: 440px; margin-top: 42px; }.access-form label,.field-grid label,.context-label { display: grid; gap: 8px; color: #4e5d52; font-size: 14px; font-weight: 600; } input,select,textarea { width: 100%; border: 1px solid #d5d8ce; border-radius: 8px; padding: 14px 15px; color: #17231d; background: #fffefa; outline-color: #ed6a45; } .access-form input { margin-bottom: 12px; font-size: 16px; }.primary-button { border: 0; border-radius: 7px; padding: 14px 18px; color: #fff; background: #203d30; font-weight: 700; transition: transform .2s, background .2s; }.primary-button:not(:disabled):hover { transform: translateY(-2px); background: #28523e; }.primary-button:disabled { opacity: .65; cursor: wait; }.primary-button span { margin-left: 14px; color: #f6b561; font-size: 20px; }.microcopy { color: #879087; font-size: 13px; }.topbar { display: flex; justify-content: space-between; align-items: center; height: 70px; padding: 0 clamp(22px,5vw,72px); border-bottom: 1px solid #dfe0d8; background: #fbfaf5; }.brand { display: flex; align-items: center; gap: 9px; font: 700 20px 'Fraunces'; letter-spacing: -.04em; }.brand-ball { width: 26px; height: 26px; font-size: 14px; }.topbar-right { display: flex; align-items: center; gap: 14px; color: #667267; font-size: 14px; }.beta-pill { padding: 4px 7px; color: #c34a2a; background: #ffeadf; border-radius: 4px; font: 500 10px 'DM Mono'; }.sign-out-button { border: 1px solid #ccd3ca; border-radius: 5px; padding: 6px 9px; color: #496052; background: transparent; font-size: 12px; font-weight: 600; }.sign-out-button:hover { border-color: #8c9e90; color: #203d30; background: #f1f4ef; }.workspace { display: grid; grid-template-columns: minmax(240px, .8fr) minmax(0, 2fr); max-width: 1440px; min-height: calc(100vh - 70px); margin: auto; }.side-panel { padding: 60px clamp(24px,4vw,64px); border-right: 1px solid #dfe0d8; background: #e9eee7; }.side-panel .eyebrow { margin-top: 0; }.side-panel h2 { margin: 0; font: 600 clamp(28px,3vw,39px)/1.04 'Fraunces'; letter-spacing: -.045em; }.side-copy { color: #5c695f; line-height: 1.55; }.saved { display: flex; gap: 13px; align-items: center; margin-top: 42px; padding-top: 23px; border-top: 1px solid #cdd5ca; }.saved strong { color: #df5e3c; font: 700 32px 'Fraunces'; }.saved span { color: #5c695f; font-size: 12px; line-height: 1.35; }.beta-note { display: flex; gap: 10px; margin-top: 40px; padding: 14px; color: #526357; background: #f5f7f1; border-radius: 8px; font-size: 12px; line-height: 1.4; }.beta-note span,.rationale span { color: #e66b48; }.content-panel { padding: 60px clamp(24px,7vw,106px); background: #fbfaf5; }.generator { max-width: 690px; }.generator .eyebrow,.session-result .eyebrow { margin-top: 0; }.subhead { margin: 15px 0 38px; color: #657268; }.field-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 18px; }.phase-preview { display: grid; gap: 5px; margin-top: 20px; padding: 15px 17px; border: 1px solid #cbd8ca; border-radius: 9px; color: #395044; background: #eef5ec; }.phase-preview p { margin: 0; color: #62806d; font: 500 10px 'DM Mono'; letter-spacing: .1em; }.phase-preview strong { font: 600 16px/1.35 'Fraunces'; }.phase-preview span { color: #5a7060; font-size: 12px; } fieldset { margin: 28px 0; padding: 0; border: 0; } legend { margin-bottom: 11px; color: #4e5d52; font-size: 14px; font-weight: 600; }.frequency-selector { margin-bottom: 0; }.frequency-selector > div { display: flex; gap: 8px; }.frequency-selector button { border: 1px solid #cbd4cb; border-radius: 999px; padding: 8px 15px; color: #526357; background: #fffefa; font-weight: 600; }.frequency-selector button.selected { border-color: #203d30; color: #fff; background: #203d30; }.frequency-selector p { margin: 9px 0 0; color: #708076; font-size: 12px; line-height: 1.45; }.rotation-note { display: flex; justify-content: space-between; gap: 16px; align-items: center; margin: 18px 0 0; padding: 13px 15px; border: 1px solid #e6d7c4; border-radius: 8px; background: #fff7ee; }.rotation-note div { display: grid; gap: 3px; }.rotation-note p { margin: 0; color: #a26c41; font: 500 10px 'DM Mono'; letter-spacing: .09em; }.rotation-note strong { color: #5e4939; font: 600 16px 'Fraunces'; }.rotation-note span { color: #7c6b5f; font-size: 12px; }.rotation-note button { flex: 0 0 auto; border: 1px solid #cfae90; border-radius: 6px; padding: 8px 10px; color: #7e542f; background: transparent; font-size: 12px; font-weight: 600; }.choice-row { display: grid; gap: 9px; }.choice-row button { display: grid; grid-template-columns: 82px minmax(0, 1fr) auto; align-items: center; gap: 6px 12px; width: 100%; border: 1px solid #d5d8ce; border-radius: 8px; padding: 13px 16px; color: #59665e; background: #fffefa; text-align: left; }.choice-row button strong { color: #203d30; font: 600 17px 'Fraunces'; }.choice-row button span { font-size: 14px; }.choice-row button small { color: #708076; font: 500 11px 'DM Mono'; }.choice-row button em { grid-column: 2 / -1; color: #78857d; font-size: 12px; font-style: normal; }.choice-row button.selected { border-color: #203d30; color: #fff; background: #203d30; }.choice-row button.selected strong,.choice-row button.selected small,.choice-row button.selected em { color: #fff; }.context-label { margin: 30px 0 24px; }.generate { min-width: 250px; }.error { color: #c34a2a; }.result-heading { display: flex; justify-content: space-between; align-items: flex-start; gap: 20px; }.result-heading h1 { font-size: clamp(35px,5vw,56px); }.text-button { border: 0; padding: 7px 0; color: #52725e; background: transparent; text-decoration: underline; }.summary { display: flex; flex-wrap: wrap; gap: 9px; margin: 27px 0 12px; }.summary span { padding: 7px 10px; border-radius: 5px; color: #4a5e50; background: #eaf0e9; font-size: 13px; }.context-summary { color: #6a756d; font-size: 13px; font-style: italic; }.rationale { display: flex; gap: 12px; align-items: flex-start; margin: 29px 0; padding: 13px 15px; border-left: 3px solid #ef704d; background: #fff0e9; color: #5d514b; font-size: 13px; line-height: 1.5; }.rationale p { margin: 0; }.session-list { margin: 35px 0 25px; padding: 0; list-style: none; }.session-card { display: grid; grid-template-columns: 48px 1fr; gap: 18px; }.timeline { display: flex; flex-direction: column; align-items: center; color: #799081; font: 11px 'DM Mono'; }.timeline i { display: block; width: 1px; flex: 1; margin-top: 9px; background: #d6ddd3; }.session-card:last-child .timeline i { display: none; }.session-card article { margin-bottom: 18px; padding: 21px 24px; border: 1px solid #e0e1da; border-radius: 10px; background: #fffefa; box-shadow: 0 2px 0 rgba(25,40,30,.02); }.card-top { display: flex; justify-content: space-between; align-items: center; color: #7a8c7e; font: 11px 'DM Mono'; letter-spacing: .08em; }.card-top p { margin: 0; }.card-top span { padding: 4px 6px; color: #c34a2a; background: #fff0e9; border-radius: 4px; letter-spacing: 0; }.exercise-card-content { display: grid; grid-template-columns: minmax(0, 1fr) 132px; gap: 20px; align-items: start; }.session-card h2 { margin: 9px 0 2px; font: 600 25px 'Fraunces'; letter-spacing: -.035em; }.session-card article > p { margin: 8px 0; color: #59665e; font-size: 14px; line-height: 1.5; }.session-card .card-objective { color: #304b3b; font-weight: 600; }.exercise-visual { position: relative; margin: 9px 0 0; overflow: hidden; border: 1px solid #dfe4dc; border-radius: 8px; background: #edf0e9; aspect-ratio: 1; }.exercise-visual img { display: block; width: 100%; height: 100%; object-fit: cover; }.exercise-visual figcaption { position: absolute; right: 0; bottom: 0; left: 0; padding: 5px 7px; color: #f5f7f2; background: rgba(32,61,48,.78); font: 10px 'DM Mono'; }.why { display: grid; grid-template-columns: 130px 1fr; gap: 10px; margin-top: 15px; padding-top: 13px; border-top: 1px solid #ecebe6; color: #68746c; font-size: 12px; line-height: 1.45; }.why strong { color: #597362; }.result-actions { display: flex; justify-content: flex-end; gap: 10px; }.secondary-button { border: 1px solid #bdc8bd; border-radius: 7px; padding: 12px 15px; color: #365443; background: transparent; font-weight: 600; }.saved-notice { color: #3c7a52; text-align: right; font-size: 13px; }
.physical-context { margin: 0 0 29px; padding: 17px 18px; border: 1px solid #cbd8ca; border-radius: 10px; background: #eef5ec; color: #395044; }.physical-label { margin: 0 0 7px; color: #62806d; font: 500 10px 'DM Mono'; letter-spacing: .1em; }.physical-context h2 { margin: 0; font: 600 23px 'Fraunces'; letter-spacing: -.03em; }.physical-context > p:not(.physical-label):not(.physical-week) { margin: 7px 0; font-size: 13px; line-height: 1.5; }.physical-details { display: grid; gap: 6px; margin-top: 12px; font-size: 12px; line-height: 1.45; }.physical-week { margin: 13px 0 0; padding-top: 11px; border-top: 1px solid #d5e0d3; color: #5a7060; font-size: 11px; line-height: 1.5; }
@media (max-width: 760px) { .workspace { grid-template-columns: 1fr; }.side-panel { padding: 30px 25px; border-right: 0; border-bottom: 1px solid #dfe0d8; }.side-copy,.beta-note { display: none; }.saved { margin-top: 19px; padding-top: 16px; }.content-panel { padding: 40px 22px; }.field-grid { grid-template-columns: 1fr; }.rotation-note { align-items: flex-start; flex-direction: column; }.choice-row button { grid-template-columns: 1fr auto; gap: 3px 12px; }.choice-row button span,.choice-row button em { grid-column: 1 / -1; }.exercise-card-content { grid-template-columns: 1fr; }.exercise-visual { width: min(100%, 240px); }.trainer { display: none; }.result-heading { display: block; }.text-button { margin-top: 18px; }.why { grid-template-columns: 1fr; gap: 3px; }.result-actions { justify-content: stretch; flex-direction: column; }.result-actions button { width: 100%; } }
.topbar { position: sticky; top: 0; z-index: 10; }
.annual-status { display: grid; gap: 6px; margin-top: 20px; padding: 18px; border: 1px solid #cbd8ca; border-radius: 10px; color: #395044; background: #eef5ec; }.annual-status p { margin: 0; color: #62806d; font: 500 10px 'DM Mono'; letter-spacing: .1em; }.annual-status strong { font: 600 23px/1.2 'Fraunces'; letter-spacing: -.03em; }.annual-status span { color: #587062; font-size: 13px; }.annual-status em { margin-top: 4px; color: #5a7060; font-size: 13px; font-style: normal; line-height: 1.45; }.phase-adjustment { margin-top: 13px; color: #637167; font-size: 12px; }.phase-adjustment summary { cursor: pointer; color: #52725e; text-decoration: underline; }.phase-adjustment label { display: grid; gap: 8px; margin-top: 12px; font-weight: 600; }.choice-row button.completed { border-color: #b8d6ba; background: #f0f8ef; }.choice-row button.completed small { color: #397148; }.choice-row button.completed.selected { border-color: #203d30; background: #203d30; }.choice-row button.completed.selected small { color: #d9f0d8; }
.field-grid small { color: #708076; font-size: 11px; font-weight: 400; line-height: 1.35; }.date-error { margin: 9px 0 -8px; color: #c34a2a; font-size: 12px; }
.field-grid label { align-content: start; }
.week-calendar { display: grid; gap: 10px; margin: -7px 0 28px; padding: 16px 17px; border: 1px solid #d7dfd3; border-radius: 10px; background: #f5f8f2; }.week-calendar p { margin: 0; color: #62806d; font: 500 10px 'DM Mono'; letter-spacing: .1em; }.week-calendar strong { color: #395044; font: 600 17px 'Fraunces'; }.week-calendar > div { display: grid; grid-template-columns: repeat(7, 1fr); gap: 7px; }.week-calendar button { display: grid; gap: 3px; justify-items: center; border: 1px solid #d5d8ce; border-radius: 7px; padding: 9px 4px; color: #587062; background: #fffefa; }.week-calendar button span { font: 500 10px 'DM Mono'; text-transform: uppercase; }.week-calendar button b { color: #203d30; font-size: 16px; }.week-calendar button.selected { border-color: #203d30; background: #203d30; }.week-calendar button.selected span,.week-calendar button.selected b { color: #fff; }.week-calendar > small { color: #708076; font-size: 11px; }
.date-picker { display: grid; gap: 9px; width: min(100%, 330px); margin: 10px 0 4px auto; padding: 13px; border: 1px solid #ccd8cb; border-radius: 9px; background: #fffefa; box-shadow: 0 8px 22px rgba(30, 51, 39, .08); }.date-picker-header { display: flex; justify-content: space-between; align-items: center; text-transform: capitalize; }.date-picker-header strong { color: #304b3b; font: 600 16px 'Fraunces'; }.date-picker-header button { width: 29px; height: 29px; border: 1px solid #d5d8ce; border-radius: 5px; color: #43604e; background: #f7f8f3; }.date-picker-weekdays,.date-picker-days { display: grid; grid-template-columns: repeat(7, 1fr); gap: 3px; text-align: center; }.date-picker-weekdays span { color: #7a8a7f; font: 500 10px 'DM Mono'; }.date-picker-days span { display: grid; min-height: 31px; }.date-picker-days button { border: 0; border-radius: 5px; color: #405a4a; background: transparent; font-size: 12px; }.date-picker-days button:hover:not(:disabled) { background: #eaf0e9; }.date-picker-days button.selected { color: #fff; background: #203d30; }.date-picker-days button:disabled { color: #c6cec5; cursor: not-allowed; }
.date-field { position: relative; }.date-field .date-picker { position: absolute; top: calc(100% + 8px); right: 0; z-index: 20; margin: 0; }
.annual-status small { color: #708076; font: 500 10px 'DM Mono'; letter-spacing: .02em; }
.choice-row .day-choice { display: grid; grid-template-columns: minmax(0, 1fr) auto; overflow: hidden; border: 1px solid #d5d8ce; border-radius: 8px; background: #fffefa; }.choice-row .day-choice-main { border: 0; border-radius: 0; }.choice-row .day-choice.selected { border-color: #203d30; background: #203d30; }.choice-row .day-choice.selected .day-choice-main { color: #fff; background: #203d30; }.choice-row .day-choice.selected .day-choice-main strong,.choice-row .day-choice.selected .day-choice-main small,.choice-row .day-choice.selected .day-choice-main em { color: #fff; }.choice-row .day-choice.completed { border-color: #b8d6ba; background: #f0f8ef; }.choice-row .day-choice.completed .day-choice-main { background: #f0f8ef; }.choice-row .day-choice.completed .day-choice-main small { color: #397148; }.choice-row .day-choice.completed.selected { border-color: #203d30; background: #203d30; }.choice-row .day-choice.completed.selected .day-choice-main { background: #203d30; }.choice-row .day-choice.completed.selected .day-choice-main small { color: #d9f0d8; }.day-choice-actions { display: flex; align-items: center; gap: 7px; padding: 10px 13px 10px 0; }.choice-row .day-date-button,.choice-row .day-history-button { display: block; width: auto; border: 1px solid #bdc8bd; border-radius: 6px; padding: 8px 9px; color: #365443; background: transparent; font-size: 12px; font-weight: 600; white-space: nowrap; }.choice-row .day-history-button { border-color: #aac6af; color: #397148; }.choice-row .day-choice.selected .day-date-button { border-color: #91ad9c; color: #fff; }.choice-row .day-choice.selected .day-history-button { border-color: #a8d5ac; color: #d9f0d8; }.date-modal-backdrop { position: fixed; z-index: 40; inset: 0; display: grid; place-items: center; padding: 22px; background: rgba(17, 31, 24, .38); }.date-modal { display: grid; gap: 12px; width: min(100%, 370px); padding: 18px; border: 1px solid #cbd8ca; border-radius: 12px; background: #fffefa; box-shadow: 0 24px 64px rgba(18, 35, 26, .25); }.date-modal-header { display: flex; justify-content: space-between; gap: 14px; align-items: flex-start; }.date-modal-header p { margin: 0 0 4px; color: #62806d; font: 500 10px 'DM Mono'; letter-spacing: .1em; }.date-modal-header strong { color: #395044; font: 600 20px/1.2 'Fraunces'; }.date-modal-header > button { flex: 0 0 auto; width: 30px; height: 30px; border: 1px solid #d5d8ce; border-radius: 6px; color: #43604e; background: #f7f8f3; font-size: 20px; line-height: 1; }.date-modal > small { color: #708076; font-size: 11px; line-height: 1.4; }
@media (max-width: 760px) { .choice-row .day-choice { grid-template-columns: 1fr; }.day-choice-actions { padding: 0 13px 12px 16px; }.choice-row .day-choice-main { grid-template-columns: 1fr auto; }.choice-row .day-choice-main span,.choice-row .day-choice-main em { grid-column: 1 / -1; } }
.day-date-picker { display: grid; grid-column: 1 / -1; gap: 9px; padding: 14px 16px 15px; border-top: 1px solid #d7dfd3; background: #f5f8f2; }.day-date-picker .date-picker-header { max-width: 330px; width: 100%; margin: auto; }.day-date-picker .date-picker-weekdays,.day-date-picker .date-picker-days { width: min(100%, 330px); margin: auto; }.day-date-picker > small { max-width: 330px; width: 100%; margin: auto; color: #708076; font-size: 11px; line-height: 1.4; }.choice-row .day-choice.selected .day-date-picker { border-color: #b6c9bc; background: #f5f8f2; }
.completion-toggle { display: inline-flex; align-items: center; gap: 6px; color: #587062; font-size: 12px; font-weight: 600; white-space: nowrap; }.completion-toggle input { width: 15px; height: 15px; margin: 0; padding: 0; accent-color: #397148; }.day-choice.selected .completion-toggle { color: #fff; }.pdf-button:disabled { border-color: #d5d8ce; color: #879087; background: #f4f5f0; cursor: not-allowed; }.pdf-button small { display: block; margin-top: 2px; font-size: 10px; font-weight: 500; }
.topbar-left { display: flex; align-items: center; gap: 28px; }.main-nav { display: flex; gap: 5px; }.main-nav button { border: 0; border-radius: 5px; padding: 7px 9px; color: #68756c; background: transparent; font-size: 13px; font-weight: 600; }.main-nav button:hover { color: #203d30; background: #eef2ec; }.main-nav button.active { color: #203d30; background: #e7eee6; }.annual-plan { max-width: 860px; }.annual-plan > .eyebrow { margin-top: 0; }.annual-plan h1 { margin: 0; letter-spacing: -.055em; font: 600 clamp(42px,6vw,62px)/.98 'Fraunces'; }.annual-plan-heading { display: flex; justify-content: space-between; align-items: flex-end; gap: 24px; }.annual-plan-heading p { max-width: 525px; margin: 14px 0 0; color: #657268; line-height: 1.55; }.annual-plan-heading .secondary-button { flex: 0 0 auto; }.annual-plan-summary { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1px; overflow: hidden; margin: 33px 0 18px; border: 1px solid #d6ded3; border-radius: 10px; background: #d6ded3; }.annual-plan-summary div { display: grid; gap: 5px; padding: 15px 17px; background: #f5f8f2; }.annual-plan-summary span,.phase-roadmap p,.annual-weeks button > span { color: #69806f; font: 500 10px 'DM Mono'; letter-spacing: .08em; }.annual-plan-summary strong { color: #314b3c; font: 600 17px 'Fraunces'; }.phase-roadmap { display: grid; grid-template-columns: repeat(6, 1fr); gap: 7px; margin-bottom: 25px; }.phase-roadmap article { display: grid; gap: 5px; min-height: 116px; padding: 13px; border: 1px solid #d7dfd3; border-radius: 8px; background: #fffefa; }.phase-roadmap article.active { border-color: #203d30; background: #e7eee6; }.phase-roadmap p { margin: 0; }.phase-roadmap strong { color: #304b3b; font: 600 16px/1.1 'Fraunces'; }.phase-roadmap span { color: #68776d; font-size: 11px; line-height: 1.35; }.annual-weeks { display: grid; grid-template-columns: repeat(3, 1fr); gap: 9px; }.annual-weeks button { display: grid; gap: 5px; min-height: 126px; padding: 14px; border: 1px solid #d5dcd3; border-radius: 9px; color: #526357; background: #fffefa; text-align: left; }.annual-weeks button:hover { border-color: #89a291; background: #f4f8f3; }.annual-weeks button.current { border-color: #203d30; background: #203d30; }.annual-weeks button.current > span,.annual-weeks button.current strong,.annual-weeks button.current small,.annual-weeks button.current em { color: #fff; }.annual-weeks button.pause { border-style: dashed; background: #f5f3ed; }.annual-weeks button.pause:disabled { color: #9aa39b; cursor: not-allowed; }.annual-weeks button.pause:disabled:hover { border-color: #d5dcd3; background: #f5f3ed; }.annual-weeks button strong { color: #304b3b; font: 600 18px/1.1 'Fraunces'; }.annual-weeks button small { color: #69776d; font: 500 11px 'DM Mono'; }.annual-weeks button em { margin-top: auto; color: #718078; font-size: 11px; font-style: normal; }
@media (max-width: 900px) { .phase-roadmap { grid-template-columns: repeat(3, 1fr); }.annual-weeks { grid-template-columns: repeat(2, 1fr); } }.topbar-left { min-width: 0; } @media (max-width: 760px) { .topbar { height: auto; min-height: 70px; padding-top: 10px; padding-bottom: 10px; }.topbar-left { gap: 14px; }.main-nav button { padding: 6px 7px; font-size: 12px; }.annual-plan-heading { display: grid; align-items: start; }.annual-plan-heading .secondary-button { justify-self: start; }.annual-plan-summary { grid-template-columns: 1fr; }.phase-roadmap { grid-template-columns: repeat(2, 1fr); }.annual-weeks { grid-template-columns: 1fr; }.trainer { display: none; } }
</style>
