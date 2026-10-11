import fs from "node:fs/promises";
import { SpreadsheetFile, Workbook } from "@oai/artifact-tool";

const outputDir = "C:/Users/nicoi/Documents/proyectos-personales/ASISTENTE-ENTRENADORES-BASQUET/outputs/beta-tables";
const createdAt = new Date("2026-10-11T00:00:00Z");

const clubs = [{
  id: "CLUB-001", name: "Club de demostración", city: "", country: "", active: "Sí", created_at: createdAt, notes: "Registro inicial para la beta. Sustituir por el club real antes de importar.",
}];

const coaches = [{
  id: "ENT-001", name: "Laude", email: "", club_id: "CLUB-001", supabase_user_id: "", active: "Sí", created_at: createdAt, notes: "Entrenador de referencia y responsable de validar la biblioteca de ejercicios.",
}];

const teams = [
  { id: "TEAM-001", club_id: "CLUB-001", name: "Cadete A", category: "U16", age_min: 14, age_max: 16, level: "Intermedio", players_count: 12, active: "Sí", created_at: createdAt, notes: "Equipo de referencia de la interfaz actual." },
  { id: "TEAM-002", club_id: "CLUB-001", name: "Infantil B", category: "U14", age_min: 12, age_max: 14, level: "Inicial", players_count: 12, active: "Sí", created_at: createdAt, notes: "Equipo de ejemplo." },
  { id: "TEAM-003", club_id: "CLUB-001", name: "Junior", category: "U18", age_min: 16, age_max: 18, level: "Avanzado", players_count: 12, active: "Sí", created_at: createdAt, notes: "Equipo de ejemplo." },
];

const exercises = [
  { id: "warmup-ball", name: "Activación con balón", category: "Calentamiento", objective: "Elevar la temperatura y activar coordinación", description: "Movilidad dinámica, cambios de mano y finalizaciones suaves por parejas.", age_min: 12, age_max: 18, level: "Todos", intensity: "Baja", players_min: 4, players_max: 16, duration_minutes: 10, coach_notes: "Ajustar los movimientos según la carga del día.", author: "Laude", status: "Listo para importar", created_at: createdAt },
  { id: "finish-2v1", name: "Finalización 2 contra 1", category: "Finalización", objective: "Leer al defensor y decidir cerca del aro", description: "Dos atacantes salen desde medio campo contra un defensor y deben resolver en ventaja.", age_min: 14, age_max: 18, level: "Intermedio", intensity: "Media", players_min: 6, players_max: 14, duration_minutes: 20, coach_notes: "Priorizar la lectura del defensor y la velocidad de decisión.", author: "Laude", status: "Listo para importar", created_at: createdAt },
  { id: "finish-closeouts", name: "Finalizar ante closeout", category: "Finalización", objective: "Atacar el espacio tras recepción", description: "Recepción en perímetro, lectura del cierre defensivo y finalización con contacto controlado.", age_min: 14, age_max: 18, level: "Avanzado", intensity: "Alta", players_min: 6, players_max: 12, duration_minutes: 15, coach_notes: "Vigilar la calidad del primer paso y el control corporal.", author: "Laude", status: "Listo para importar", created_at: createdAt },
  { id: "finish-advantage", name: "Ventajas en superioridad", category: "Finalización", objective: "Finalizar tras crear una ventaja", description: "Situaciones 3 contra 2 continuas priorizando pase extra y ocupación de calles.", age_min: 14, age_max: 18, level: "Intermedio", intensity: "Media", players_min: 8, players_max: 15, duration_minutes: 20, coach_notes: "Pedir ocupación correcta de espacios antes de aumentar la velocidad.", author: "Laude", status: "Listo para importar", created_at: createdAt },
  { id: "finish-footwork", name: "Pies y ángulos de finalización", category: "Finalización", objective: "Dominar paradas y ángulos bajo el aro", description: "Circuito breve de eurostep, parada en dos tiempos y uso del tablero.", age_min: 12, age_max: 18, level: "Inicial", intensity: "Baja", players_min: 4, players_max: 14, duration_minutes: 15, coach_notes: "Corregir la secuencia de pies antes de exigir velocidad.", author: "Laude", status: "Listo para importar", created_at: createdAt },
  { id: "shoot-relocation", name: "Tiro tras pase y reubicación", category: "Tiro", objective: "Recibir preparado y tirar con equilibrio", description: "Pase, desplazamiento corto y tiro desde posiciones definidas.", age_min: 12, age_max: 18, level: "Intermedio", intensity: "Media", players_min: 4, players_max: 14, duration_minutes: 15, coach_notes: "Reforzar orientación de pies, manos preparadas y equilibrio.", author: "Laude", status: "Listo para importar", created_at: createdAt },
  { id: "shoot-pressure", name: "Tiro con presión temporal", category: "Tiro", objective: "Sostener la mecánica bajo presión", description: "Series de tiro por equipos con objetivo de aciertos y reloj visible.", age_min: 14, age_max: 18, level: "Avanzado", intensity: "Alta", players_min: 6, players_max: 16, duration_minutes: 15, coach_notes: "Mantener la técnica como criterio principal, no solo el resultado.", author: "Laude", status: "Listo para importar", created_at: createdAt },
  { id: "defense-1v1", name: "Defensa individual en el balón", category: "Defensa", objective: "Contener sin cometer falta", description: "Uno contra uno desde ventaja corta, con foco en postura y primer desplazamiento.", age_min: 12, age_max: 18, level: "Inicial", intensity: "Media", players_min: 6, players_max: 14, duration_minutes: 15, coach_notes: "Revisar postura, distancia y uso de manos.", author: "Laude", status: "Listo para importar", created_at: createdAt },
  { id: "defense-shell", name: "Shell defensivo 4 contra 4", category: "Defensa", objective: "Coordinar ayudas y recuperaciones", description: "Trabajo sin y con balón para ajustar posiciones, comunicación y closeouts.", age_min: 14, age_max: 18, level: "Intermedio", intensity: "Media", players_min: 8, players_max: 16, duration_minutes: 20, coach_notes: "Detener y corregir si se pierde la comunicación defensiva.", author: "Laude", status: "Listo para importar", created_at: createdAt },
  { id: "pass-advantage", name: "Pase en ventaja", category: "Pase", objective: "Encontrar al compañero libre a tiempo", description: "Rueda de pase con defensor activo y progresión a decisiones en tres contra tres.", age_min: 12, age_max: 18, level: "Inicial", intensity: "Media", players_min: 6, players_max: 15, duration_minutes: 15, coach_notes: "Valorar la intención y el momento del pase, no solo la ejecución.", author: "Laude", status: "Listo para importar", created_at: createdAt },
  { id: "pass-pressure", name: "Conservar y progresar", category: "Pase", objective: "Cuidar el balón bajo presión", description: "Juego reducido que puntúa las secuencias de pases y castiga pérdidas.", age_min: 14, age_max: 18, level: "Intermedio", intensity: "Alta", players_min: 8, players_max: 16, duration_minutes: 15, coach_notes: "Exigir ángulos de apoyo y comunicación continua.", author: "Laude", status: "Listo para importar", created_at: createdAt },
  { id: "transition-lanes", name: "Calles de contraataque", category: "Transición", objective: "Correr, pasar y ocupar espacios", description: "Salidas tras rebote con tres calles, pase adelantado y llegada al aro.", age_min: 12, age_max: 18, level: "Intermedio", intensity: "Media", players_min: 6, players_max: 15, duration_minutes: 15, coach_notes: "Marcar las calles antes de buscar velocidad de ejecución.", author: "Laude", status: "Listo para importar", created_at: createdAt },
  { id: "transition-back", name: "Balance defensivo", category: "Transición", objective: "Frenar el contraataque rival", description: "Transición de ida y vuelta donde el equipo sin balón debe proteger el aro y comunicar.", age_min: 14, age_max: 18, level: "Avanzado", intensity: "Alta", players_min: 8, players_max: 16, duration_minutes: 15, coach_notes: "Priorizar protección del aro, comunicación y emparejamiento.", author: "Laude", status: "Listo para importar", created_at: createdAt },
  { id: "cooldown", name: "Vuelta a la calma y revisión", category: "Cierre y vuelta a la calma", objective: "Bajar carga y fijar aprendizajes", description: "Movilidad suave, respiración y dos preguntas rápidas sobre las decisiones tomadas.", age_min: 10, age_max: 20, level: "Todos", intensity: "Baja", players_min: 1, players_max: 20, duration_minutes: 5, coach_notes: "Cerrar con una pregunta concreta sobre el objetivo trabajado.", author: "Laude", status: "Listo para importar", created_at: createdAt },
];

const sessions = [{
  id: "SES-001", team_id: "TEAM-001", coach_id: "ENT-001", objective: "Finalización", duration_minutes: 90, intensity: "Media", context: "El equipo jugó ayer y tiene partido dentro de dos días.", generated_session: JSON.stringify([{ order: 1, exercise_id: "warmup-ball", duration_minutes: 10 }, { order: 2, exercise_id: "finish-2v1", duration_minutes: 25 }, { order: 3, exercise_id: "finish-advantage", duration_minutes: 25 }, { order: 4, exercise_id: "finish-footwork", duration_minutes: 25 }, { order: 5, exercise_id: "cooldown", duration_minutes: 5 }]), created_at: createdAt, status: "Borrador", notes: "Sesión de ejemplo basada en la propuesta visual de Nuxt." ,
}];

const workbooks = [
  {
    filename: "01 - Clubes.xlsx", tableName: "Clubes", title: "Clubes", records: clubs,
    guide: [
      ["id", "Identificador estable del club.", "Sí", "CLUB-001"],
      ["name", "Nombre del club.", "Sí", "Club de demostración"],
      ["city", "Ciudad del club.", "No", "Madrid"],
      ["country", "País del club.", "No", "España"],
      ["active", "Indica si el club se usa en la beta.", "Sí", "Sí"],
      ["created_at", "Fecha de creación del registro.", "Sí", "2026-10-11"],
      ["notes", "Observaciones internas.", "No", ""],
    ], validations: { active: ["Sí", "No"] },
  },
  {
    filename: "02 - Entrenadores.xlsx", tableName: "Entrenadores", title: "Entrenadores", records: coaches,
    guide: [
      ["id", "Identificador estable del entrenador.", "Sí", "ENT-001"],
      ["name", "Nombre visible del entrenador.", "Sí", "Laude"],
      ["email", "Correo de contacto. Será necesario al activar autenticación.", "No", "entrenador@club.es"],
      ["club_id", "Identificador del club vinculado.", "No", "CLUB-001"],
      ["supabase_user_id", "Se completa cuando exista Supabase Auth.", "No", ""],
      ["active", "Indica si el entrenador se usa en la beta.", "Sí", "Sí"],
      ["created_at", "Fecha de creación del registro.", "Sí", "2026-10-11"],
      ["notes", "Observaciones internas.", "No", ""],
    ], validations: { active: ["Sí", "No"] },
  },
  {
    filename: "03 - Equipos.xlsx", tableName: "Equipos", title: "Equipos", records: teams,
    guide: [
      ["id", "Identificador estable del equipo.", "Sí", "TEAM-001"],
      ["club_id", "Identificador del club vinculado.", "No", "CLUB-001"],
      ["name", "Nombre del equipo.", "Sí", "Cadete A"],
      ["category", "Categoría competitiva.", "Sí", "U16"],
      ["age_min / age_max", "Rango de edad para filtrar ejercicios.", "Sí", "14 / 16"],
      ["level", "Nivel de juego predominante.", "Sí", "Intermedio"],
      ["players_count", "Número habitual de jugadores disponibles.", "Sí", "12"],
      ["active", "Indica si el equipo se usa en la beta.", "Sí", "Sí"],
      ["created_at", "Fecha de creación del registro.", "Sí", "2026-10-11"],
      ["notes", "Observaciones internas.", "No", ""],
    ], validations: { level: ["Inicial", "Intermedio", "Avanzado"], active: ["Sí", "No"] },
  },
  {
    filename: "04 - Ejercicios.xlsx", tableName: "Ejercicios", title: "Biblioteca de ejercicios", records: exercises,
    guide: [
      ["id", "Identificador estable. No modificar después de usarlo en una sesión.", "Sí", "finish-2v1"],
      ["name", "Nombre corto y reconocible del ejercicio.", "Sí", "Finalización 2 contra 1"],
      ["category", "Área principal de trabajo.", "Sí", "Finalización"],
      ["objective", "Habilidad o decisión que se entrena.", "Sí", "Leer al defensor y decidir cerca del aro"],
      ["description", "Instrucciones claras para ejecutar el ejercicio.", "Sí", "Dos atacantes salen..."],
      ["age_min / age_max", "Rango recomendado de edad.", "Sí", "14 / 18"],
      ["level", "Nivel recomendado.", "Sí", "Intermedio"],
      ["intensity", "Carga principal: baja, media o alta.", "Sí", "Media"],
      ["players_min / players_max", "Número de participantes compatible.", "Sí", "6 / 14"],
      ["duration_minutes", "Duración orientativa del bloque.", "Sí", "15"],
      ["coach_notes", "Claves metodológicas de Laude.", "No", "Priorizar la lectura del defensor."],
      ["author", "Autor o fuente del ejercicio.", "Sí", "Laude"],
      ["status", "Estado de revisión antes de llevarlo a Nuxt o Supabase.", "Sí", "Listo para importar"],
      ["created_at", "Fecha de creación del registro.", "Sí", "2026-10-11"],
    ], validations: {
      category: ["Calentamiento", "Tiro", "Finalización", "Pase", "Manejo de balón", "Defensa", "Rebote", "Transición", "Táctica", "Toma de decisiones", "Cierre y vuelta a la calma"],
      level: ["Inicial", "Intermedio", "Avanzado", "Todos"],
      intensity: ["Baja", "Media", "Alta"],
      status: ["Borrador", "Revisado", "Listo para importar"],
    },
  },
  {
    filename: "05 - Sesiones de entrenamiento.xlsx", tableName: "Sesiones", title: "Sesiones de entrenamiento", records: sessions,
    guide: [
      ["id", "Identificador estable de la sesión.", "Sí", "SES-001"],
      ["team_id", "Equipo al que se dirige la sesión.", "Sí", "TEAM-001"],
      ["coach_id", "Entrenador que crea o valida la sesión.", "No", "ENT-001"],
      ["objective", "Objetivo principal solicitado.", "Sí", "Finalización"],
      ["duration_minutes", "Duración total solicitada.", "Sí", "90"],
      ["intensity", "Carga solicitada.", "Sí", "Media"],
      ["context", "Contexto: calendario, carga, partido o disponibilidad.", "No", "El equipo jugó ayer..."],
      ["generated_session", "JSON con orden, ejercicio y duración de los bloques.", "Sí", "[{'order':1,...}]"],
      ["created_at", "Fecha de creación de la sesión.", "Sí", "2026-10-11"],
      ["status", "Estado de la sesión.", "Sí", "Borrador"],
      ["notes", "Observaciones del entrenador.", "No", ""],
    ], validations: { objective: ["Tiro", "Finalización", "Pase", "Manejo de balón", "Defensa", "Rebote", "Transición", "Táctica", "Toma de decisiones"], intensity: ["Baja", "Media", "Alta"], status: ["Borrador", "Revisada", "Aplicada"] },
  },
];

const columnLetters = (count) => {
  let result = "";
  let value = count;
  while (value > 0) {
    const remainder = (value - 1) % 26;
    result = String.fromCharCode(65 + remainder) + result;
    value = Math.floor((value - 1) / 26);
  }
  return result;
};

function formatDataSheet(sheet, headers, rows, tableName, validations) {
  const lastColumn = columnLetters(headers.length);
  const lastRow = rows.length + 1;
  sheet.showGridLines = false;
  sheet.getRange(`A1:${lastColumn}${lastRow}`).values = [headers, ...rows];
  const header = sheet.getRange(`A1:${lastColumn}1`);
  header.format = { fill: "#203D30", font: { name: "Arial", bold: true, color: "#FFFFFF", size: 10 }, horizontalAlignment: "center", verticalAlignment: "center", wrapText: true, borders: { preset: "all", style: "thin", color: "#FFFFFF" } };
  const body = sheet.getRange(`A2:${lastColumn}${lastRow}`);
  body.format = { font: { name: "Arial", size: 10, color: "#17231D" }, verticalAlignment: "top", wrapText: true, borders: { preset: "inside", style: "thin", color: "#E2E7E0" } };
  sheet.getRange(`A1:${lastColumn}${lastRow}`).format.autofitColumns();
  sheet.getRange(`A1:${lastColumn}${lastRow}`).format.autofitRows();
  sheet.freezePanes.freezeRows(1);
  sheet.tables.add(`A1:${lastColumn}${lastRow}`, true, `${tableName}Table`);
  headers.forEach((headerName, index) => {
    if (!validations[headerName]) return;
    const letter = columnLetters(index + 1);
    sheet.getRange(`${letter}2:${letter}200`).dataValidation = { rule: { type: "list", values: validations[headerName] } };
  });
  const dateIndex = headers.indexOf("created_at");
  if (dateIndex >= 0) sheet.getRange(`${columnLetters(dateIndex + 1)}2:${columnLetters(dateIndex + 1)}${lastRow}`).format.numberFormat = "yyyy-mm-dd";
}

function formatGuideSheet(sheet, title, guide) {
  sheet.showGridLines = false;
  sheet.getRange("A1:D1").merge();
  sheet.getRange("A1").values = [[`${title} · Guía de edición`]];
  sheet.getRange("A1:D1").format = { fill: "#E9EEE7", font: { name: "Arial", bold: true, color: "#203D30", size: 14 }, horizontalAlignment: "left", verticalAlignment: "center" };
  sheet.getRange("A3:D3").values = [["Campo", "Uso", "Obligatorio", "Ejemplo"]];
  sheet.getRange(`A4:D${guide.length + 3}`).values = guide;
  sheet.getRange(`A3:D${guide.length + 3}`).format = { font: { name: "Arial", size: 10, color: "#17231D" }, verticalAlignment: "top", wrapText: true };
  sheet.getRange("A3:D3").format = { fill: "#6A806F", font: { name: "Arial", bold: true, color: "#FFFFFF", size: 10 }, horizontalAlignment: "center", verticalAlignment: "center" };
  sheet.getRange(`A3:D${guide.length + 3}`).format.borders = { preset: "inside", style: "thin", color: "#E2E7E0" };
  sheet.getRange(`A3:D${guide.length + 3}`).format.autofitColumns();
  sheet.getRange(`A3:D${guide.length + 3}`).format.autofitRows();
  sheet.getRange("A1:D1").format.rowHeight = 28;
  sheet.freezePanes.freezeRows(3);
}

await fs.mkdir(outputDir, { recursive: true });
for (const definition of workbooks) {
  const workbook = Workbook.create();
  const dataSheet = workbook.worksheets.add("Datos");
  const guideSheet = workbook.worksheets.add("Guía");
  const headers = Object.keys(definition.records[0]);
  const rows = definition.records.map((record) => headers.map((header) => record[header]));
  formatDataSheet(dataSheet, headers, rows, definition.tableName, definition.validations);
  formatGuideSheet(guideSheet, definition.title, definition.guide);
  workbook.recalculate();
  const inspect = await workbook.inspect({ kind: "table", range: `Datos!A1:${columnLetters(headers.length)}${Math.min(rows.length + 1, 6)}`, include: "values", tableMaxRows: 6, tableMaxCols: headers.length });
  if (!inspect.ndjson.includes(headers[0])) throw new Error(`No se pudo validar ${definition.filename}`);
  const preview = await workbook.render({ sheetName: "Datos", autoCrop: "all", scale: 1, format: "png" });
  await fs.writeFile(`${outputDir}/${definition.filename.replace(".xlsx", ".png")}`, new Uint8Array(await preview.arrayBuffer()));
  const guidePreview = await workbook.render({ sheetName: "Guía", autoCrop: "all", scale: 1, format: "png" });
  await fs.writeFile(`${outputDir}/${definition.filename.replace(".xlsx", " - Guía.png")}`, new Uint8Array(await guidePreview.arrayBuffer()));
  const output = await SpreadsheetFile.exportXlsx(workbook);
  await output.save(`${outputDir}/${definition.filename}`);
}
