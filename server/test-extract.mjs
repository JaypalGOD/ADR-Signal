// Runs data/test-sentences.json through /api/extract and checks a redacted save. Server must be running.
// usage: API=http://localhost:3105 node test-extract.mjs   (default http://localhost:3001)
// note: the redaction check saves one report row (language 'test') in whatever DB the server uses.
import { readFileSync } from 'node:fs'

const API = process.env.API || 'http://localhost:3001'
const post = (path, body) => fetch(API + path, {
  method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
}).then(r => r.json())

const cases = JSON.parse(readFileSync(new URL('../data/test-sentences.json', import.meta.url)))
let pass = 0, total = 0
const report = (ok, label, detail) => { total++; pass += ok; console.log(ok ? 'PASS' : 'FAIL', label, detail) }

for (const c of cases) {
  const r = await post('/api/extract', { text: c.text })
  const e = c.expected
  const checks = {
    generic: e.generic_name ? !!r.generic_name?.toLowerCase().startsWith(e.generic_name) : r.generic_name == null,
    severity: r.severity === e.severity,
    red_flag: r.red_flag === (e.red_flag ?? e.severity === 'severe'),
  }
  const ok = Object.values(checks).every(Boolean)
  report(ok, `#${c.id} [${r.source}]`, `${r.drug_name} / ${r.generic_name} | ${r.reaction_english} | ${r.severity} | onset ${r.onset}` +
    (ok ? '' : ' ' + JSON.stringify(checks)))
}

const pii = 'mera naam Ramesh hai, call 9876543210 or +91 98765 43210, mail ramesh@example.com, aadhaar 1234 5678 9012'
const saved = await post('/api/reports', { raw_text: pii, reaction: pii, severity: 'mild', language: 'test' })
const leaked = ['Ramesh', '9876543210', '98765 43210', 'ramesh@example.com', '1234 5678 9012']
  .filter(s => `${saved.raw_text} ${saved.reaction}`.includes(s))
report(leaked.length === 0 && saved.raw_text?.includes('[redacted]'), 'redaction', `${saved.raw_text}${leaked.length ? ' LEAKED: ' + leaked : ''}`)

console.log(`${pass}/${total} passed`)
process.exit(pass === total ? 0 : 1)
