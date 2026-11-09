# Independent holiday mesocycles
Branch: feat/modelo-cadete | Delivery: ask-on-risk | Runner: node --test tests/*.test.mjs; npm run build

## Specs
- S1: «agregar el receso de semana santa 1 semana y el receso de navidad 2 semanas» como «mesosiclos indfependientes, para facilitarl el contaje de semanas y fechas y que no se defase».
- S2: Temporada 2026-27: «Navidad 21 y 28 de diciembre de 2026 y Semana Santa 22 de marzo de 2027»; el usuario confirmó las fechas y autorizó la actualización con la cuenta conectada de Google Drive.

## Tasks
- [ ] T1 (S1–S2) Inline: align independent holiday phases and preserve training sessions and dates; verify. Risk: items 1 and 3.
- [ ] T2 (S1–S2) Inline: update and verify the existing season and associated Sheet records after compatible code is ready. Risk: item 1.

## Log
- L1: «mientras podriamso ir gestionando que en la tabla d emesosiclos nos falta agregar el receso de semana santa 1 semana y el receso de navidad 2 semanas»
- L2: «agregalo como mesosiclos indfependientes, para facilitarl el contaje de semanas y fechas y que no se defase»
- L3: User confirmed 2026-12-21, 2026-12-28 and 2027-03-22 and authorized the connected Google Drive account.
- Existing season TEM0001 has 47 planned microcycles; weeks 20, 21 and 33 are holidays, and week 34 resumes the second training period. Current code requires exactly four training periods.
- Engram mirror pending: the memory hook rejected the write because the Codex host session is not registered. No application or spreadsheet changes have been made.
