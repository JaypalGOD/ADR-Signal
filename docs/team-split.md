# Team split

Fill in names. One owner per area; owners don't edit each other's files without asking.

| Role | Owns | Files | First goal (hours 0–4) |
|------|------|-------|------------------------|
| Frontend / report flow | Report page, mic input, editable result card, Hindi/English toggle | `client/src` (report view) | Text box + mic (Web Speech API, `hi-IN`) posting to `/api/extract` |
| AI + backend | `/api/extract` LLM call, photo scan, DB, report email | `server/` | Real LLM extraction returning the strict JSON schema; passes `data/test-sentences.json` |
| Dashboard | Charts, spike alert, district map, live refresh | `client/src` (dashboard view), `data/geo` | Seed 300–500 fake reports, 3 Chart.js charts |
| Pitch / data / design | Slides, demo script, backup video, disclaimer copy | `docs/` | Slide outline from `docs/pitch-facts.md`, demo script |

## Sync points
- Hour 4: core pipeline demo (Hindi sentence → card → saved)
- Hour 10: dashboard shows live new report
- Hour 15: feature freeze except bugs
- Hour 19: deployed, tested on a phone
- Hour 22: two full rehearsals done, backup video recorded
