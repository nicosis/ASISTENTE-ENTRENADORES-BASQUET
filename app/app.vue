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
  isAdmin,
  loginName,
  loginRole,
  signedIn,
  view,
  activeTeamTab,
  showArchivedTeams,
  dbSource,
  loadingDatabase,
  activeTeams,
  archivedTeams,
  visibleTeams,
  activeTeamRoster,
  playerCountByTeam,
  seasons,
  teamSeasons,
  activeTeam,
  activeSeason,
  activeSeasonEndDate,
  seasonDraftEndDate,
  frequency,
  trainingDataStatus,
  activePlan,
  phases,
  currentWeekContext,
  currentPhase,
  weeklySessions,
  hydratedPreviewSession,
  currentWeekNumber,
  selectedDay,
  displayedWeekStart,
  canGoToPreviousWeek,
  canGoToNextWeek,
  weekLabel,
  annualWeekLabel,
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
  loadingSession,
  error,
  signIn,
  signOut,
  toggleCoachRole,
  openTeam,
  openCreateTeam,
  createTeam,
  archiveTeam,
  restoreTeam,
  deleteTeamCascade,
  toggleDraftDay,
  createSeason,
  closeSeason,
  reopenSeason,
  selectSeason,
  moveWeek,
  selectPhaseWeek,
  saveReview,
  openReviewEditor,
  closeReviewEditor,
  openHistory,
  closeHistory,
  generateSession,
  refreshDatabaseFromSheets,
} = useCoachWorkspace()

function handleConfirmDeleteTeam(teamId: string, teamName: string): void {
  if (!isAdmin.value) return
  const accepted = window.confirm(
    `¿Eliminar definitivamente el equipo "${teamName}" (${teamId})?\n\nEsta acción de administrador borrará en cascada el equipo, todas sus temporadas y sus observaciones semanales en Google Sheets.`,
  )
  if (accepted) {
    deleteTeamCascade(teamId)
  }
}
</script>

<template>
  <main class="app-shell">
    <div
      v-if="loadingDatabase"
      class="database-loading-overlay"
      role="status"
      aria-live="polite"
    >
      <div class="database-loading-card">
        <span class="loading-spinner" aria-hidden="true"></span>
        <strong>Cargando datos de la base de datos…</strong>
        <span>La aplicación estará disponible en unos segundos.</span>
      </div>
    </div>
    <header class="topbar">
      <button class="brand" type="button" @click="view = 'home'">
        <span class="brand-ball">B</span><span>pizarra</span>
      </button>
      <div class="topbar-right">
        <button
          class="logout-button"
          type="button"
          :disabled="loadingDatabase"
          title="Recargar las 12 planillas directamente desde Google Sheets"
          @click="refreshDatabaseFromSheets"
        >
          {{
            loadingDatabase
              ? 'Sincronizando Sheets…'
              : dbSource === 'google-sheets'
                ? '● Sheets DB conectado (Actualizar)'
                : '○ Sheets no disponible (Reintentar)'
          }}
        </button>
        <template v-if="signedIn">
          <span class="coach-avatar">{{ coach.name.slice(0, 1) }}</span>
          <span>{{ coach.name }}</span>
          <button
            class="role-badge"
            :class="{ admin: isAdmin }"
            type="button"
            title="Haz clic para alternar rol en tabla `entrenadores` (Admin / Entrenador)"
            @click="toggleCoachRole"
          >
            {{ isAdmin ? 'ADMIN' : 'ENTRENADOR' }}
          </button>
          <button class="logout-button" type="button" @click="signOut">
            Cerrar sesión
          </button>
        </template>
      </div>
    </header>

    <section
      v-if="!loadingDatabase && dbSource === 'unavailable'"
      class="data-unavailable-banner"
      role="alert"
    >
      <strong>Datos no disponibles.</strong>
      <span>
        No se pudo cargar Google Sheets. La aplicación no mostrará datos locales
        antiguos ni permitirá crear o modificar información hasta recuperar la conexión.
      </span>
      <button class="secondary-button" type="button" @click="refreshDatabaseFromSheets">
        Reintentar conexión
      </button>
    </section>

    <section v-if="!signedIn" class="page auth-page">
      <p class="eyebrow">SESIÓN CERRADA · TABLA `entrenadores`</p>
      <h1>Entra con tu perfil de entrenador.</h1>
      <p>
        El perfil y su rol (`admin` o `coach`) se sincronizan con la tabla
        `entrenadores` en Google Sheets.
      </p>
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
        <label>
          Rol en el club (`entrenadores.role`)
          <select v-model="loginRole" class="form-select">
            <option value="coach">
              Entrenador (puede archivar equipos y cerrar temporadas)
            </option>
            <option value="admin">
              Administrador (puede eliminar en cascada)
            </option>
          </select>
        </label>
        <button class="primary-button" type="submit">Entrar</button>
      </form>
    </section>

    <section v-else-if="view === 'home'" class="page home-page">
      <p class="eyebrow">
        PANEL DEL ENTRENADOR · {{ coach.id }} ({{
          isAdmin ? 'ROL: ADMINISTRADOR' : 'ROL: ENTRENADOR'
        }})
      </p>
      <div class="heading-row">
        <div>
          <h1>
            {{ showArchivedTeams ? 'Equipos archivados.' : 'Mis equipos.' }}
          </h1>
          <p>
            {{
              showArchivedTeams
                ? 'Estos equipos están ocultos del panel principal conservando todo su historial de temporadas y observaciones.'
                : 'Abre una temporada para explorar los mesociclos del año, o archiva equipos y temporadas cerradas para mantener limpio tu panel.'
            }}
          </p>
        </div>
        <div class="heading-actions">
          <button
            v-if="archivedTeams.length > 0 || showArchivedTeams"
            class="secondary-button"
            type="button"
            @click="showArchivedTeams = !showArchivedTeams"
          >
            {{
              showArchivedTeams
                ? `← Volver a activos (${activeTeams.length})`
                : `Ver archivados (${archivedTeams.length})`
            }}
          </button>
          <button
            v-if="!showArchivedTeams"
            class="primary-button"
            type="button"
            :disabled="dbSource !== 'google-sheets'"
            @click="openCreateTeam"
          >
            + Crear equipo
          </button>
        </div>
      </div>
      <section class="team-grid">
        <article
          v-for="team in visibleTeams"
          :key="team.id"
          class="team-card"
          :class="{ 'is-archived': team.status === 'archived' }"
        >
          <div class="team-card-top">
            <span>
              {{ team.id }} ·
              {{ team.status === 'archived' ? 'ARCHIVADO' : 'ACTIVO' }}
            </span>
          </div>
          <button
            class="team-card-main"
            type="button"
            @click="openTeam(team.id)"
          >
            <h2>{{ team.name }}</h2>
            <p>{{ team.club }}</p>
            <div class="team-card-meta">
              <strong>{{
                seasons.find(
                  (item) =>
                    item.teamId === team.id && item.status === 'active',
                )?.category || 'Sin temporada activa (cerrada)'
              }}</strong>
              <small>{{ playerCountByTeam.get(team.id) || 0 }} jugadores</small>
            </div>
            <em>Abrir planificación anual →</em>
          </button>
          <div class="team-card-footer">
            <button
              v-if="team.status !== 'archived'"
              class="card-mini-btn"
              type="button"
              title="Ocultar equipo del panel principal sin perder su historial"
              @click.stop="archiveTeam(team.id)"
            >
              Archivar equipo
            </button>
            <button
              v-else
              class="card-mini-btn restore"
              type="button"
              @click.stop="restoreTeam(team.id)"
            >
              Restaurar al panel
            </button>
            <button
              v-if="isAdmin"
              class="card-mini-btn danger"
              type="button"
              title="Solo Administrador: borra equipo, temporadas y observaciones en cascada"
              @click.stop="handleConfirmDeleteTeam(team.id, team.name)"
            >
              Eliminar (Admin)
            </button>
          </div>
        </article>
      </section>
      <section v-if="!visibleTeams.length" class="empty-state">
        <h2>
          {{
            showArchivedTeams
              ? 'No hay equipos archivados.'
              : 'Tu primer equipo empieza aquí.'
          }}
        </h2>
        <p>
          {{
            showArchivedTeams
              ? 'Todos tus equipos están activos en el panel principal.'
              : 'Crea su ficha, añade la plantilla y después configura la temporada.'
          }}
        </p>
        <button
          v-if="showArchivedTeams"
          class="secondary-button"
          type="button"
          @click="showArchivedTeams = false"
        >
          ← Volver a equipos activos
        </button>
        <button
          v-else
          class="primary-button"
          type="button"
          :disabled="dbSource !== 'google-sheets'"
          @click="openCreateTeam"
        >
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
        anual reutilizable (`macrocycles` → `mesocycles` → `mesocycle_sessions`).
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
            <input
              v-model="seasonDraft.startsAt"
              type="date"
              min="2026-01-05"
              step="7"
              required
            />
            <small>La temporada debe comenzar un lunes.</small>
          </label>
          <label>
            Final de temporada
            <input
              :value="seasonDraftEndDate"
              type="date"
              readonly
            />
            <small>Calculado para {{ activePlan.totalWeeks }} semanas.</small>
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
          Generar macrociclo anual →
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
            {{ activeTeam?.id }} · TEMPORADA {{ activeSeason?.name }} ({{
              activeSeason?.status === 'closed' ? 'CERRADA' : 'ACTIVA'
            }}) · MACROCYCLE ID:
            {{ activeSeason?.macrocycleId || 'Sin plan' }}
          </p>
          <h1>{{ activeTeam?.name }}</h1>
          <p>{{ activeSeason?.category }} · {{ activeTeam?.club }}</p>
        </div>
        <div class="heading-actions">
          <button
            v-if="activeSeason && activeSeason.status === 'active'"
            class="secondary-button"
            type="button"
            title="Cerrar/archivar esta temporada"
            @click="closeSeason(activeSeason.id)"
          >
            Cerrar temporada
          </button>
          <button
            v-else-if="activeSeason && activeSeason.status === 'closed'"
            class="secondary-button"
            type="button"
            title="Volver a marcar esta temporada como activa"
            @click="reopenSeason(activeSeason.id)"
          >
            Reactivar temporada
          </button>
          <button
            class="secondary-button"
            type="button"
            @click="view = 'create-season'"
          >
            + Nueva temporada
          </button>
          <button
            v-if="activeTeam && activeTeam.status !== 'archived'"
            class="secondary-button"
            type="button"
            title="Ocultar equipo del panel principal"
            @click="archiveTeam(activeTeam.id)"
          >
            Archivar equipo
          </button>
          <button
            v-else-if="activeTeam && activeTeam.status === 'archived'"
            class="secondary-button"
            type="button"
            @click="restoreTeam(activeTeam.id)"
          >
            Restaurar equipo
          </button>
          <button
            v-if="isAdmin && activeTeam"
            class="danger-button"
            type="button"
            @click="handleConfirmDeleteTeam(activeTeam.id, activeTeam.name)"
          >
            Eliminar equipo (Admin)
          </button>
        </div>
      </div>

      <div v-if="teamSeasons.length > 1" class="seasons-switcher-bar">
        <span>Temporadas del equipo:</span>
        <button
          v-for="item in teamSeasons"
          :key="item.id"
          type="button"
          class="season-pill-btn"
          :class="{ active: item.id === activeSeason?.id }"
          @click="selectSeason(item.id)"
        >
          {{ item.name }} ({{
            item.status === 'active' ? 'Activa' : 'Cerrada'
          }})
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
              ? `${formattedDate(activeSeason.startsAt)} – ${formattedDate(activeSeasonEndDate)}`
              : '—'
          }}</strong>
        </div>
      </section>

      <section v-if="!trainingDataStatus.available" class="panel-box">
        <p class="eyebrow">INFORMACIÓN NO DISPONIBLE</p>
        <h2>No se puede mostrar este entrenamiento</h2>
        <p class="panel-lead">
          {{ trainingDataStatus.message }} Revisá los datos relacionados en la
          base de datos antes de continuar.
        </p>
        <nav class="week-navigation" aria-label="Cambiar de semana">
          <button type="button" :disabled="!canGoToPreviousWeek" @click="moveWeek(-1)">
            ← Semana anterior
          </button>
          <button type="button" :disabled="!canGoToNextWeek" @click="moveWeek(1)">
            Siguiente semana →
          </button>
        </nav>
      </section>

      <!-- Navegación de pestañas locales -->
      <nav
        v-if="trainingDataStatus.available"
        class="subtabs"
        aria-label="Vistas del macrociclo"
      >
        <button
          type="button"
          :class="{ active: activeTeamTab === 'week' }"
          @click="activeTeamTab = 'week'"
        >
          Sesiones de la semana (S{{ currentWeekNumber }})
        </button>
        <button
          type="button"
          :class="{ active: activeTeamTab === 'annual' }"
          @click="activeTeamTab = 'annual'"
        >
          Estructura anual
        </button>
        <button
          type="button"
          :class="{ active: activeTeamTab === 'roster' }"
          @click="activeTeamTab = 'roster'"
        >
          Plantilla
        </button>
      </nav>

      <!-- PESTAÑA 1: SESIONES DE LA SEMANA -->
      <template v-if="trainingDataStatus.available && activeTeamTab === 'week'">
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
          <p class="eyebrow">SEMANA DE RECESO</p>
          <h3>Descanso de pista: trabajo autónomo en casa</h3>
          <p>
            Esta semana ({{ weekLabel }}) corresponde a vacaciones. Los
            jugadores realizan las 3 sesiones sin material (A, B y C).
          </p>
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
            </div>
          </article>
        </section>
      </template>

      <!-- PESTAÑA 3: PLANTILLA DEL EQUIPO -->
      <template v-else-if="trainingDataStatus.available && activeTeamTab === 'roster'">
        <section class="panel-box roster-panel">
          <div class="section-heading">
            <div>
              <p class="eyebrow">PLANTILLA DEL EQUIPO</p>
              <h2>Jugadores</h2>
              <span>
                {{ activeTeamRoster.length }}
                {{ activeTeamRoster.length === 1 ? 'jugador activo' : 'jugadores activos' }}
              </span>
            </div>
          </div>
          <div v-if="activeTeamRoster.length" class="roster-grid">
            <article v-for="membership in activeTeamRoster" :key="membership.id" class="roster-card">
              <strong>{{ membership.player?.name || membership.playerId }}</strong>
              <small>{{ membership.playerId }}</small>
            </article>
          </div>
          <p v-else class="panel-lead">
            Todavía no hay jugadores cargados en este equipo.
          </p>
        </section>
      </template>

      <!-- PESTAÑA 2: ESTRUCTURA ANUAL -->
      <template v-else-if="trainingDataStatus.available && activeTeamTab === 'annual'">
        <section class="phases-strip">
          <div class="phases-header">
            <div>
              <p class="eyebrow">ESTRUCTURA ANUAL</p>
              <h3>Mesociclos de la temporada (haz clic en una fase o semana)</h3>
            </div>
            <span class="phase-badge" :style="{ background: currentPhase.color }">
              {{ currentPhase.name }} · Semana {{ currentWeekNumber }} (Carga
              {{ currentWeekContext.loadIndex }}/10{{
                currentWeekContext.isDeload ? ' · Descarga' : ''
              }})
            </span>
          </div>

          <div class="phase-list">
            <article
              v-for="ph in phases"
              :key="ph.id"
              class="phase-row"
              :class="{ active: ph.id === currentPhase.id }"
              :style="{ '--phase-color': ph.color }"
            >
              <div class="phase-row-header">
                <span class="phase-row-title">
                  <strong>{{ ph.name }}</strong>
                  <small>Semanas {{ ph.weekStart }}–{{ ph.weekEnd }}</small>
                </span>
                <span class="phase-row-objective">
                  <span>Objetivo</span>
                  {{ ph.objective }}
                </span>
              </div>
              <div class="week-grid" aria-label="Semanas de la fase">
                <button
                  v-for="(load, idx) in ph.weeklyLoads"
                  :key="idx"
                  type="button"
                  class="week-cell"
                  :class="{ current: Number(ph.weekStart) + idx === currentWeekNumber }"
                  @click="selectPhaseWeek(Number(ph.weekStart) + idx)"
                >
                  <span class="week-cell-number">Semana {{ Number(ph.weekStart) + idx }}</span>
                  <span class="week-cell-date">{{ annualWeekLabel(Number(ph.weekStart) + idx).replace(/^Semana \\d+ · /, '') }}</span>
                  <span class="week-cell-load">Carga <strong>{{ load }}/10</strong></span>
                  <span
                    v-if="ph.type === 'training' && idx === ph.weeklyLoads.length - 1 && load <= 4"
                    class="week-cell-deload"
                  >
                    Descarga
                  </span>
                </button>
              </div>
            </article>
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

      <!-- Barra de distribución de minutos por bloque (`training_blocks`) -->
      <div class="timebar-wrap">
        <span class="eyebrow">
            DISTRIBUCIÓN DE BLOQUES (`training_blocks`)
        </span>
        <div class="session-timebar">
          <div
            v-for="(blk, idx) in session.trainingBlocks"
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
          v-for="blk in session.trainingBlocks"
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
              <ExerciseImages
                :exercise-id="item.exercise.id"
                :exercise-name="item.exercise.name"
              />
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
.database-loading-overlay {
  position: fixed;
  inset: 0;
  z-index: 100;
  display: grid;
  place-items: center;
  padding: 24px;
  background: rgba(32, 61, 48, 0.22);
  backdrop-filter: blur(3px);
}
.database-loading-card {
  display: grid;
  justify-items: center;
  gap: 10px;
  max-width: 360px;
  padding: 28px 32px;
  border: 1px solid var(--line);
  border-radius: 14px;
  background: var(--surface);
  box-shadow: 0 18px 45px rgba(32, 61, 48, 0.18);
  text-align: center;
}
.database-loading-card span:last-child {
  color: var(--muted);
  font-size: 13px;
}
.loading-spinner {
  width: 32px;
  height: 32px;
  border: 3px solid var(--line);
  border-top-color: var(--accent);
  border-radius: 50%;
  animation: database-spinner 0.8s linear infinite;
}
@keyframes database-spinner {
  to {
    transform: rotate(360deg);
  }
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
.danger-button {
  border-radius: 8px;
  padding: 11px 14px;
  font-weight: 700;
  font-size: 13px;
  border: 1px solid #d97c6c;
  color: #a13422;
  background: #fff5f3;
}
.danger-button:hover {
  background: #fde8e4;
}
.heading-actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
}
.role-badge {
  border: 1px solid #bdc8bd;
  border-radius: 999px;
  padding: 3px 9px;
  font-size: 10px;
  font-weight: 800;
  letter-spacing: 0.06em;
  color: #365443;
  background: #eef3ee;
}
.role-badge.admin {
  border-color: #e66b48;
  color: #fff;
  background: #e66b48;
}
.seasons-switcher-bar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  margin-top: 18px;
  font-size: 12px;
  color: var(--muted);
}
.season-pill-btn {
  border: 1px solid var(--line);
  border-radius: 999px;
  padding: 5px 12px;
  font-size: 12px;
  font-weight: 700;
  color: var(--muted);
  background: var(--surface);
}
.season-pill-btn.active {
  border-color: var(--button);
  color: #fff;
  background: var(--button);
}
.team-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 14px;
  margin-top: 38px;
}
.team-card {
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-height: 250px;
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
.team-card.is-archived {
  opacity: 0.82;
  background: #f6f4ee;
}
.team-card:hover {
  transform: translateY(-3px);
  border-color: #829b87;
}
.team-card-top span,
.team-card em {
  color: #69806f;
  font-size: 11px;
  font-style: normal;
  font-weight: 700;
  letter-spacing: 0.06em;
}
.team-card-main {
  display: flex;
  flex-direction: column;
  flex: 1;
  gap: 8px;
  padding: 0;
  border: 0;
  background: transparent;
  color: inherit;
  text-align: left;
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
.team-card-meta {
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
  margin-top: 6px;
  color: var(--accent);
}
.team-card-footer {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 8px;
  padding-top: 10px;
  border-top: 1px dashed var(--line);
}
.card-mini-btn {
  border: 1px solid #cbd4cb;
  border-radius: 6px;
  padding: 5px 9px;
  font-size: 11px;
  font-weight: 700;
  color: #365443;
  background: #f5f7f4;
}
.card-mini-btn:hover {
  background: #e7ede7;
}
.card-mini-btn.restore {
  border-color: #69806f;
  color: #203d30;
}
.card-mini-btn.danger {
  border-color: #e29b8f;
  color: #a13422;
  background: #fff5f3;
}
.card-mini-btn.danger:hover {
  background: #fde8e4;
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
  grid-template-columns: repeat(3, minmax(0, 1fr));
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

/* Mesociclos de la temporada */
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
.phase-list {
  display: grid;
  gap: 12px;
}
.phase-row {
  overflow: hidden;
  border: 1px solid var(--line);
  border-left: 4px solid var(--phase-color);
  border-radius: 11px;
  background: var(--bg);
}
.phase-row.active {
  border-color: var(--button);
  border-left-color: var(--phase-color);
  background: var(--soft);
}
.phase-row-header {
  display: grid;
  grid-template-columns: minmax(180px, 0.9fr) minmax(220px, 1.5fr) auto;
  align-items: center;
  gap: 18px;
  width: 100%;
  padding: 15px 18px 13px;
  border: 0;
  border-bottom: 1px solid var(--line);
  color: var(--ink);
  background: transparent;
  text-align: left;
}
.phase-row-title,
.phase-row-objective {
  display: grid;
  gap: 4px;
}
.phase-row-title strong {
  font-size: 14px;
}
.phase-row-title small,
.phase-row-objective {
  color: var(--muted);
  font-size: 12px;
}
.phase-row-objective span {
  color: #69806f;
  font-size: 10px;
  font-weight: 750;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}
.week-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(145px, 1fr));
  gap: 8px;
  padding: 12px 14px 14px;
}
.week-cell {
  display: grid;
  gap: 4px;
  min-height: 78px;
  padding: 10px 11px;
  border: 1px solid #cbd4ca;
  border-radius: 7px;
  color: var(--ink);
  background: var(--surface);
  text-align: left;
}
.week-cell:hover {
  border-color: var(--accent);
  background: #f7faf5;
}
.week-cell.current {
  border-color: var(--accent);
  box-shadow: inset 3px 0 0 var(--accent);
  background: #e9f1e8;
}
.week-cell-number {
  font-size: 12px;
  font-weight: 800;
}
.week-cell-date {
  color: var(--muted);
  font-size: 11px;
  line-height: 1.25;
}
.week-cell-load {
  color: var(--muted);
  font-size: 11px;
}
.week-cell-load strong {
  color: var(--ink);
}
.week-cell-deload {
  justify-self: start;
  margin-top: 2px;
  padding: 2px 6px;
  border-radius: 4px;
  color: #9c4c21;
  background: #fbe7dc;
  font-size: 10px;
  font-weight: 800;
  letter-spacing: 0.04em;
  text-transform: uppercase;
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

/* Team detail panels */
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
.roster-panel {
  margin-bottom: 48px;
}
.roster-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
}
.roster-card {
  display: grid;
  gap: 4px;
  padding: 14px;
  border: 1px solid var(--line);
  border-radius: 9px;
  background: var(--bg);
}
.roster-card small {
  color: var(--muted);
  font-size: 11px;
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
  grid-template-columns: minmax(220px, 38%) 1fr;
  overflow: hidden;
  border: 1px solid var(--line);
  border-radius: 11px;
  background: #fffefa;
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
.data-unavailable-banner {
  display: flex;
  align-items: center;
  gap: 12px;
  margin: 16px auto 0;
  padding: 12px 16px;
  max-width: 1320px;
  border: 1px solid #e2b49f;
  border-radius: 10px;
  color: #7f321f;
  background: #fff3ed;
}
.data-unavailable-banner span {
  flex: 1;
  font-size: 13px;
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
  .phase-row-header {
    grid-template-columns: 1fr;
    display: grid;
    align-items: start;
  }
  .season-summary div + div {
    border-top: 1px solid var(--line);
    border-left: 0;
  }
  .team-grid,
  .session-grid,
  .roster-grid {
    grid-template-columns: 1fr;
  }
  .data-unavailable-banner {
    align-items: flex-start;
    flex-direction: column;
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
  .review-buttons {
    justify-items: start;
  }
  .history-layout {
    grid-template-columns: 1fr;
  }
}
</style>
