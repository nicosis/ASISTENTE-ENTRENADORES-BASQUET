<script setup lang="ts">
type SessionBlock = { order: number; phase: string; exerciseId: string; exerciseSlug: string; title: string; duration: number; objective: string; description: string; why: string }
type PhysicalContext = { planName: string; status: string; message: string; phase: { id: string; name: string; objective: string; load: string; plyometrics: string }; weeklyStructure: readonly string[] }
type TrainingSession = { team: string; objective: string; duration: number; intensity: string; context: string; candidatesCount: number; rationale: string; physicalPlanCode: string | null; physicalContext: PhysicalContext | null; blocks: SessionBlock[] }

const trainerName = ref('')
const signedIn = ref(false)
const teams = [
  { id: 'EQU0001', name: 'Cadete A · U16' },
  { id: 'EQU0004', name: 'Cadete B · U16' },
]
const team = ref(teams[0].name)
const phaseId = ref('FIS0001')
const trainingDay = ref<'dia1' | 'dia2' | 'dia3'>('dia1')
const sessionsPerWeek = ref<2 | 3>(3)
const twoDayCycleIndex = ref(0)
const context = ref('')
const loading = ref(false)
const error = ref('')
const session = ref<TrainingSession | null>(null)
const savedCount = ref(0)
const notice = ref('')
const phases = [
  { id: 'FIS0001', name: 'Fundamentos' },
  { id: 'FIS0002', name: 'Fuerza base' },
  { id: 'FIS0003', name: 'Fuerza y potencia' },
  { id: 'FIS0004', name: 'Potencia reactiva' },
  { id: 'FIS0005', name: 'Transferencia' },
  { id: 'FIS0006', name: 'Mantenimiento final' },
]
type DayId = 'dia1' | 'dia2' | 'dia3'
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
const activePhasePreview = computed(() => phasePreviews[phaseId.value])
const twoDayCycles: DayId[][] = [
  ['dia1', 'dia2'],
  ['dia3', 'dia1'],
  ['dia2', 'dia3'],
]
const visiblePhysicalDays = computed(() => {
  if (sessionsPerWeek.value === 3) return physicalDays
  const currentCycle = twoDayCycles[twoDayCycleIndex.value]
  return physicalDays.filter((item) => currentCycle.includes(item.id))
})
const currentTwoDayCycle = computed(() => twoDayCycles[twoDayCycleIndex.value])
function changeFrequency(value: 2 | 3) {
  sessionsPerWeek.value = value
  if (!visiblePhysicalDays.value.some((item) => item.id === trainingDay.value)) trainingDay.value = visiblePhysicalDays.value[0].id
}
function advanceTwoDayCycle() {
  twoDayCycleIndex.value = (twoDayCycleIndex.value + 1) % twoDayCycles.length
  trainingDay.value = visiblePhysicalDays.value[0].id
}
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
  savedCount.value = Array.isArray(saved) ? saved.length : 0
}
async function generateTraining() {
  loading.value = true; error.value = ''; notice.value = ''
  try {
    session.value = await $fetch<TrainingSession>('/api/generate-training', { method: 'POST', body: { team: team.value, phaseId: phaseId.value, day: trainingDay.value, context: context.value } })
  } catch { error.value = 'No se pudo generar la propuesta. Inténtalo de nuevo.' } finally { loading.value = false }
}
function saveSession() {
  if (!session.value) return
  const saved = JSON.parse(localStorage.getItem('basket-beta-sessions') || '[]')
  saved.unshift({ ...session.value, savedAt: new Date().toISOString() })
  localStorage.setItem('basket-beta-sessions', JSON.stringify(saved))
  savedCount.value = saved.length; notice.value = 'Sesión guardada en este dispositivo.'
}
onMounted(() => {
  const savedTrainer = localStorage.getItem('basket-beta-trainer')
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
        <div class="brand"><span class="brand-ball">B</span><span>pizarra</span></div>
        <div class="topbar-right"><span class="beta-pill">BETA</span><span class="trainer">Hola, {{ trainerName }}</span><button class="sign-out-button" type="button" @click="signOut">Salir</button></div>
      </header>
      <div class="workspace">
        <aside class="side-panel">
          <p class="eyebrow">PLAN DE LAUDE</p><h2>Prepara la sesión física</h2>
          <p class="side-copy">Elige equipo, fase y día. La sesión sigue la progresión anual de referencia.</p>
          <div class="saved"><strong>{{ savedCount }}</strong><span>sesiones guardadas<br>en este dispositivo</span></div>
          <div class="beta-note"><span>✦</span> Esta beta usa el plan físico Cadete 2026-27 de Laude como fuente principal.</div>
        </aside>
        <section class="content-panel">
          <div v-if="!session" class="generator">
            <p class="eyebrow">PLAN FÍSICO · CADETE 2026-27</p><h1>Prepara la sesión física.</h1><p class="subhead">Selecciona la fase y el estímulo que quieres preparar.</p>
            <form @submit.prevent="generateTraining">
              <div class="field-grid">
                <label>Equipo<select v-model="team"><option v-for="item in teams" :key="item.id" :value="item.name">{{ item.name }}</option></select></label>
                <label>Fase física<select v-model="phaseId"><option v-for="item in phases" :key="item.id" :value="item.id">{{ item.name }}</option></select></label>
              </div>
              <section class="phase-preview" aria-live="polite"><p>VISTA PREVIA · {{ phases.find((item) => item.id === phaseId)?.name }}</p><strong>{{ activePhasePreview.focus }}</strong><span>Carga orientativa: {{ activePhasePreview.load }}</span></section>
              <fieldset class="frequency-selector"><legend>Sesiones físicas por semana</legend><div><button v-for="frequency in [2, 3]" :key="frequency" type="button" :class="{ selected: sessionsPerWeek === frequency }" @click="changeFrequency(frequency as 2 | 3)">{{ frequency }} días</button></div><p v-if="sessionsPerWeek === 2">Se alternan los tres estímulos para no dejar fuera prevención ni reactividad.</p><p v-else>Se conserva la estructura completa del plan de Laude.</p></fieldset>
              <section v-if="sessionsPerWeek === 2" class="rotation-note"><div><p>CICLO ACTUAL {{ twoDayCycleIndex + 1 }} DE 3</p><strong>{{ currentTwoDayCycle.map((day) => physicalDays.find((item) => item.id === day)?.label).join(' + ') }}</strong><span>El siguiente ciclo incorpora el estímulo que ahora queda fuera.</span></div><button type="button" @click="advanceTwoDayCycle">Cambiar ciclo</button></section>
              <fieldset><legend>Estímulo de la semana · contenido de esta fase</legend><div class="choice-row"><button v-for="item in visiblePhysicalDays" :key="item.id" type="button" :class="{ selected: trainingDay === item.id }" @click="trainingDay = item.id"><strong>{{ item.label }}</strong><span>{{ item.detail }}</span><small>{{ item.duration }}</small><em>{{ activePhasePreview.days[item.id] }}</em></button></div></fieldset>
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
            <div class="result-actions"><button class="secondary-button" @click="generateTraining">↻ Otra propuesta</button><button class="primary-button" @click="saveSession">Guardar sesión <span>→</span></button></div>
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
</style>
