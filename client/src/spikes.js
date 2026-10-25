const DAY = 86400000
export const toTime = s => Date.parse(s.replace(' ', 'T') + 'Z') // created_at is a UTC 'YYYY-MM-DD HH:MM:SS'

// ponytail: simple ratio rule (last 7 days >= 2x the weekly average of days 8-35, and >= 8 reports),
// not PRR/ROR disproportionality statistics. Swap in PRR when there is enough background data.
export function findSpikes(rows, now = Date.now()) {
  const by = {}
  for (const r of rows) {
    const age = (now - toTime(r.created_at)) / DAY
    const drug = r.generic_name || r.drug_name
    if (!drug || age < 0 || age >= 35) continue
    by[drug] ??= { recent: 0, before: 0 }
    by[drug][age < 7 ? 'recent' : 'before']++
  }
  return Object.entries(by)
    .map(([drug, c]) => ({ drug, recent: c.recent, weekly: c.before / 4 }))
    .filter(s => s.recent >= 8 && s.recent >= 2 * s.weekly)
}
