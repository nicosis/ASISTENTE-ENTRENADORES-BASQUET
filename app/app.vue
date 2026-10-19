<script setup lang="ts">
import {
  ageCategoryOptions,
  blockPalette,
  competitiveLevelOptions,
  formattedDate,
  useCoachWorkspace,
  weekdays,
} from '~/composables/useCoachWorkspace'

const {
  coach,
  loginName,
  signedIn,
  view,
  activeTeamTab,
  teams,
  seasons,
  activeTeam,
  activeSeason,
  frequency,
  activePlan,
  phases,
  currentWeekContext,
  currentPhase,
  weeklySessions,
  hydratedPreviewSession,
  homeWorkouts,
  seasonTests,
  activeExplorerBlock,
  currentWeekNumber,
  selectedDay,
  selectedBlockIdForExplorer,
  displayedWeekStart,
  canGoToPreviousWeek,
  canGoToNextWeek,
  weekLabel,
  sessionDates,
  activeWeekReview,
  seasonReviews,
  selectedHistoryReview,
  reviewDraft,
  reviewEditorOpen,
  historyModalOpen,
  selectedHistoryReviewId,
  teamDraft,
  seasonDraft,
  session,
  genericExerciseImage,
  loadingSession,
  error,
  signIn,
  signOut,
  openTeam,
  openCreateTeam,
  createTeam,
  toggleDraftDay,
  createSeason,
  moveWeek,
  selectPhaseWeek,
  saveReview,
  openReviewEditor,
  closeReviewEditor,
  openHistory,
  closeHistory,
  generateSession,
  inspectDayInTables,
} = useCoachWorkspace()
</script>

<template>
  <main class="app-shell">
    <header class="topbar">
      <button class="brand" type="button" @click="view = 'home'">
        <span class="brand-ball">B</span><span>pizarra</span>
      </button>
      <div class="topbar-right">
        <template v-if="signedIn">
          <span class="coach-avatar">{{ coach.name.slice(0, 1) }}</span>
          <span>{{ coach.name }}</span>
          <button class="logout-button" type="button" @click="signOut">
            Cerrar sesión
          </button>
        </template>
      </div>
    </header>

    <section v-if="!signedIn" class="page auth-page">
      <p class="eyebrow">SESIÓN CERRADA</p>
      <h1>Entra con tu perfil de entrenador.</h1>
      <p>El equipo y sus temporadas se conservan en este dispositivo.</p>
      <form class="login-form" @submit.prevent="signIn">
        <label>
          Nombre del entrenador
          <input
            v-model="loginName"
            required
            autocomplete="name"
            placeholder="Ej. Nicolás"
          />
        </label>
        <button class="primary-button" type="submit">Entrar</button>
      </form>
    </section>

    <section v-else-if="view === 'home'" class="page home-page">
      <p class="eyebrow">PANEL DEL ENTRENADOR</p>
      <div class="heading-row">
        <div>
          <h1>Mis equipos.</h1>
          <p>
            Abre una temporada para explorar las fases del año, sus sesiones por
            bloques y las relaciones entre tablas en local.
          </p>
        </div>
        <button class="primary-button" type="button" @click="openCreateTeam">
          + Crear equipo
        </button>
      </div>
      <section class="team-grid">
        <button
          v-for="team in teams"
          :key="team.id"
          class="team-card"
          type="button"
          @click="openTeam(team.id)"
        >
          <span>{{ team.id }}</span>
          <h2>{{ team.name }}</h2>
          <p>{{ team.club }}</p>
          <div>
            <strong>{{
              seasons.find(
                (item) => item.teamId === team.id && item.status === 'active',
              )?.category || 'Sin temporada activa'
            }}</strong>
            <small>{{ team.players.length }} jugadores</small>
          </div>
          <em>Abrir planificación anual →</em>
        </button>
      </section>
      <section v-if="!teams.length" class="empty-state">
        <h2>Tu primer equipo empieza aquí.</h2>
        <p>
          Crea su ficha, añade la plantilla y después configura la temporada.
        </p>
        <button class="primary-button" type="button" @click="openCreateTeam">
          Crear equipo
        </button>
      </section>
    </section>

    <section v-else-if="view === 'create-team'" class="page form-page">
      <button class="back" type="button" @click="view = 'home'">
        ← Mis equipos
      </button>
      <p class="eyebrow">PASO 1 DE 2 · EQUIPO</p>
      <h1>Crea la ficha del equipo.</h1>
      <p>Estos datos se mantienen aunque cambie la temporada.</p>
      <form @submit.prevent="createTeam">
        <label>
          Nombre identificativo
          <input
            v-model="teamDraft.name"
            required
            placeholder="Ej. Cadete A"
          />
        </label>
        <label>
          Club
          <input
            v-model="teamDraft.club"
            placeholder="Ej. Club Baloncesto Norte"
          />
        </label>
        <label>
          Jugadores <small>Uno por línea. Puedes completarlo después.</small>
          <textarea
            v-model="teamDraft.players"
            rows="6"
            placeholder="Álex Martín&#10;Bruno López&#10;Dani Ruiz"
          ></textarea>
        </label>
        <button class="primary-button" type="submit">
          Continuar a la temporada →
        </button>
      </form>
    </section>

    <section v-else-if="view === 'create-season'" class="page form-page">
      <button class="back" type="button" @click="view = 'home'">
        ← Mis equipos
      </button>
      <p class="eyebrow">PASO 2 DE 2 · TEMPORADA ANUAL</p>
      <h1>Define {{ activeTeam?.name }}.</h1>
      <p>
        Categoría, nivel competitivo y frecuencia semanal determinan el plan
        anual reutilizable (`plans` → `plan_phases` → `phase_sessions`).
      </p>
      <form @submit.prevent="createSeason">
        <div class="form-grid">
          <label>
            Nombre de temporada
            <input v-model="seasonDraft.name" placeholder="2026-27" />
          </label>
          <label>
            Categoría formativa
            <select v-model="seasonDraft.ageCategory" class="form-select">
              <option
                v-for="opt in ageCategoryOptions"
                :key="opt.value"
                :value="opt.value"
              >
                {{ opt.label }}
              </option>
            </select>
          </label>
          <label>
            Nivel competitivo / Intensidad
            <select v-model="seasonDraft.competitiveLevel" class="form-select">
              <option
                v-for="opt in competitiveLevelOptions"
                :key="opt.value"
                :value="opt.value"
              >
                {{ opt.label }}
              </option>
            </select>
          </label>
          <label>
            Inicio de temporada
            <input v-model="seasonDraft.startsAt" type="date" required />
          </label>
          <label>
            Final de temporada
            <input
              v-model="seasonDraft.endsAt"
              type="date"
              :min="seasonDraft.startsAt"
              required
            />
          </label>
        </div>
        <fieldset>
          <legend>
            Días de entrenamiento físico <small>Elige 1, 2 o 3 días.</small>
          </legend>
          <div class="day-pills">
            <label v-for="day in weekdays" :key="day">
              <input
                type="checkbox"
                :checked="seasonDraft.trainingDays.includes(day)"
                :disabled="
                  !seasonDraft.trainingDays.includes(day) &&
                  seasonDraft.trainingDays.length >= 3
                "
                @change="toggleDraftDay(day)"
              />
              <span>{{ day }}</span>
            </label>
          </div>
        </fieldset>
        <label>
          Contexto inicial
          <textarea
            v-model="seasonDraft.context"
            rows="3"
            placeholder="Objetivos, experiencia del grupo, material disponible…"
          ></textarea>
        </label>
        <button class="primary-button" type="submit">
          Generar plan anual →
        </button>
      </form>
    </section>

    <section v-else-if="view === 'team'" class="page team-page">
      <button class="back" type="button" @click="view = 'home'">
        ← Mis equipos
      </button>
      <div class="team-heading">
        <div>
          <p class="eyebrow">
            {{ activeTeam?.id }} · TEMPORADA {{ activeSeason?.name }} · PLAN ID:
            {{ activePlan.id }}
          </p>
          <h1>{{ activeTeam?.name }}</h1>
          <p>{{ activeSeason?.category }} · {{ activeTeam?.club }}</p>
        </div>
        <button
          class="secondary-button"
          type="button"
          @click="view = 'create-season'"
        >
          Nueva temporada
        </button>
      </div>

      <section class="season-summary">
        <div>
          <span>CATEGORÍA Y NIVEL</span>
          <strong>{{ activeSeason?.category || '—' }}</strong>
        </div>
        <div>
          <span>ENTRENOS (`frequency`)</span>
          <strong>
            {{ frequency }} {{ frequency === 1 ? 'día' : 'días' }} / semana ({{
              activeSeason?.trainingDays.join(', ')
            }})
          </strong>
        </div>
        <div>
          <span>PERIODO</span>
          <strong>{{
            activeSeason
              ? `${formattedDate(activeSeason.startsAt)} – ${formattedDate(activeSeason.endsAt)}`
              : '—'
          }}</strong>
        </div>
        <div>
          <span>PLANTILLA</span>
          <strong>{{ activeTeam?.players.length || 0 }} jugadores</strong>
        </div>
      </section>

      <!-- Línea de tiempo de Fases del Año (`plan_phases`) -->
      <section class="phases-strip">
        <div class="phases-header">
          <div>
            <p class="eyebrow">ESTRUCTURA ANUAL · TABLA `plan_phases`</p>
            <h3>Fases de la temporada (haz clic en una fase o semana)</h3>
          </div>
          <span class="phase-badge" :style="{ background: currentPhase.color }">
            {{ currentPhase.name }} · Semana {{ currentWeekNumber }} (Carga
            {{ currentWeekContext.loadIndex }}/10{{
              currentWeekContext.isDeload ? ' · Descarga' : ''
            }})
          </span>
        </div>

        <div class="phase-cards-row">
          <button
            v-for="ph in phases"
            :key="ph.id"
            type="button"
            class="phase-pill-card"
            :class="{ active: ph.id === currentPhase.id }"
            :style="{ '--phase-color': ph.color }"
            @click="selectPhaseWeek(ph.weekStart)"
          >
            <div class="phase-pill-top">
              <strong>{{ ph.name }}</strong>
              <small>Sem {{ ph.weekStart }}–{{ ph.weekEnd }}</small>
            </div>
            <p>{{ ph.objective }}</p>
            <div class="week-dots">
              <span
                v-for="(load, idx) in ph.weeklyLoads"
                :key="idx"
                class="week-dot"
                :class="{
                  current: ph.weekStart + idx === currentWeekNumber,
                }"
                :title="`Semana ${ph.weekStart + idx} · Carga ${load}/10`"
                @click.stop="selectPhaseWeek(ph.weekStart + idx)"
              >
                S{{ ph.weekStart + idx }}
              </span>
            </div>
          </button>
        </div>
      </section>

      <!-- Navegación de pestañas locales -->
      <nav class="subtabs" aria-label="Vistas del plan">
        <button
          type="button"
          :class="{ active: activeTeamTab === 'week' }"
          @click="activeTeamTab = 'week'"
        >
          Sesiones de la semana (S{{ currentWeekNumber }})
        </button>
        <button
          type="button"
          :class="{ active: activeTeamTab === 'tables' }"
          @click="activeTeamTab = 'tables'"
        >
          Conexión de Tablas (PK → FK en vivo)
        </button>
        <button
          type="button"
          :class="{ active: activeTeamTab === 'holidays-tests' }"
          @click="activeTeamTab = 'holidays-tests'"
        >
          Vacaciones ({{ homeWorkouts.length }}) y Tests ({{
            seasonTests.length
          }})
        </button>
      </nav>

      <!-- PESTAÑA 1: SESIONES DE LA SEMANA -->
      <template v-if="activeTeamTab === 'week'">
        <section class="section-heading">
          <div>
            <p class="eyebrow">
              SEMANA {{ currentWeekNumber }} DE {{ activePlan.totalWeeks }} ·
              {{ currentPhase.id }}
            </p>
            <h2>{{ currentPhase.name }}</h2>
            <span>
              Semana del {{ weekLabel }} ·
              {{ currentPhase.weeklyProgressionNote }}
            </span>
          </div>
          <nav class="week-navigation" aria-label="Cambiar de semana">
            <button
              type="button"
              :disabled="!canGoToPreviousWeek"
              @click="moveWeek(-1)"
            >
              ← Semana anterior
            </button>
            <button
              type="button"
              :disabled="!canGoToNextWeek"
              @click="moveWeek(1)"
            >
              Siguiente semana →
            </button>
          </nav>
        </section>

        <div class="phase-rules-banner">
          <span
            v-for="rule in currentPhase.loadRules"
            :key="rule"
            class="rule-chip"
          >
            {{ rule }}
          </span>
          <span class="rule-chip plio-chip">
            Pliometría: {{ currentPhase.plioRule }}
          </span>
        </div>

        <section
          v-if="currentPhase.type === 'holiday'"
          class="holiday-notice-card"
        >
          <p class="eyebrow">SEMANA DE RECESO · TABLA `home_sessions`</p>
          <h3>Descanso de pista: trabajo autónomo en casa</h3>
          <p>
            Esta semana ({{ weekLabel }}) corresponde a vacaciones. Los
            jugadores realizan las 3 sesiones sin material (A, B y C).
          </p>
          <button
            class="primary-button"
            type="button"
            @click="activeTeamTab = 'holidays-tests'"
          >
            Ver sesiones en casa →
          </button>
        </section>

        <section v-else class="session-grid">
          <article v-for="(item, index) in weeklySessions" :key="item.id">
            <span>
              SESIÓN {{ index + 1 }} · ID: {{ item.id }} ({{
                item.day.toUpperCase()
              }})
            </span>
            <h3>{{ item.name }}</h3>
            <p class="session-focus">{{ item.focus }}</p>
            <p>
              {{ activeSeason?.trainingDays[index] }} ·
              {{ formattedDate(sessionDates[index] || displayedWeekStart) }} ·
              <strong>{{ item.totalMinutes }} min</strong>
            </p>
            <div class="card-actions">
              <button
                class="primary-button"
                type="button"
                :disabled="loadingSession"
                @click="generateSession(item.day)"
              >
                {{
                  loadingSession && selectedDay === item.day
                    ? 'Preparando…'
                    : 'Abrir bloques y ejercicios →'
                }}
              </button>
              <button
                class="secondary-button"
                type="button"
                @click="inspectDayInTables(item.day)"
              >
                Ver en tablas
              </button>
            </div>
          </article>
        </section>
      </template>

      <!-- PESTAÑA 2: EXPLORADOR DE TABLAS RELACIONALES EN VIVO -->
      <template v-else-if="activeTeamTab === 'tables'">
        <section class="tables-explorer">
          <div class="explorer-intro">
            <div>
              <p class="eyebrow">ARQUITECTURA RELACIONAL EN VIVO</p>
              <h2>Cómo se conectan las 6 tablas principales</h2>
              <p>
                Cambia el día o haz clic en otro bloque para ver cómo viaja la
                clave primaria (`id`) hacia la clave foránea (`*_id`) de la
                siguiente tabla.
              </p>
            </div>
            <div class="day-selector-inline">
              <span>Día activo:</span>
              <button
                v-for="(sess, idx) in weeklySessions"
                :key="sess.id"
                type="button"
                :class="{ active: selectedDay === sess.day }"
                @click="selectedDay = sess.day"
              >
                Día {{ idx + 1 }} ({{ sess.day }})
              </button>
            </div>
          </div>

          <div class="relational-chain">
            <!-- Tabla 1: plans -->
            <div class="table-box">
              <header>
                <span class="table-num">TABLA 1 · `plans`</span>
                <code>PK: id = "{{ activePlan.id }}"</code>
              </header>
              <div class="mini-table-wrap">
                <table class="mini-table">
                  <thead>
                    <tr>
                      <th>id (PK)</th>
                      <th>age_category</th>
                      <th>competitive_level</th>
                      <th>frequency</th>
                      <th>name</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr class="highlighted-row">
                      <td><code>{{ activePlan.id }}</code></td>
                      <td>{{ activePlan.ageCategory }}</td>
                      <td>{{ activePlan.competitiveLevel }}</td>
                      <td>{{ activePlan.frequency }}</td>
                      <td>{{ activePlan.name }}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <div class="chain-arrow">
              ↓ <code>plan_phases.plan_id = "{{ activePlan.id }}"</code> (y
              Semana {{ currentWeekNumber }} está entre `week_start` y
              `week_end`)
            </div>

            <!-- Tabla 2: plan_phases -->
            <div class="table-box">
              <header>
                <span class="table-num">TABLA 2 · `plan_phases`</span>
                <code>PK: id = "{{ currentPhase.id }}"</code>
              </header>
              <div class="mini-table-wrap">
                <table class="mini-table">
                  <thead>
                    <tr>
                      <th>id (PK)</th>
                      <th>plan_id (FK)</th>
                      <th>name</th>
                      <th>week_start..end</th>
                      <th>weekly_loads</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr
                      v-for="ph in phases"
                      :key="ph.id"
                      :class="{ 'highlighted-row': ph.id === currentPhase.id }"
                      @click="selectPhaseWeek(ph.weekStart)"
                    >
                      <td><code>{{ ph.id }}</code></td>
                      <td><code>{{ ph.planId }}</code></td>
                      <td>{{ ph.name }}</td>
                      <td>Sem {{ ph.weekStart }} a {{ ph.weekEnd }}</td>
                      <td>{{ ph.weeklyLoads.join(', ') }}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <div class="chain-arrow">
              ↓
              <code
                >phase_sessions.phase_id = "{{
                  hydratedPreviewSession.session.phaseId
                }}"</code
              >
              + <code>day = "{{ selectedDay }}"</code>
            </div>

            <!-- Tabla 3: phase_sessions -->
            <div class="table-box">
              <header>
                <span class="table-num">TABLA 3 · `phase_sessions`</span>
                <code
                  >PK: id = "{{ hydratedPreviewSession.session.id }}"</code
                >
              </header>
              <div class="mini-table-wrap">
                <table class="mini-table">
                  <thead>
                    <tr>
                      <th>id (PK)</th>
                      <th>phase_id (FK)</th>
                      <th>day</th>
                      <th>name</th>
                      <th>total_minutes</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr
                      v-for="sess in weeklySessions"
                      :key="sess.id"
                      :class="{
                        'highlighted-row':
                          sess.id === hydratedPreviewSession.session.id,
                      }"
                      @click="selectedDay = sess.day"
                    >
                      <td><code>{{ sess.id }}</code></td>
                      <td><code>{{ sess.phaseId }}</code></td>
                      <td>{{ sess.day }}</td>
                      <td>{{ sess.name }}</td>
                      <td>{{ sess.totalMinutes }} min</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <div class="chain-arrow">
              ↓
              <code
                >session_blocks.session_id = "{{
                  hydratedPreviewSession.session.id
                }}"</code
              >
              (haz clic en un bloque para ver sus ejercicios)
            </div>

            <!-- Tabla 4: session_blocks -->
            <div class="table-box">
              <header>
                <span class="table-num">TABLA 4 · `session_blocks`</span>
                <code>PK seleccionada: "{{ activeExplorerBlock?.id }}"</code>
              </header>
              <div class="mini-table-wrap">
                <table class="mini-table">
                  <thead>
                    <tr>
                      <th>id (PK)</th>
                      <th>session_id (FK)</th>
                      <th>order</th>
                      <th>name</th>
                      <th>minutes</th>
                      <th>format</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr
                      v-for="blk in hydratedPreviewSession.blocks"
                      :key="blk.id"
                      :class="{
                        'highlighted-row':
                          blk.id === activeExplorerBlock?.id,
                      }"
                      @click="selectedBlockIdForExplorer = blk.id"
                    >
                      <td><code>{{ blk.id }}</code></td>
                      <td><code>{{ blk.sessionId }}</code></td>
                      <td>{{ blk.blockOrder }}</td>
                      <td>{{ blk.name }}</td>
                      <td>{{ blk.minutes }}'</td>
                      <td>{{ blk.format }}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <div class="chain-arrow">
              ↓
              <code
                >block_exercises.block_id = "{{
                  activeExplorerBlock?.id
                }}"</code
              >
              JOIN <code>exercises.id</code>
            </div>

            <!-- Tabla 5 y 6: block_exercises + exercises -->
            <div class="table-box">
              <header>
                <span class="table-num">
                  TABLA 5 (`block_exercises`) + TABLA 6 (`exercises`)
                </span>
                <code>{{ activeExplorerBlock?.items.length || 0 }} filas</code>
              </header>
              <div class="mini-table-wrap">
                <table class="mini-table">
                  <thead>
                    <tr>
                      <th>block_id (FK)</th>
                      <th>station_label</th>
                      <th>dose (en block_exercises)</th>
                      <th>exercise_id (FK → PK)</th>
                      <th>exercise.name (Catálogo)</th>
                      <th>exercise.cue</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr
                      v-for="item in activeExplorerBlock?.items"
                      :key="item.id"
                      class="highlighted-row"
                    >
                      <td><code>{{ item.blockId }}</code></td>
                      <td>{{ item.stationLabel }}</td>
                      <td><strong>{{ item.dose }}</strong></td>
                      <td><code>{{ item.exerciseId }}</code></td>
                      <td>{{ item.exercise.name }}</td>
                      <td>{{ item.exercise.cue }}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </section>
      </template>

      <!-- PESTAÑA 3: VACACIONES Y TESTS -->
      <template v-else-if="activeTeamTab === 'holidays-tests'">
        <section class="holidays-tests-grid">
          <div class="panel-box">
            <p class="eyebrow">TABLA 7 · `home_sessions` (VACACIONES)</p>
            <h2>Trabajo autónomo en casa</h2>
            <p class="panel-lead">
              Sesiones sin material para los recesos de Navidad (Dosis 1) y
              Semana Santa (Dosis 2, más exigente).
            </p>
            <div class="home-cards">
              <article
                v-for="item in homeWorkouts"
                :key="item.id"
                class="home-card"
              >
                <div class="home-card-top">
                  <span>{{ item.name }} · {{ item.minutes }}'</span>
                  <code>FK: {{ item.exerciseId }}</code>
                </div>
                <h3>{{ item.exercise.name }}</h3>
                <p class="home-format">{{ item.format }}</p>
                <div class="dose-comparison">
                  <div>
                    <small>Receso 1 (Navidad)</small>
                    <strong>{{ item.doseHoliday1 }}</strong>
                  </div>
                  <div>
                    <small>Receso 2 (Semana Santa)</small>
                    <strong>{{ item.doseHoliday2 }}</strong>
                  </div>
                </div>
              </article>
            </div>
          </div>

          <div class="panel-box">
            <p class="eyebrow">TABLA 8 · `tests` (CONTROL DE TEMPORADA)</p>
            <h2>Batería de evaluaciones</h2>
            <p class="panel-lead">
              Se realizan 3 veces al año (Semana 1, Semana 13 y Semana 18) para
              medir el progreso real del equipo.
            </p>
            <div class="test-cards">
              <article
                v-for="test in seasonTests"
                :key="test.id"
                class="test-card"
              >
                <div class="home-card-top">
                  <span>TEST 0{{ test.testOrder }}</span>
                  <code>PK: {{ test.id }}</code>
                </div>
                <h3>{{ test.name }}</h3>
                <p>{{ test.protocol }}</p>
                <div class="milestone-chips">
                  <span v-for="mw in test.milestoneWeeks" :key="mw">
                    {{ mw }}
                  </span>
                </div>
              </article>
            </div>
          </div>
        </section>
      </template>

      <section class="review-section">
        <div>
          <p class="eyebrow">NOTAS SEMANALES</p>
          <h2>Seguimiento del equipo.</h2>
          <span>
            {{ seasonReviews.length }}
            {{
              seasonReviews.length === 1 ? 'nota guardada' : 'notas guardadas'
            }}
            en esta temporada.
          </span>
        </div>
        <div class="review-buttons">
          <button
            class="secondary-button"
            type="button"
            @click="openReviewEditor"
          >
            {{ activeWeekReview ? 'Editar nota' : 'Añadir nota' }}
          </button>
          <button
            class="secondary-button"
            type="button"
            :disabled="!seasonReviews.length"
            @click="openHistory"
          >
            Ver historial
          </button>
        </div>
      </section>

      <section v-if="reviewEditorOpen" class="note-editor">
        <div>
          <p class="eyebrow">
            {{ activeWeekReview ? 'EDITAR NOTA' : 'NUEVA NOTA' }}
          </p>
          <h2>Semana del {{ formattedDate(displayedWeekStart) }}.</h2>
        </div>
        <div>
          <textarea
            v-model="reviewDraft"
            rows="4"
            placeholder="Carga percibida, asistencia, progresos, molestias…"
          ></textarea>
          <div class="review-actions">
            <button class="back" type="button" @click="closeReviewEditor">
              Cancelar
            </button>
            <button class="primary-button" type="button" @click="saveReview">
              Guardar nota
            </button>
          </div>
        </div>
      </section>
      <p v-if="error" class="error">{{ error }}</p>
    </section>

    <div
      v-if="historyModalOpen"
      class="modal-backdrop"
      @click.self="closeHistory"
    >
      <section
        class="history-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="history-title"
      >
        <button
          class="close"
          type="button"
          aria-label="Cerrar historial"
          @click="closeHistory"
        >
          Cerrar ×
        </button>
        <p class="eyebrow">HISTORIAL DE NOTAS</p>
        <h2 id="history-title">Seguimiento de la temporada.</h2>
        <div class="history-layout">
          <nav class="history-navigation" aria-label="Notas por semana">
            <button
              v-for="review in seasonReviews"
              :key="review.id"
              type="button"
              :class="{ active: selectedHistoryReview?.id === review.id }"
              @click="selectedHistoryReviewId = review.id"
            >
              Semana del {{ formattedDate(review.weekStart) }}
            </button>
          </nav>
          <article v-if="selectedHistoryReview" class="history-note">
            <p class="eyebrow">
              SEMANA DEL {{ formattedDate(selectedHistoryReview.weekStart) }}
            </p>
            <p>{{ selectedHistoryReview.text }}</p>
          </article>
        </div>
      </section>
    </div>

    <!-- VISTA DETALLADA DE LA SESIÓN (Bloques de tiempo + Ejercicios) -->
    <section v-if="view === 'session' && session" class="page session-page">
      <button
        class="back"
        type="button"
        @click="
          view = 'team';
          session = null;
        "
      >
        ← Volver a la semana {{ session.weekNumber }}
      </button>
      <p class="eyebrow">
        {{ session.plan.id }} → {{ session.phase.id }} →
        {{ session.session.id }} · {{ session.duration }} MINUTOS TOTALES
      </p>
      <h1>{{ session.objective }}</h1>
      <p class="session-rationale">{{ session.rationale }}</p>

      <!-- Barra de distribución de minutos por bloque (`session_blocks`) -->
      <div class="timebar-wrap">
        <span class="eyebrow">
          DISTRIBUCIÓN DE BLOQUES (`session_blocks`)
        </span>
        <div class="session-timebar">
          <div
            v-for="(blk, idx) in session.sessionBlocks"
            :key="blk.id"
            :style="{
              flex: blk.minutes,
              background: blockPalette[idx % blockPalette.length],
            }"
          >
            {{ blk.name }} ({{ blk.minutes }}')
          </div>
        </div>
      </div>

      <div class="blocks-stack">
        <section
          v-for="blk in session.sessionBlocks"
          :key="blk.id"
          class="session-block-card"
        >
          <header class="session-block-header">
            <div>
              <span class="eyebrow">
                BLOQUE {{ blk.blockOrder }} · ID: {{ blk.id }}
              </span>
              <h2>{{ blk.name }}</h2>
              <p>{{ blk.format }}</p>
            </div>
            <strong class="block-minutes-badge">{{ blk.minutes }} min</strong>
          </header>

          <ol class="exercise-list">
            <li
              v-for="item in blk.items"
              :key="item.id"
              class="exercise-card"
            >
              <a
                class="exercise-image"
                :href="genericExerciseImage"
                target="_blank"
                rel="noopener"
                :aria-label="`Ver imagen grande de ${item.exercise.name}`"
              >
                <img
                  :src="genericExerciseImage"
                  alt="Ilustración genérica de ejercicio"
                />
                <span>{{ item.exercise.id }}</span>
              </a>
              <div class="exercise-content">
                <div class="exercise-meta-top">
                  <span>
                    {{ item.stationLabel }} · {{ item.exercise.category }}
                  </span>
                  <code>Material: {{ item.exercise.material }}</code>
                </div>
                <h3>{{ item.exercise.name }}</h3>
                <strong class="dose-pill">Dosis: {{ item.dose }}</strong>
                <p class="cue-highlight">
                  <strong>Clave del entrenador:</strong>
                  {{ item.exercise.cue }}
                </p>
                <ul class="how-list">
                  <li v-for="step in item.exercise.how" :key="step">
                    {{ step }}
                  </li>
                </ul>
                <div class="progression-row">
                  <span>
                    <strong>Más fácil:</strong> {{ item.exercise.easier }}
                  </span>
                  <span>
                    <strong>Más difícil:</strong> {{ item.exercise.harder }}
                  </span>
                </div>
              </div>
            </li>
          </ol>
        </section>
      </div>
    </section>
  </main>
</template>

<style>
:root {
  --bg: #f5f3ec;
  --surface: #fffefa;
  --ink: #1e382b;
  --muted: #647168;
  --line: #d9ded5;
  --soft: #e9f0e6;
  --accent: #e66b48;
  --button: #203d30;
}
* {
  box-sizing: border-box;
}
body {
  margin: 0;
  background: var(--bg);
  color: var(--ink);
  font-family: Inter, ui-sans-serif, system-ui, sans-serif;
}
button,
input,
select,
textarea {
  font: inherit;
}
button {
  cursor: pointer;
}
.app-shell {
  min-height: 100vh;
}
.topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 72px;
  padding: 0 clamp(22px, 5vw, 76px);
  border-bottom: 1px solid var(--line);
  background: rgba(255, 254, 250, 0.92);
}
.brand {
  display: flex;
  align-items: center;
  gap: 9px;
  border: 0;
  color: var(--ink);
  background: transparent;
  font:
    700 21px Georgia,
    serif;
}
.brand-ball,
.coach-avatar {
  display: grid;
  place-items: center;
  border-radius: 50%;
  color: #fff;
  background: var(--accent);
}
.brand-ball {
  width: 28px;
  height: 28px;
  font-size: 14px;
}
.coach-avatar {
  width: 29px;
  height: 29px;
  background: var(--button);
  font-size: 12px;
  font-weight: 700;
}
.topbar-right {
  display: flex;
  align-items: center;
  gap: 9px;
  color: var(--muted);
  font-size: 14px;
}
.logout-button {
  margin-left: 8px;
  border: 0;
  border-bottom: 1px solid currentColor;
  padding: 3px 0;
  color: var(--muted);
  background: transparent;
  font-size: 12px;
}
.logout-button:hover {
  color: var(--ink);
}
.auth-page {
  max-width: 560px;
}
.auth-page h1 {
  margin: 0;
  font:
    600 clamp(38px, 6vw, 56px) / 1 Georgia,
    serif;
  letter-spacing: -0.045em;
}
.auth-page > p:not(.eyebrow) {
  margin: 16px 0 28px;
  color: var(--muted);
  line-height: 1.5;
}
.login-form {
  display: grid;
  gap: 15px;
  width: min(100%, 360px);
}
.login-form label {
  display: grid;
  gap: 7px;
  color: var(--muted);
  font-size: 13px;
  font-weight: 700;
}
.login-form input {
  width: 100%;
  border: 1px solid var(--line);
  border-radius: 8px;
  padding: 11px 12px;
  color: var(--ink);
  background: var(--surface);
}
.login-form .primary-button {
  justify-self: start;
}
.page {
  width: min(1080px, calc(100% - 44px));
  margin: 0 auto;
  padding: 54px 0 90px;
}
.eyebrow {
  margin: 0 0 8px;
  color: #62806d;
  font-size: 11px;
  font-weight: 750;
  letter-spacing: 0.1em;
}
.heading-row,
.team-heading {
  display: flex;
  justify-content: space-between;
  align-items: end;
  gap: 28px;
}
.heading-row h1,
.form-page h1,
.team-heading h1 {
  margin: 0;
  font:
    600 clamp(40px, 6vw, 62px) / 0.96 Georgia,
    serif;
  letter-spacing: -0.05em;
}
.heading-row p,
.form-page > p,
.team-heading > div > p {
  max-width: 560px;
  color: var(--muted);
  line-height: 1.55;
}
.primary-button,
.secondary-button {
  border-radius: 8px;
  padding: 11px 14px;
  font-weight: 700;
  font-size: 13px;
}
.primary-button {
  border: 1px solid var(--button);
  color: #fff;
  background: var(--button);
}
.secondary-button {
  border: 1px solid #bdc8bd;
  color: #365443;
  background: transparent;
}
.primary-button:hover {
  background: #315744;
}
.team-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 14px;
  margin-top: 38px;
}
.team-card {
  display: grid;
  gap: 8px;
  min-height: 235px;
  padding: 20px;
  border: 1px solid var(--line);
  border-radius: 13px;
  color: var(--ink);
  background: var(--surface);
  text-align: left;
  transition:
    transform 0.18s,
    border-color 0.18s;
}
.team-card:hover {
  transform: translateY(-3px);
  border-color: #829b87;
}
.team-card > span,
.team-card em {
  color: #69806f;
  font-size: 11px;
  font-style: normal;
  font-weight: 700;
  letter-spacing: 0.06em;
}
.team-card h2 {
  margin: 5px 0 0;
  font:
    600 27px Georgia,
    serif;
  letter-spacing: -0.04em;
}
.team-card p {
  margin: 0;
  color: var(--muted);
  font-size: 13px;
}
.team-card div {
  display: grid;
  gap: 3px;
  margin-top: auto;
  padding-top: 13px;
  border-top: 1px solid var(--line);
}
.team-card small {
  color: var(--muted);
}
.team-card em {
  margin-top: 10px;
  color: var(--accent);
}
.back,
.close {
  border: 0;
  padding: 0;
  color: #52725e;
  background: transparent;
  text-decoration: underline;
}
.form-page {
  width: min(680px, calc(100% - 44px));
}
.form-page .back {
  margin-bottom: 30px;
}
.form-page form {
  display: grid;
  gap: 19px;
  margin-top: 28px;
  padding: 24px;
  border: 1px solid var(--line);
  border-radius: 13px;
  background: var(--surface);
}
.form-page label {
  display: grid;
  gap: 7px;
  color: #405a4a;
  font-size: 13px;
  font-weight: 700;
}
.form-page label small,
legend small {
  color: var(--muted);
  font-size: 11px;
  font-weight: 500;
}
.form-page input,
.form-page select,
.form-page textarea,
.review-section textarea {
  width: 100%;
  border: 1px solid #cbd4ca;
  border-radius: 8px;
  padding: 11px;
  color: var(--ink);
  background: #fffefa;
  resize: vertical;
}
.form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 15px;
}
fieldset {
  margin: 0;
  padding: 0;
  border: 0;
}
legend {
  margin-bottom: 10px;
  color: #405a4a;
  font-size: 13px;
  font-weight: 700;
}
.day-pills {
  display: flex;
  flex-wrap: wrap;
  gap: 7px;
}
.day-pills input {
  position: absolute;
  opacity: 0;
}
.day-pills span {
  display: block;
  border: 1px solid #cbd4ca;
  border-radius: 999px;
  padding: 8px 10px;
  color: var(--muted);
  font-size: 12px;
}
.day-pills input:checked + span {
  border-color: var(--button);
  color: #fff;
  background: var(--button);
}
.day-pills input:disabled + span {
  opacity: 0.42;
}
.team-page .back {
  margin-bottom: 24px;
}

.season-summary {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  overflow: hidden;
  margin: 26px 0;
  border: 1px solid var(--line);
  border-radius: 12px;
}
.season-summary div {
  display: grid;
  gap: 6px;
  padding: 16px;
  background: var(--soft);
}
.season-summary div + div {
  border-left: 1px solid var(--line);
}
.season-summary span {
  color: #69806f;
  font-size: 10px;
  font-weight: 750;
  letter-spacing: 0.08em;
}
.season-summary strong {
  font:
    600 16px Georgia,
    serif;
}

/* Fases de la temporada */
.phases-strip {
  margin: 22px 0 30px;
  padding: 18px;
  border: 1px solid var(--line);
  border-radius: 13px;
  background: var(--surface);
}
.phases-header {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 14px;
}
.phases-header h3 {
  margin: 0;
  font:
    600 20px Georgia,
    serif;
}
.phase-badge {
  border-radius: 999px;
  padding: 6px 12px;
  color: #fff;
  font-size: 12px;
  font-weight: 700;
}
.phase-cards-row {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 10px;
}
.phase-pill-card {
  display: grid;
  align-content: space-between;
  gap: 8px;
  padding: 12px;
  border: 1px solid var(--line);
  border-top: 4px solid var(--phase-color);
  border-radius: 9px;
  background: var(--bg);
  text-align: left;
}
.phase-pill-card.active {
  background: var(--soft);
  border-color: var(--button);
  border-top: 4px solid var(--phase-color);
}
.phase-pill-top {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  gap: 6px;
}
.phase-pill-top strong {
  font-size: 13px;
}
.phase-pill-top small {
  color: var(--muted);
  font-size: 11px;
}
.phase-pill-card p {
  margin: 0;
  color: var(--muted);
  font-size: 11.5px;
  line-height: 1.35;
}
.week-dots {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}
.week-dot {
  border: 1px solid #cbd4ca;
  border-radius: 5px;
  padding: 2px 6px;
  background: var(--surface);
  font-size: 10px;
  font-weight: 700;
  color: var(--muted);
}
.week-dot.current {
  border-color: var(--accent);
  background: var(--accent);
  color: #fff;
}

/* Subtabs */
.subtabs {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 26px;
  border-bottom: 1px solid var(--line);
  padding-bottom: 12px;
}
.subtabs button {
  border: 1px solid var(--line);
  border-radius: 8px;
  padding: 9px 14px;
  background: var(--surface);
  color: var(--muted);
  font-size: 13px;
  font-weight: 700;
}
.subtabs button.active {
  border-color: var(--button);
  background: var(--button);
  color: #fff;
}

.section-heading h2,
.review-section h2 {
  margin: 0;
  font:
    600 32px Georgia,
    serif;
  letter-spacing: -0.04em;
}
.section-heading {
  display: flex;
  align-items: end;
  justify-content: space-between;
  gap: 18px;
}
.section-heading span,
.review-section span {
  color: var(--muted);
  font-size: 13px;
}
.phase-rules-banner {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin: 16px 0 6px;
}
.rule-chip {
  border: 1px solid var(--line);
  border-radius: 999px;
  padding: 5px 11px;
  background: var(--surface);
  font-size: 12px;
  font-weight: 600;
  color: var(--ink);
}
.plio-chip {
  background: var(--soft);
  border-color: #b8cbb9;
}
.week-navigation {
  display: flex;
  flex: 0 0 auto;
  gap: 8px;
}
.week-navigation button {
  border: 1px solid var(--line);
  border-radius: 7px;
  padding: 8px 10px;
  color: var(--ink);
  background: var(--surface);
  font-size: 12px;
  font-weight: 700;
}
.week-navigation button:disabled {
  cursor: not-allowed;
  opacity: 0.45;
}
.session-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  margin: 20px 0 46px;
}
.session-grid article {
  display: grid;
  gap: 10px;
  min-height: 215px;
  padding: 18px;
  border: 1px solid var(--line);
  border-radius: 11px;
  background: var(--surface);
}
.session-grid article > span {
  color: #69806f;
  font-size: 10px;
  font-weight: 750;
  letter-spacing: 0.08em;
}
.session-grid h3 {
  margin: 0;
  font:
    600 22px Georgia,
    serif;
}
.session-focus {
  color: var(--ink) !important;
  font-weight: 600;
}
.session-grid p {
  margin: 0;
  color: var(--muted);
  font-size: 13px;
}
.card-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-self: end;
  margin-top: 6px;
}
.card-actions button {
  padding: 8px 11px;
  font-size: 12px;
}
.holiday-notice-card {
  margin: 20px 0 42px;
  padding: 24px;
  border: 1px dashed #8a93a5;
  border-radius: 12px;
  background: var(--surface);
}
.holiday-notice-card h3 {
  margin: 4px 0 8px;
  font:
    600 24px Georgia,
    serif;
}

/* Explorador de tablas relacionales */
.tables-explorer {
  margin-bottom: 48px;
}
.explorer-intro {
  display: flex;
  flex-wrap: wrap;
  align-items: end;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 20px;
}
.explorer-intro h2 {
  margin: 0 0 6px;
  font:
    600 30px Georgia,
    serif;
}
.explorer-intro p {
  margin: 0;
  max-width: 620px;
  color: var(--muted);
  font-size: 13.5px;
}
.day-selector-inline {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  font-weight: 700;
}
.day-selector-inline button {
  border: 1px solid var(--line);
  border-radius: 7px;
  padding: 6px 10px;
  background: var(--surface);
  font-size: 12px;
}
.day-selector-inline button.active {
  background: var(--button);
  color: #fff;
  border-color: var(--button);
}
.relational-chain {
  display: grid;
  gap: 10px;
}
.table-box {
  border: 1px solid var(--line);
  border-radius: 11px;
  overflow: hidden;
  background: var(--surface);
}
.table-box > header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 14px;
  background: var(--soft);
  border-bottom: 1px solid var(--line);
}
.table-num {
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.06em;
  color: var(--ink);
}
.mini-table-wrap {
  overflow-x: auto;
}
.mini-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 12.5px;
}
.mini-table th,
.mini-table td {
  padding: 8px 12px;
  border-bottom: 1px solid var(--line);
  text-align: left;
}
.mini-table th {
  font-size: 11px;
  color: var(--muted);
  background: #faf9f5;
}
.mini-table tbody tr {
  cursor: pointer;
}
.mini-table tbody tr.highlighted-row {
  background: #fff3ec;
}
.mini-table code {
  padding: 2px 5px;
  border-radius: 4px;
  background: rgba(32, 61, 48, 0.08);
  font-weight: 700;
  color: var(--button);
}
.chain-arrow {
  padding: 4px 12px;
  color: var(--accent);
  font-size: 12.5px;
  font-weight: 700;
}

/* Vacaciones y Tests */
.holidays-tests-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 18px;
  margin-bottom: 48px;
}
.panel-box {
  padding: 20px;
  border: 1px solid var(--line);
  border-radius: 12px;
  background: var(--surface);
}
.panel-box h2 {
  margin: 0 0 6px;
  font:
    600 26px Georgia,
    serif;
}
.panel-lead {
  margin: 0 0 16px;
  color: var(--muted);
  font-size: 13px;
}
.home-cards,
.test-cards {
  display: grid;
  gap: 10px;
}
.home-card,
.test-card {
  padding: 14px;
  border: 1px solid var(--line);
  border-radius: 9px;
  background: var(--bg);
}
.home-card-top {
  display: flex;
  justify-content: space-between;
  font-size: 11px;
  font-weight: 700;
  color: #69806f;
}
.home-card h3,
.test-card h3 {
  margin: 4px 0;
  font-size: 16px;
}
.home-format,
.test-card p {
  margin: 4px 0 10px;
  color: var(--muted);
  font-size: 12.5px;
}
.dose-comparison {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
  padding-top: 8px;
  border-top: 1px solid var(--line);
  font-size: 12px;
}
.dose-comparison small {
  display: block;
  color: var(--muted);
  font-size: 10.5px;
}
.milestone-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}
.milestone-chips span {
  border-radius: 999px;
  padding: 3px 9px;
  background: var(--soft);
  font-size: 11px;
  font-weight: 600;
}

.review-section {
  display: grid;
  grid-template-columns: 0.8fr 1.2fr;
  gap: 24px;
  padding: 24px;
  border-radius: 13px;
  background: var(--soft);
}
.review-section > div:last-child {
  display: grid;
  gap: 10px;
}
.review-buttons {
  align-content: center;
  justify-items: end;
}
.note-editor {
  display: grid;
  grid-template-columns: 0.8fr 1.2fr;
  gap: 24px;
  margin-top: 14px;
  padding: 24px;
  border: 1px solid var(--line);
  border-radius: 13px;
  background: var(--surface);
}
.note-editor h2 {
  margin: 0;
  font:
    600 28px Georgia,
    serif;
  letter-spacing: -0.04em;
}
.note-editor > div:last-child {
  display: grid;
  gap: 10px;
}
.note-editor textarea {
  width: 100%;
  border: 1px solid #cbd4ca;
  border-radius: 8px;
  padding: 11px;
  color: var(--ink);
  background: #fffefa;
  resize: vertical;
}
.review-actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 15px;
}
.modal-backdrop {
  position: fixed;
  z-index: 20;
  inset: 0;
  display: grid;
  place-items: center;
  padding: 20px;
  background: rgba(24, 43, 32, 0.46);
}
.history-modal {
  width: min(760px, 100%);
  max-height: min(700px, calc(100vh - 40px));
  overflow: auto;
  padding: 25px;
  border-radius: 14px;
  background: var(--surface);
  box-shadow: 0 24px 80px rgba(17, 35, 25, 0.28);
}
.history-modal .close {
  float: right;
}
.history-modal h2 {
  margin: 0;
  font:
    600 34px Georgia,
    serif;
  letter-spacing: -0.045em;
}
.history-layout {
  display: grid;
  grid-template-columns: 190px 1fr;
  gap: 22px;
  margin-top: 25px;
}
.history-navigation {
  display: grid;
  align-content: start;
  gap: 7px;
}
.history-navigation button {
  border: 1px solid var(--line);
  border-radius: 7px;
  padding: 10px;
  color: var(--ink);
  background: transparent;
  text-align: left;
  font-size: 12px;
  font-weight: 700;
}
.history-navigation button.active {
  border-color: var(--button);
  color: #fff;
  background: var(--button);
}
.history-note {
  min-height: 180px;
  padding: 18px;
  border-radius: 10px;
  background: var(--soft);
}
.history-note > p:last-child {
  margin: 8px 0 0;
  line-height: 1.55;
}

/* Vista de sesión por bloques */
.session-page {
  width: min(860px, calc(100% - 44px));
}
.session-page .back {
  display: inline-block;
  margin-bottom: 28px;
}
.session-page > h1 {
  margin: 0;
  font:
    600 clamp(36px, 6vw, 52px) / 0.98 Georgia,
    serif;
  letter-spacing: -0.05em;
}
.session-rationale {
  max-width: 680px;
  margin: 12px 0 24px;
  color: var(--muted);
  line-height: 1.55;
}
.timebar-wrap {
  margin-bottom: 26px;
}
.session-timebar {
  display: flex;
  height: 34px;
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid var(--line);
  margin-top: 6px;
}
.session-timebar div {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 8px;
  color: #fff;
  font-size: 11.5px;
  font-weight: 700;
  white-space: nowrap;
  overflow: hidden;
}
.blocks-stack {
  display: grid;
  gap: 24px;
}
.session-block-card {
  border: 1px solid var(--line);
  border-radius: 13px;
  overflow: hidden;
  background: var(--surface);
}
.session-block-header {
  display: flex;
  justify-content: space-between;
  align-items: start;
  gap: 16px;
  padding: 16px 20px;
  background: var(--soft);
  border-bottom: 1px solid var(--line);
}
.session-block-header h2 {
  margin: 2px 0 4px;
  font:
    600 24px Georgia,
    serif;
}
.session-block-header p {
  margin: 0;
  color: var(--muted);
  font-size: 13px;
}
.block-minutes-badge {
  border-radius: 8px;
  padding: 6px 10px;
  background: var(--button);
  color: #fff;
  font-size: 13px;
}
.exercise-list {
  display: grid;
  gap: 12px;
  margin: 0;
  padding: 16px;
  list-style: none;
}
.exercise-card {
  display: grid;
  grid-template-columns: 136px 1fr;
  overflow: hidden;
  border: 1px solid var(--line);
  border-radius: 11px;
  background: #fffefa;
}
.exercise-image {
  position: relative;
  display: block;
  min-height: 100%;
  background: var(--soft);
}
.exercise-image img {
  display: block;
  width: 100%;
  height: 100%;
  min-height: 136px;
  object-fit: cover;
}
.exercise-image span {
  position: absolute;
  right: 7px;
  bottom: 7px;
  border-radius: 4px;
  padding: 3px 6px;
  color: #fff;
  background: rgba(30, 56, 43, 0.86);
  font-size: 10px;
  font-weight: 750;
}
.exercise-content {
  padding: 14px 18px;
  display: grid;
  gap: 6px;
}
.exercise-meta-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
  color: #69806f;
  font-size: 11px;
  font-weight: 750;
}
.exercise-meta-top code {
  font-weight: 600;
  color: var(--muted);
}
.exercise-content h3 {
  margin: 0;
  font:
    600 21px Georgia,
    serif;
}
.dose-pill {
  display: inline-block;
  justify-self: start;
  border-radius: 6px;
  padding: 3px 8px;
  background: #fbe7dc;
  color: #b5431b;
  font-size: 12.5px;
}
.cue-highlight {
  margin: 2px 0;
  font-size: 13px;
  color: var(--ink);
}
.how-list {
  margin: 0;
  padding-left: 18px;
  color: var(--muted);
  font-size: 12.5px;
  line-height: 1.45;
}
.progression-row {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  padding-top: 6px;
  border-top: 1px solid var(--line);
  font-size: 12px;
  color: var(--muted);
}
.error {
  color: #be4527;
}
.empty-state {
  margin-top: 34px;
  padding: 35px;
  border: 1px dashed #b7c5b7;
  border-radius: 13px;
  text-align: center;
}
.empty-state h2 {
  font:
    600 28px Georgia,
    serif;
}
@media (max-width: 820px) {
  .page {
    padding-top: 36px;
  }
  .heading-row,
  .team-heading,
  .section-heading,
  .review-section,
  .note-editor,
  .season-summary,
  .phase-cards-row,
  .holidays-tests-grid {
    grid-template-columns: 1fr;
    display: grid;
    align-items: start;
  }
  .season-summary div + div {
    border-top: 1px solid var(--line);
    border-left: 0;
  }
  .team-grid,
  .session-grid {
    grid-template-columns: 1fr;
  }
  .form-grid {
    grid-template-columns: 1fr;
  }
  .topbar {
    padding: 0 22px;
  }
  .exercise-card {
    grid-template-columns: 1fr;
  }
  .exercise-image img {
    max-height: 140px;
  }
  .review-buttons {
    justify-items: start;
  }
  .history-layout {
    grid-template-columns: 1fr;
  }
}
</style>
