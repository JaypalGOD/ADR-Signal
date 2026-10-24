import { db } from 'hatchable';
import { sendFollowup } from 'lib/core.js';
import { secrets } from 'lib/env.js';

export const access = 'public';
export const methods = ['POST'];

// The phone number is used for this one request and never stored.
export default async function (req, res) {
  const id = parseInt(req.params.id, 10);
  if (!id) return res.status(400).json({ error: 'invalid id' });
  const found = await db.query('SELECT id FROM reports WHERE id = $1', [id]);
  if (!found.rows.length) return res.status(404).json({ error: 'report not found' });
  const out = await sendFollowup(req.body?.phone, await secrets());
  await db.query('UPDATE reports SET followup_status = $1 WHERE id = $2', [out.status, id]);
  return res.json(out);
}
