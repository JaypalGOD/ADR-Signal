// Local / single-server mode: Express + SQLite. The live site runs on Hatchable from hatchable/ instead.
import 'dotenv/config'
import express from 'express'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { DatabaseSync } from 'node:sqlite'
import { FIELDS, DETAIL_FIELDS, seedRows, rateLimited, extract, toRow } from './core.js'

const DATA = new URL('../data/', import.meta.url)

// ---------- DB ----------
const db = new DatabaseSync(resolve(import.meta.dirname, process.env.DB_FILE || 'adr.db'))
db.exec(`CREATE TABLE IF NOT EXISTS reports (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  raw_text TEXT, language TEXT, drug_name TEXT, generic_name TEXT, reaction TEXT, reaction_english TEXT,
  severity TEXT CHECK (severity IN ('mild','moderate','severe')),
  onset TEXT, outcome TEXT, age INTEGER, gender TEXT, district TEXT, state TEXT,
  confidence REAL, followup_status TEXT, batch_no TEXT)`)
// Databases created before these fields existed get the columns added once
const columns = new Set(db.prepare('PRAGMA table_info(reports)').all().map(c => c.name))
for (const f of ['batch_no', ...DETAIL_FIELDS]) if (!columns.has(f)) db.exec(`ALTER TABLE reports ADD COLUMN ${f} ${f === 'weight_kg' ? 'REAL' : 'TEXT'}`)
const insert = db.prepare(`INSERT INTO reports (${FIELDS}) VALUES (${FIELDS.map(f => '$' + f)})`)
const getRow = db.prepare('SELECT * FROM reports WHERE id = ?')

// Seed on first start only; delete the DB file to reseed
if (db.prepare('SELECT COUNT(*) n FROM reports').get().n === 0)
  for (const { id, ...row } of seedRows(Date.now())) insert.run(row)

// ---------- API ----------
const app = express()
app.set('trust proxy', 1) // behind a proxy when hosted; needed for req.ip
app.use(express.json({ limit: '10mb' }))

app.get('/api/health', (req, res) => res.json({ ok: true }))

app.get('/api/reports', (req, res) => res.json(db.prepare('SELECT * FROM reports ORDER BY created_at DESC, id DESC').all()))

app.post('/api/reports', (req, res) => {
  const { error, row } = toRow(req.body ?? {})
  if (error) return res.status(400).json({ error })
  const { lastInsertRowid } = insert.run(row)
  res.status(201).json(getRow.get(lastInsertRowid))
})

app.post('/api/extract', async (req, res) => {
  if (rateLimited(req.ip)) return res.status(429).json({ error: 'Too many requests, please wait a minute' })
  const { status, body } = await extract(req.body)
  res.status(status).json(body)
})

app.get('/api/geo/districts', (req, res) => res.sendFile(fileURLToPath(new URL('geo/india_districts.min.geojson', DATA))))

// Production: serve the built client (client/dist) from the same server
app.use(express.static(fileURLToPath(new URL('../client/dist/', import.meta.url))))

const port = process.env.PORT || 3001
app.listen(port, () => console.log(`server on http://localhost:${port}`))
