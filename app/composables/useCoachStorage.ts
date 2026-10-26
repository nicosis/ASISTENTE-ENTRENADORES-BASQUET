import {
  type AgeCategory,
  type CompetitiveLevel,
  type HydratedSessionBlock,
  type PhaseSessionRecord,
  type PlanPhaseRecord,
  type PlanRecord,
  type TrainingDay,
} from "~/shared/training";

export type DayId = TrainingDay;
export type View =
  | "home"
  | "team"
  | "create-team"
  | "create-season"
  | "session";
export type TeamTab = "week" | "tables" | "holidays-tests";
export type CoachRole = "admin" | "coach";
export type TeamStatus = "active" | "archived";

export interface CoachProfile {
  id: string;
  name: string;
  role: CoachRole;
}

export interface Player {
  id: string;
  name: string;
}

export interface TeamPlayer {
  id: string;
  teamId: string;
  playerId: string;
  status: "active" | "inactive";
  joinedAt: string;
  leftAt: string | null;
}

export interface Season {
  id: string;
  teamId: string;
  planId?: string;
  name: string;
  category: string;
  ageCategory: AgeCategory;
  competitiveLevel: CompetitiveLevel;
  startsAt: string;
  endsAt: string;
  trainingDays: string[];
  context: string;
  status: "active" | "closed";
}

export interface Team {
  id: string;
  coachId: string;
  name: string;
  club: string;
  status: TeamStatus;
}

export interface WeeklyReview {
  id: string;
  seasonId: string;
  weekStart: string;
  text: string;
  createdAt: string;
}

export interface GeneratedSessionResponse {
  plan: PlanRecord;
  phase: PlanPhaseRecord;
  weekNumber: number;
  weekInPhase: number;
  loadIndex: number;
  isDeload: boolean;
  session: PhaseSessionRecord;
  objective: string;
  duration: number;
  rationale: string;
  sessionBlocks: HydratedSessionBlock[];
}

export interface SelectOption<T extends string> {
  value: T;
  label: string;
}

export const ageCategoryOptions: SelectOption<AgeCategory>[] = [
  { value: "alevin", label: "Alevín (U12)" },
  { value: "infantil", label: "Infantil (U14)" },
  { value: "cadete", label: "Cadete (U16)" },
  { value: "juvenil", label: "Juvenil (U18)" },
];

export const competitiveLevelOptions: SelectOption<CompetitiveLevel>[] = [
  { value: "formacion", label: "Equipo Formación" },
  { value: "liga", label: "Equipo Liga" },
];

export const blockPalette: string[] = [
  "#69806f",
  "#e66b48",
  "#203d30",
  "#3b8f7f",
  "#7a5cc4",
];

export const weekdays: string[] = [
  "Lunes",
  "Martes",
  "Miércoles",
  "Jueves",
  "Viernes",
  "Sábado",
];

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function isAgeCategory(value: unknown): value is AgeCategory {
  return (
    value === "alevin" ||
    value === "infantil" ||
    value === "cadete" ||
    value === "juvenil"
  );
}

export function isCompetitiveLevel(value: unknown): value is CompetitiveLevel {
  return value === "formacion" || value === "liga";
}

export function isCoachRole(value: unknown): value is CoachRole {
  return value === "admin" || value === "coach";
}

export function isTeamStatus(value: unknown): value is TeamStatus {
  return value === "active" || value === "archived";
}

function isPlayer(value: unknown): value is Player {
  return (
    isRecord(value) &&
    typeof value.id === "string" &&
    typeof value.name === "string"
  );
}

function isTeam(value: unknown): value is Team {
  return (
    isRecord(value) &&
    typeof value.id === "string" &&
    typeof value.coachId === "string" &&
    typeof value.name === "string" &&
    typeof value.club === "string" &&
    (value.status === undefined || isTeamStatus(value.status))
  );
}

function isTeamPlayer(value: unknown): value is TeamPlayer {
  return isRecord(value) &&
    typeof value.id === "string" &&
    typeof value.teamId === "string" &&
    typeof value.playerId === "string" &&
    (value.status === "active" || value.status === "inactive") &&
    typeof value.joinedAt === "string" &&
    (typeof value.leftAt === "string" || value.leftAt === null);
}

export function isPlayerArray(value: unknown): value is Player[] {
  return Array.isArray(value) && value.every(isPlayer);
}

export function isTeamPlayerArray(value: unknown): value is TeamPlayer[] {
  return Array.isArray(value) && value.every(isTeamPlayer);
}

export function isTeamArray(value: unknown): value is Team[] {
  return Array.isArray(value) && value.every(isTeam);
}

function isSeason(value: unknown): value is Season {
  if (!isRecord(value)) return false;
  return (
    typeof value.id === "string" &&
    typeof value.teamId === "string" &&
    typeof value.name === "string" &&
    typeof value.category === "string" &&
    typeof value.startsAt === "string" &&
    typeof value.endsAt === "string" &&
    Array.isArray(value.trainingDays) &&
    value.trainingDays.every((day): day is string => typeof day === "string") &&
    typeof value.context === "string" &&
    (value.status === "active" || value.status === "closed")
  );
}

export function isSeasonArray(value: unknown): value is Season[] {
  return Array.isArray(value) && value.every(isSeason);
}

function isWeeklyReview(value: unknown): value is WeeklyReview {
  return (
    isRecord(value) &&
    typeof value.id === "string" &&
    typeof value.seasonId === "string" &&
    typeof value.weekStart === "string" &&
    typeof value.text === "string" &&
    typeof value.createdAt === "string"
  );
}

export function isWeeklyReviewArray(value: unknown): value is WeeklyReview[] {
  return Array.isArray(value) && value.every(isWeeklyReview);
}

export function isCoachProfile(value: unknown): value is CoachProfile {
  return (
    isRecord(value) &&
    typeof value.name === "string" &&
    value.name.trim().length > 0 &&
    (typeof value.id === "string" || value.id === undefined) &&
    (value.role === undefined || isCoachRole(value.role))
  );
}

export function isCoachArray(value: unknown): value is CoachProfile[] {
  return Array.isArray(value) && value.every(isCoachProfile);
}

export function useCoachStorage() {
  function readStorageJson<T>(
    key: string,
    guard: (candidate: unknown) => candidate is T,
  ): T | null {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return null;
      const parsed: unknown = JSON.parse(raw);
      return guard(parsed) ? parsed : null;
    } catch {
      return null;
    }
  }

  function writeStorageJson(key: string, value: unknown): void {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // Ignorar errores de cuota o acceso a localStorage
    }
  }

  function readStorageFlag(key: string): string | null {
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  }

  function writeStorageFlag(key: string, value: string): void {
    try {
      localStorage.setItem(key, value);
    } catch {
      // Ignorar errores de acceso a localStorage
    }
  }

  function removeStorageKey(key: string): void {
    try {
      localStorage.removeItem(key);
    } catch {
      // Ignorar errores de acceso a localStorage
    }
  }

  return {
    readStorageJson,
    writeStorageJson,
    readStorageFlag,
    writeStorageFlag,
    removeStorageKey,
  };
}

export function asLocalDate(value: string): Date {
  return new Date(`${value}T00:00:00`);
}

export function dateKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

export function addDays(value: string, amount: number): string {
  const date = asLocalDate(value);
  date.setDate(date.getDate() + amount);
  return dateKey(date);
}

export function mondayFor(value: string): string {
  const date = asLocalDate(value);
  date.setDate(date.getDate() - ((date.getDay() + 6) % 7));
  return dateKey(date);
}

export function categoryLabelFor(
  ageCategory: AgeCategory,
  competitiveLevel: CompetitiveLevel,
): string {
  const cat =
    ageCategoryOptions.find((item) => item.value === ageCategory)?.label ||
    "Cadete (U16)";
  const lvl =
    competitiveLevelOptions.find((item) => item.value === competitiveLevel)
      ?.label || "Equipo Liga";
  return `${cat} · ${lvl}`;
}

export function coachIdFor(name: string): string {
  const hash = Array.from(name.trim().toUpperCase()).reduce(
    (acc, ch) => (acc * 31 + ch.charCodeAt(0)) % 9999,
    0,
  );
  return `ENT${String(Math.max(1, hash)).padStart(4, "0")}`;
}

export function nextId(prefix: string, existing: string[]): string {
  const maxNum = existing.reduce((max, id) => {
    const match = id.match(/(\d+)$/);
    const num = match ? Number.parseInt(match[1] || "0", 10) : 0;
    return Number.isFinite(num) && num > max ? num : max;
  }, 0);
  return `${prefix.slice(0, 3).toUpperCase()}${String(maxNum + 1).padStart(4, "0")}`;
}

export function formattedDate(value: string): string {
  return new Intl.DateTimeFormat("es-ES", {
    day: "numeric",
    month: "short",
    year: "numeric",
  })
    .format(new Date(`${value}T00:00:00`))
    .replace(".", "");
}
