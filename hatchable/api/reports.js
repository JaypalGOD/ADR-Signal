import { db } from 'hatchable';
import { seedRows, toRow, FIELDS } from 'lib/core.js';

export const access = 'public';
export const methods = ['GET', 'POST'];

// Seed anchored to the start of the UTC day so every isolate generates identical rows.
const seed = () => seedRows(new Date().setUTCHours(0, 0, 0, 0));

export default async function (req, res) {
  if (req.method === 'GET') {
    const { rows } = await db.query(
      `SELECT ${FIELDS.filter(f => f !== 'created_at').join(', ')}, id,
              to_char(created_at, 'YYYY-MM-DD HH24:MI:SS') AS created_at
       FROM reports ORDER BY created_at DESC LIMIT 5000`
    );
    const all = [...rows, ...seed()];
    all.sort((a, b) => b.created_at.localeCompare(a.created_at) || b.id - a.id);
    return res.json(all);
  }

  const { error, row } = toRow(req.body ?? {});
  if (error) return res.status(400).json({ error });
  const { rows } = await db.query(
    `INSERT INTO reports (${FIELDS.join(', ')}) VALUES (${FIELDS.map((_, i) => `$${i + 1}`).join(', ')}) RETURNING id`,
    FIELDS.map(f => f === 'age' || f === 'confidence' ? (row[f] == null || isNaN(row[f]) ? null : Number(row[f])) : row[f])
  );
  return res.status(201).json({ id: rows[0].id, ...row });
}
