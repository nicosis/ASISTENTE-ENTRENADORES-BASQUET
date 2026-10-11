<script setup lang="ts">
type SessionBlock = { order: number; phase: string; title: string; duration: number; objective: string; description: string; why: string }
type TrainingSession = { team: string; objective: string; duration: number; intensity: string; context: string; candidatesCount: number; rationale: string; blocks: SessionBlock[] }

const trainerName = ref('')
const signedIn = ref(false)
const team = ref('Cadete A · U16')
const objective = ref('Finalización')
const duration = ref(90)
const intensity = ref('Media')
const context = ref('')
const loading = ref(false)
const error = ref('')
const session = ref<TrainingSession | null>(null)
const savedCount = ref(0)
const notice = ref('')
const teams = ['Cadete A · U16', 'Infantil B · U14', 'Junior · U18']
const objectives = ['Finalización', 'Tiro', 'Defensa', 'Pase', 'Transición']
const durations = [60, 75, 90, 120]
const intensities = ['Baja', 'Media', 'Alta']

function enter() {
  if (!trainerName.value.trim()) return
  signedIn.value = true
  localStorage.setItem('basket-beta-trainer', trainerName.value.trim())
  loadSavedSessions()
}
function loadSavedSessions() {
  const saved = JSON.parse(localStorage.getItem('basket-beta-sessions') || '[]')
  savedCount.value = Array.isArray(saved) ? saved.length : 0
}
async function generateTraining() {
  loading.value = true; error.value = ''; notice.value = ''
  try {
    session.value = await $fetch<TrainingSession>('/api/generate-training', { method: 'POST', body: { team: team.value, objective: objective.value, duration: duration.value, intensity: intensity.value, context: context.value } })
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
        <div class="topbar-right"><span class="beta-pill">BETA</span><span class="trainer">Hola, {{ trainerName }}</span></div>
      </header>
      <div class="workspace">
        <aside class="side-panel">
          <p class="eyebrow">TU ESPACIO</p><h2>Prepara el próximo entrenamiento</h2>
          <p class="side-copy">Definí el contexto. Ordenamos la sesión a partir de ejercicios compatibles.</p>
          <div class="saved"><strong>{{ savedCount }}</strong><span>sesiones guardadas<br>en este dispositivo</span></div>
          <div class="beta-note"><span>✦</span> Esta beta usa una biblioteca de muestra. La próxima conexión será la de ejercicios reales de Lau.</div>
        </aside>
        <section class="content-panel">
          <div v-if="!session" class="generator">
            <p class="eyebrow">NUEVA SESIÓN</p><h1>¿Qué deseas trabajar hoy?</h1><p class="subhead">Elige las condiciones mínimas. Podrás ajustar la propuesta después.</p>
            <form @submit.prevent="generateTraining">
              <div class="field-grid">
                <label>Equipo<select v-model="team"><option v-for="item in teams" :key="item">{{ item }}</option></select></label>
                <label>Objetivo principal<select v-model="objective"><option v-for="item in objectives" :key="item">{{ item }}</option></select></label>
              </div>
              <fieldset><legend>Duración total</legend><div class="choice-row"><button v-for="item in durations" :key="item" type="button" :class="{ selected: duration === item }" @click="duration = item">{{ item }} min</button></div></fieldset>
              <fieldset><legend>Intensidad de la sesión</legend><div class="choice-row"><button v-for="item in intensities" :key="item" type="button" :class="{ selected: intensity === item }" @click="intensity = item">{{ item }}</button></div></fieldset>
              <label class="context-label">Contexto opcional<textarea v-model="context" rows="3" placeholder="Ej.: el equipo jugó ayer y tiene partido dentro de dos días."></textarea></label>
              <p v-if="error" class="error">{{ error }}</p>
              <button class="primary-button generate" type="submit" :disabled="loading">{{ loading ? 'Preparando propuesta…' : 'Generar entrenamiento' }} <span>→</span></button>
            </form>
          </div>
          <div v-else class="session-result">
            <div class="result-heading"><div><p class="eyebrow">PROPUESTA GENERADA</p><h1>Entrenamiento {{ session.team }}</h1></div><button class="text-button" @click="session = null">← Editar datos</button></div>
            <div class="summary"><span><strong>{{ session.duration }}</strong> min</span><span><strong>{{ session.objective }}</strong></span><span><strong>Intensidad {{ session.intensity }}</strong></span></div>
            <p v-if="session.context" class="context-summary">Contexto considerado: “{{ session.context }}”</p>
            <div class="rationale"><span>✦</span><p>{{ session.rationale }} <strong>{{ session.candidatesCount }} ejercicios compatibles</strong> analizados.</p></div>
            <ol class="session-list">
              <li v-for="block in session.blocks" :key="block.order" class="session-card">
                <div class="timeline"><span>{{ String(block.order).padStart(2, '0') }}</span><i /></div>
                <article><div class="card-top"><p>{{ block.phase }}</p><span>{{ block.duration }} min</span></div><h2>{{ block.title }}</h2><p class="card-objective">{{ block.objective }}</p><p>{{ block.description }}</p><div class="why"><strong>Motivo de la selección</strong><span>{{ block.why }}</span></div></article>
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
.app-shell { min-height: 100vh; background: #f4f2eb; }.welcome-panel { min-height: 100vh; max-width: 720px; padding: 11vh 32px 70px; margin: auto; }.brand-mark,.brand-ball { display: inline-grid; place-items: center; width: 35px; height: 35px; background: #ed6a45; color: white; border-radius: 50%; font: 700 18px 'Fraunces'; }.eyebrow { margin: 22px 0 11px; color: #69806f; font: 500 11px 'DM Mono'; letter-spacing: .11em; }.welcome-panel h1,.generator h1,.session-result h1 { margin: 0; letter-spacing: -.055em; font: 600 clamp(42px,7vw,70px)/.98 'Fraunces'; }.welcome-panel em { color: #ef704d; font-style: normal; }.intro { max-width: 510px; color: #59665e; font-size: 18px; line-height: 1.55; }.access-form { max-width: 440px; margin-top: 42px; }.access-form label,.field-grid label,.context-label { display: grid; gap: 8px; color: #4e5d52; font-size: 14px; font-weight: 600; } input,select,textarea { width: 100%; border: 1px solid #d5d8ce; border-radius: 8px; padding: 14px 15px; color: #17231d; background: #fffefa; outline-color: #ed6a45; } .access-form input { margin-bottom: 12px; font-size: 16px; }.primary-button { border: 0; border-radius: 7px; padding: 14px 18px; color: #fff; background: #203d30; font-weight: 700; transition: transform .2s, background .2s; }.primary-button:not(:disabled):hover { transform: translateY(-2px); background: #28523e; }.primary-button:disabled { opacity: .65; cursor: wait; }.primary-button span { margin-left: 14px; color: #f6b561; font-size: 20px; }.microcopy { color: #879087; font-size: 13px; }.topbar { display: flex; justify-content: space-between; align-items: center; height: 70px; padding: 0 clamp(22px,5vw,72px); border-bottom: 1px solid #dfe0d8; background: #fbfaf5; }.brand { display: flex; align-items: center; gap: 9px; font: 700 20px 'Fraunces'; letter-spacing: -.04em; }.brand-ball { width: 26px; height: 26px; font-size: 14px; }.topbar-right { display: flex; align-items: center; gap: 14px; color: #667267; font-size: 14px; }.beta-pill { padding: 4px 7px; color: #c34a2a; background: #ffeadf; border-radius: 4px; font: 500 10px 'DM Mono'; }.workspace { display: grid; grid-template-columns: minmax(240px, .8fr) minmax(0, 2fr); max-width: 1440px; min-height: calc(100vh - 70px); margin: auto; }.side-panel { padding: 60px clamp(24px,4vw,64px); border-right: 1px solid #dfe0d8; background: #e9eee7; }.side-panel .eyebrow { margin-top: 0; }.side-panel h2 { margin: 0; font: 600 clamp(28px,3vw,39px)/1.04 'Fraunces'; letter-spacing: -.045em; }.side-copy { color: #5c695f; line-height: 1.55; }.saved { display: flex; gap: 13px; align-items: center; margin-top: 42px; padding-top: 23px; border-top: 1px solid #cdd5ca; }.saved strong { color: #df5e3c; font: 700 32px 'Fraunces'; }.saved span { color: #5c695f; font-size: 12px; line-height: 1.35; }.beta-note { display: flex; gap: 10px; margin-top: 40px; padding: 14px; color: #526357; background: #f5f7f1; border-radius: 8px; font-size: 12px; line-height: 1.4; }.beta-note span,.rationale span { color: #e66b48; }.content-panel { padding: 60px clamp(24px,7vw,106px); background: #fbfaf5; }.generator { max-width: 690px; }.generator .eyebrow,.session-result .eyebrow { margin-top: 0; }.subhead { margin: 15px 0 38px; color: #657268; }.field-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 18px; } fieldset { margin: 28px 0; padding: 0; border: 0; } legend { margin-bottom: 11px; color: #4e5d52; font-size: 14px; font-weight: 600; }.choice-row { display: flex; flex-wrap: wrap; gap: 8px; }.choice-row button { border: 1px solid #d5d8ce; border-radius: 999px; padding: 9px 16px; color: #59665e; background: #fffefa; }.choice-row button.selected { border-color: #203d30; color: #fff; background: #203d30; }.context-label { margin: 30px 0 24px; }.generate { min-width: 250px; }.error { color: #c34a2a; }.result-heading { display: flex; justify-content: space-between; align-items: flex-start; gap: 20px; }.result-heading h1 { font-size: clamp(35px,5vw,56px); }.text-button { border: 0; padding: 7px 0; color: #52725e; background: transparent; text-decoration: underline; }.summary { display: flex; flex-wrap: wrap; gap: 9px; margin: 27px 0 12px; }.summary span { padding: 7px 10px; border-radius: 5px; color: #4a5e50; background: #eaf0e9; font-size: 13px; }.context-summary { color: #6a756d; font-size: 13px; font-style: italic; }.rationale { display: flex; gap: 12px; align-items: flex-start; margin: 29px 0; padding: 13px 15px; border-left: 3px solid #ef704d; background: #fff0e9; color: #5d514b; font-size: 13px; line-height: 1.5; }.rationale p { margin: 0; }.session-list { margin: 35px 0 25px; padding: 0; list-style: none; }.session-card { display: grid; grid-template-columns: 48px 1fr; gap: 18px; }.timeline { display: flex; flex-direction: column; align-items: center; color: #799081; font: 11px 'DM Mono'; }.timeline i { display: block; width: 1px; flex: 1; margin-top: 9px; background: #d6ddd3; }.session-card:last-child .timeline i { display: none; }.session-card article { margin-bottom: 18px; padding: 21px 24px; border: 1px solid #e0e1da; border-radius: 10px; background: #fffefa; box-shadow: 0 2px 0 rgba(25,40,30,.02); }.card-top { display: flex; justify-content: space-between; align-items: center; color: #7a8c7e; font: 11px 'DM Mono'; letter-spacing: .08em; }.card-top p { margin: 0; }.card-top span { padding: 4px 6px; color: #c34a2a; background: #fff0e9; border-radius: 4px; letter-spacing: 0; }.session-card h2 { margin: 9px 0 2px; font: 600 25px 'Fraunces'; letter-spacing: -.035em; }.session-card article > p { margin: 8px 0; color: #59665e; font-size: 14px; line-height: 1.5; }.session-card .card-objective { color: #304b3b; font-weight: 600; }.why { display: grid; grid-template-columns: 130px 1fr; gap: 10px; margin-top: 15px; padding-top: 13px; border-top: 1px solid #ecebe6; color: #68746c; font-size: 12px; line-height: 1.45; }.why strong { color: #597362; }.result-actions { display: flex; justify-content: flex-end; gap: 10px; }.secondary-button { border: 1px solid #bdc8bd; border-radius: 7px; padding: 12px 15px; color: #365443; background: transparent; font-weight: 600; }.saved-notice { color: #3c7a52; text-align: right; font-size: 13px; }
@media (max-width: 760px) { .workspace { grid-template-columns: 1fr; }.side-panel { padding: 30px 25px; border-right: 0; border-bottom: 1px solid #dfe0d8; }.side-copy,.beta-note { display: none; }.saved { margin-top: 19px; padding-top: 16px; }.content-panel { padding: 40px 22px; }.field-grid { grid-template-columns: 1fr; }.trainer { display: none; }.result-heading { display: block; }.text-button { margin-top: 18px; }.why { grid-template-columns: 1fr; gap: 3px; }.result-actions { justify-content: stretch; flex-direction: column; }.result-actions button { width: 100%; } }
</style>
