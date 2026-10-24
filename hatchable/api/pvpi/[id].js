import { db } from 'hatchable';
import { FIELDS } from 'lib/core.js';
import { pvpiHtml } from 'lib/pvpi.js';

export const access = 'public';
export const methods = ['GET'];

// The filled PvPI form for one report, as a page; api/email/[id].js prints it to the attached PDF
export default async function (req, res) {
  const id = parseInt(req.params.id, 10);
  if (!id) return res.status(400).json({ error: 'invalid id' });
  const { rows } = await db.query(
    `SELECT id, ${FIELDS.filter(f => f !== 'created_at').join(', ')}, to_char(created_at, 'YYYY-MM-DD') AS created_at
     FROM reports WHERE id = $1`, [id]);
  if (!rows.length) return res.status(404).json({ error: 'report not found' });
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  return res.send(pvpiHtml(rows[0]));
}
