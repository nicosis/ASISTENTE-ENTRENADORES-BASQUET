<script setup lang="ts">
import { getWeeklyPlan, type Frequency, type TrainingDay } from "~/shared/training";

type DayId = TrainingDay;
type Player = { id: string; name: string };
type Season = {
  id: string;
  teamId: string;
  name: string;
  category: string;
  startsAt: string;
  endsAt: string;
  trainingDays: string[];
  context: string;
  status: "active" | "closed";
};
type Team = {
  id: string;
  coachId: string;
  name: string;
  club: string;
  players: Player[];
};
type WeeklyReview = {
  id: string;
  seasonId: string;
  weekStart: string;
  text: string;
  createdAt: string;
};
type SessionBlock = {
  order: number;
  phase: string;
  title: string;
  duration: number;
  objective: string;
  description: string;
};
type TrainingSession = {
  objective: string;
  duration: number;
  rationale: string;
  blocks: SessionBlock[];
};
type View = "home" | "team" | "create-team" | "create-season";

const coach = { id: "ENT001", name: "Nicolás" };
const signedIn = ref(true);
const weekdays = [
  "Lunes",
  "Martes",
  "Miércoles",
  "Jueves",
  "Viernes",
  "Sábado",
];
const seedTeams: Team[] = [
  {
    id: "EQU001",
    coachId: "ENT001",
    name: "Tigres",
    club: "Club Baloncesto Norte",
    players: [
      { id: "JUG001", name: "Álex Martín" },
      { id: "JUG002", name: "Bruno López" },
      { id: "JUG003", name: "Dani Ruiz" },
    ],
  },
];
const seedSeasons: Season[] = [
  {
    id: "TEM001",
    teamId: "EQU001",
    name: "2026-27",
    category: "Cadete U16",
    startsAt: "2026-10-12",
    endsAt: "2027-05-30",
    trainingDays: ["Lunes", "Miércoles", "Viernes"],
    context: "Base inicial del prototipo.",
    status: "active",
  },
];

const view = ref<View>("home");
const teams = ref<Team[]>(seedTeams);
const seasons = ref<Season[]>(seedSeasons);
const reviews = ref<WeeklyReview[]>([]);
const activeTeamId = ref("EQU001");
const activeSeasonId = ref("TEM001");
const reviewDraft = ref("");
const selectedDay = ref<DayId>("dia1");
const session = ref<TrainingSession | null>(null);
const loadingSession = ref(false);
const error = ref("");
const teamDraft = ref({ name: "", club: "", players: "" });
const seasonDraft = ref({
  name: "2026-27",
  category: "",
  startsAt: "",
  endsAt: "",
  trainingDays: ["Lunes", "Miércoles"],
  context: "",
});

const activeTeam = computed(() =>
  teams.value.find((team) => team.id === activeTeamId.value),
);
const activeSeason = computed(() =>
  seasons.value.find((season) => season.id === activeSeasonId.value),
);
const frequency = computed(
  () =>
    Math.min(
      3,
      Math.max(1, activeSeason.value?.trainingDays.length || 1),
    ) as Frequency,
);
const currentPlan = computed(() => getWeeklyPlan(frequency.value));
const activeReviews = computed(() =>
  reviews.value
    .filter((review) => review.seasonId === activeSeasonId.value)
    .sort((a, b) => b.weekStart.localeCompare(a.weekStart)),
);
const today = new Date().toISOString().slice(0, 10);

function nextId(prefix: string, existing: string[]) {
  return `${prefix}${String(existing.length + 1).padStart(3, "0")}`;
}
function saveState() {
  localStorage.setItem("pizarra-teams-v2", JSON.stringify(teams.value));
  localStorage.setItem("pizarra-seasons-v2", JSON.stringify(seasons.value));
  localStorage.setItem("pizarra-reviews-v2", JSON.stringify(reviews.value));
}
function loadState() {
  const storedTeams = localStorage.getItem("pizarra-teams-v2");
  const storedSeasons = localStorage.getItem("pizarra-seasons-v2");
  const storedReviews = localStorage.getItem("pizarra-reviews-v2");
  if (storedTeams) teams.value = JSON.parse(storedTeams);
  if (storedSeasons) seasons.value = JSON.parse(storedSeasons);
  if (storedReviews) reviews.value = JSON.parse(storedReviews);
  if (teams.value[0]) activeTeamId.value = teams.value[0].id;
  const season =
    seasons.value.find(
      (item) => item.teamId === activeTeamId.value && item.status === "active",
    ) || seasons.value[0];
  if (season) activeSeasonId.value = season.id;
}
function signOut() {
  session.value = null;
  error.value = "";
  view.value = "home";
  localStorage.setItem("pizarra-coach-session", "signed-out");
  signedIn.value = false;
}
function signIn() {
  localStorage.removeItem("pizarra-coach-session");
  signedIn.value = true;
}
function openTeam(teamId: string) {
  activeTeamId.value = teamId;
  const season =
    seasons.value.find(
      (item) => item.teamId === teamId && item.status === "active",
    ) || seasons.value.find((item) => item.teamId === teamId);
  if (season) activeSeasonId.value = season.id;
  selectedDay.value = "dia1";
  session.value = null;
  view.value = "team";
}
function openCreateTeam() {
  teamDraft.value = { name: "", club: "", players: "" };
  view.value = "create-team";
}
function createTeam() {
  if (!teamDraft.value.name.trim()) return;
  const teamId = nextId(
    "EQU",
    teams.value.map((item) => item.id),
  );
  const players = teamDraft.value.players
    .split("\n")
    .map((name) => name.trim())
    .filter(Boolean)
    .map((name, index) => ({
      id: `JUG${String(teams.value.flatMap((team) => team.players).length + index + 1).padStart(3, "0")}`,
      name,
    }));
  teams.value.push({
    id: teamId,
    coachId: coach.id,
    name: teamDraft.value.name.trim(),
    club: teamDraft.value.club.trim() || "Sin club",
    players,
  });
  activeTeamId.value = teamId;
  seasonDraft.value = {
    name: "2026-27",
    category: "",
    startsAt: "",
    endsAt: "",
    trainingDays: ["Lunes", "Miércoles"],
    context: "",
  };
  saveState();
  view.value = "create-season";
}
function toggleDraftDay(day: string) {
  const current = seasonDraft.value.trainingDays;
  if (current.includes(day)) {
    if (current.length === 1) return;
    seasonDraft.value.trainingDays = current.filter((item) => item !== day);
  } else if (current.length < 3)
    seasonDraft.value.trainingDays = [...current, day];
}
function createSeason() {
  if (
    !activeTeam.value ||
    !seasonDraft.value.category.trim() ||
    !seasonDraft.value.startsAt ||
    !seasonDraft.value.endsAt
  )
    return;
  const season: Season = {
    id: nextId(
      "TEM",
      seasons.value.map((item) => item.id),
    ),
    teamId: activeTeam.value.id,
    name: seasonDraft.value.name || "Nueva temporada",
    category: seasonDraft.value.category.trim(),
    startsAt: seasonDraft.value.startsAt,
    endsAt: seasonDraft.value.endsAt,
    trainingDays: seasonDraft.value.trainingDays,
    context: seasonDraft.value.context.trim(),
    status: "active",
  };
  seasons.value
    .filter(
      (item) =>
        item.teamId === activeTeam.value?.id && item.status === "active",
    )
    .forEach((item) => {
      item.status = "closed";
    });
  seasons.value.push(season);
  activeSeasonId.value = season.id;
  saveState();
  view.value = "team";
}
function weekStart() {
  const date = new Date();
  const offset = (date.getDay() + 6) % 7;
  date.setDate(date.getDate() - offset);
  return date.toISOString().slice(0, 10);
}
function saveReview() {
  if (!reviewDraft.value.trim() || !activeSeason.value) return;
  reviews.value.unshift({
    id: nextId(
      "OBS",
      reviews.value.map((item) => item.id),
    ),
    seasonId: activeSeason.value.id,
    weekStart: weekStart(),
    text: reviewDraft.value.trim(),
    createdAt: new Date().toISOString(),
  });
  reviewDraft.value = "";
  saveState();
}
async function generateSession(day: DayId) {
  selectedDay.value = day;
  loadingSession.value = true;
  error.value = "";
  try {
    session.value = await $fetch<TrainingSession>("/api/generate-training", {
      method: "POST",
      body: { day, frequency: frequency.value },
    });
  } catch {
    error.value = "No se pudo preparar la sesión. Inténtalo de nuevo.";
  } finally {
    loadingSession.value = false;
  }
}
function formattedDate(value: string) {
  return new Intl.DateTimeFormat("es-ES", {
    day: "numeric",
    month: "short",
    year: "numeric",
  })
    .format(new Date(`${value}T00:00:00`))
    .replace(".", "");
}
onMounted(() => {
  signedIn.value = localStorage.getItem("pizarra-coach-session") !== "signed-out";
  loadState();
});
</script>

<template>
  <main class="app-shell">
    <header class="topbar">
      <button class="brand" type="button" @click="view = 'home'">
        <span class="brand-ball">B</span><span>pizarra</span>
      </button>
      <div class="topbar-right">
        <template v-if="signedIn">
          <span class="coach-avatar">{{ coach.name.slice(0, 1) }}</span
          ><span>{{ coach.name }}</span
          ><button class="logout-button" type="button" @click="signOut">
            Cerrar sesión
          </button>
        </template>
      </div>
    </header>
    <section v-if="!signedIn" class="page auth-page">
      <p class="eyebrow">SESIÓN CERRADA</p>
      <h1>Hasta pronto, {{ coach.name }}.</h1>
      <p>El equipo y sus temporadas se conservan en este dispositivo.</p>
      <button class="primary-button" type="button" @click="signIn">
        Entrar como {{ coach.name }}
      </button>
    </section>
    <section v-else-if="view === 'home'" class="page home-page">
      <p class="eyebrow">PANEL DEL ENTRENADOR</p>
      <div class="heading-row">
        <div>
          <h1>Mis equipos.</h1>
          <p>
            Abre una temporada para preparar sus sesiones y recuperar su
            historial semanal.
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
                (season) =>
                  season.teamId === team.id && season.status === "active",
              )?.category || "Sin temporada activa"
            }}</strong
            ><small>{{ team.players.length }} jugadores</small>
          </div>
          <em>Abrir equipo →</em>
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
        <label
          >Nombre identificativo<input
            v-model="teamDraft.name"
            required
            placeholder="Ej. Tigres" /></label
        ><label
          >Club<input
            v-model="teamDraft.club"
            placeholder="Ej. Club Baloncesto Norte" /></label
        ><label
          >Jugadores <small>Uno por línea. Puedes completarlo después.</small
          ><textarea
            v-model="teamDraft.players"
            rows="6"
            placeholder="Álex Martín&#10;Bruno López&#10;Dani Ruiz"
          ></textarea></label
        ><button class="primary-button" type="submit">
          Continuar a la temporada →
        </button>
      </form>
    </section>

    <section v-else-if="view === 'create-season'" class="page form-page">
      <button class="back" type="button" @click="view = 'home'">
        ← Mis equipos
      </button>
      <p class="eyebrow">PASO 2 DE 2 · TEMPORADA</p>
      <h1>Define {{ activeTeam?.name }}.</h1>
      <p>
        La temporada determina cuántas sesiones aparecen cada semana y qué
        plantilla utiliza la app.
      </p>
      <form @submit.prevent="createSeason">
        <div class="form-grid">
          <label
            >Nombre de temporada<input
              v-model="seasonDraft.name"
              placeholder="2026-27" /></label
          ><label
            >Categoría<input
              v-model="seasonDraft.category"
              required
              placeholder="Ej. Cadete U16" /></label
          ><label
            >Inicio<input
              v-model="seasonDraft.startsAt"
              type="date"
              required /></label
          ><label
            >Final<input
              v-model="seasonDraft.endsAt"
              type="date"
              :min="seasonDraft.startsAt"
              required
          /></label>
        </div>
        <fieldset>
          <legend>Días de entrenamiento <small>Elige 1, 2 o 3.</small></legend>
          <div class="day-pills">
            <label v-for="day in weekdays" :key="day"
              ><input
                type="checkbox"
                :checked="seasonDraft.trainingDays.includes(day)"
                :disabled="
                  !seasonDraft.trainingDays.includes(day) &&
                  seasonDraft.trainingDays.length >= 3
                "
                @change="toggleDraftDay(day)"
              /><span>{{ day }}</span></label
            >
          </div>
        </fieldset>
        <label
          >Contexto inicial<textarea
            v-model="seasonDraft.context"
            rows="4"
            placeholder="Objetivos, experiencia del grupo, restricciones o necesidades…"
          ></textarea></label
        ><button class="primary-button" type="submit">Crear temporada →</button>
      </form>
    </section>

    <section v-else class="page team-page">
      <button class="back" type="button" @click="view = 'home'">
        ← Mis equipos
      </button>
      <div class="team-heading">
        <div>
          <p class="eyebrow">
            {{ activeTeam?.id }} · TEMPORADA {{ activeSeason?.name }}
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
          <span>ENTRENOS</span
          ><strong
            >{{ frequency }} {{ frequency === 1 ? "día" : "días" }} /
            semana</strong
          >
        </div>
        <div>
          <span>PERIODO</span
          ><strong>{{
            activeSeason
              ? `${formattedDate(activeSeason.startsAt)} – ${formattedDate(activeSeason.endsAt)}`
              : "—"
          }}</strong>
        </div>
        <div>
          <span>PLANTILLA</span
          ><strong>{{ activeTeam?.players.length || 0 }} jugadores</strong>
        </div>
      </section>
      <section class="section-heading">
        <div>
          <p class="eyebrow">ESTA SEMANA</p>
          <h2>Sesiones propuestas.</h2>
          <span>La frecuencia elegida decide las plantillas disponibles.</span>
        </div>
      </section>
      <section class="session-grid">
        <article v-for="(item, index) in currentPlan" :key="item.id">
          <span>SESIÓN {{ index + 1 }}</span>
          <h3>{{ item.title }}</h3>
          <p>{{ activeSeason?.trainingDays[index] }} · {{ item.duration }} min</p>
          <button
            class="secondary-button"
            type="button"
            :disabled="loadingSession"
            @click="generateSession(item.id)"
          >
            {{
              loadingSession && selectedDay === item.id
                ? "Preparando…"
                : "Ver propuesta"
            }}
          </button>
        </article>
      </section>
      <section class="review-section">
        <div>
          <p class="eyebrow">OBSERVACIONES</p>
          <h2>Valora la semana.</h2>
          <span>Se guardan como histórico de esta temporada.</span>
        </div>
        <div>
          <textarea
            v-model="reviewDraft"
            rows="4"
            placeholder="Carga percibida, asistencia, progresos, molestias…"
          ></textarea
          ><button class="primary-button" type="button" @click="saveReview">
            Guardar observación
          </button>
        </div>
      </section>
      <section v-if="activeReviews.length" class="history">
        <p class="eyebrow">HISTORIAL</p>
        <article v-for="review in activeReviews" :key="review.id">
          <span
            >{{ review.id }} · Semana del
            {{ formattedDate(review.weekStart) }}</span
          >
          <p>{{ review.text }}</p>
        </article>
      </section>
      <section v-if="session" class="session-result">
        <button class="close" type="button" @click="session = null">
          Cerrar ×
        </button>
        <p class="eyebrow">PROPUESTA DE SESIÓN · {{ session.duration }} MIN</p>
        <h2>{{ session.objective }}</h2>
        <p>{{ session.rationale }}</p>
        <ol>
          <li v-for="block in session.blocks" :key="block.order">
            <span>{{ String(block.order).padStart(2, "0") }}</span>
            <div>
              <small>{{ block.phase }}</small>
              <h3>{{ block.title }}</h3>
              <strong>{{ block.objective }} · {{ block.duration }} min</strong>
              <p>{{ block.description }}</p>
            </div>
          </li>
        </ol>
      </section>
      <p v-if="error" class="error">{{ error }}</p>
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
  font: 600 clamp(38px, 6vw, 56px) / 1 Georgia, serif;
  letter-spacing: -0.045em;
}
.auth-page > p:not(.eyebrow) {
  margin: 16px 0 28px;
  color: var(--muted);
  line-height: 1.5;
}
.page {
  width: min(1040px, calc(100% - 44px));
  margin: 0 auto;
  padding: 70px 0 90px;
}
.eyebrow {
  margin: 0 0 10px;
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
    600 clamp(44px, 7vw, 68px)/0.94 Georgia,
    serif;
  letter-spacing: -0.06em;
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
  padding: 12px 15px;
  font-weight: 750;
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
  margin-bottom: 36px;
}
.form-page form {
  display: grid;
  gap: 19px;
  margin-top: 32px;
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
  margin-bottom: 34px;
}
.season-summary {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  overflow: hidden;
  margin: 35px 0 58px;
  border: 1px solid var(--line);
  border-radius: 12px;
}
.season-summary div {
  display: grid;
  gap: 6px;
  padding: 17px;
  background: var(--soft);
}
.season-summary div + div {
  border-left: 1px solid var(--line);
}
.season-summary span,
.session-grid article > span,
.history article span {
  color: #69806f;
  font-size: 10px;
  font-weight: 750;
  letter-spacing: 0.08em;
}
.season-summary strong {
  font:
    600 18px Georgia,
    serif;
}
.section-heading h2,
.review-section h2,
.history h2,
.session-result h2 {
  margin: 0;
  font:
    600 34px Georgia,
    serif;
  letter-spacing: -0.045em;
}
.section-heading span,
.review-section span {
  color: var(--muted);
  font-size: 13px;
}
.session-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  margin: 22px 0 52px;
}
.session-grid article {
  display: grid;
  gap: 10px;
  min-height: 196px;
  padding: 18px;
  border: 1px solid var(--line);
  border-radius: 11px;
  background: var(--surface);
}
.session-grid h3 {
  margin: 0;
  font:
    600 22px Georgia,
    serif;
}
.session-grid p {
  margin: 0;
  color: var(--muted);
  font-size: 13px;
}
.session-grid button {
  align-self: end;
  justify-self: start;
  padding: 9px 11px;
  font-size: 12px;
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
.review-section .primary-button {
  justify-self: end;
}
.history {
  margin-top: 42px;
}
.history article {
  padding: 16px 0;
  border-bottom: 1px solid var(--line);
}
.history article p {
  margin: 7px 0 0;
  line-height: 1.5;
}
.session-result {
  position: fixed;
  z-index: 10;
  right: clamp(18px, 5vw, 72px);
  bottom: 25px;
  width: min(550px, calc(100% - 36px));
  max-height: 80vh;
  overflow: auto;
  padding: 25px;
  border: 1px solid #bccbbb;
  border-radius: 14px;
  background: var(--surface);
  box-shadow: 0 22px 60px rgba(23, 46, 33, 0.2);
}
.session-result .close {
  float: right;
}
.session-result > p:not(.eyebrow) {
  color: var(--muted);
  line-height: 1.5;
}
.session-result ol {
  display: grid;
  gap: 13px;
  margin: 22px 0 0;
  padding: 0;
  list-style: none;
}
.session-result li {
  display: grid;
  grid-template-columns: 34px 1fr;
  gap: 10px;
}
.session-result li > span {
  color: #708076;
  font-size: 11px;
  font-weight: 750;
}
.session-result small {
  color: #69806f;
  font-weight: 750;
  letter-spacing: 0.06em;
}
.session-result h3 {
  margin: 3px 0;
  font:
    600 20px Georgia,
    serif;
}
.session-result strong,
.session-result li p {
  font-size: 13px;
}
.session-result li p {
  margin: 5px 0;
  color: var(--muted);
  line-height: 1.4;
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
@media (max-width: 720px) {
  .page {
    padding-top: 46px;
  }
  .heading-row,
  .team-heading,
  .review-section {
    grid-template-columns: 1fr;
    display: grid;
    align-items: start;
  }
  .team-grid,
  .session-grid,
  .season-summary {
    grid-template-columns: 1fr;
  }
  .season-summary div + div {
    border-top: 1px solid var(--line);
    border-left: 0;
  }
  .form-grid {
    grid-template-columns: 1fr;
  }
  .topbar {
    padding: 0 22px;
  }
  .team-card {
    min-height: 190px;
  }
}
</style>
