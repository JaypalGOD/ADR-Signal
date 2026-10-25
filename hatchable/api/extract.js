import { extract, rateLimited } from 'lib/core.js';
import { secrets } from 'lib/env.js';

export const access = 'public';
export const methods = ['POST'];

export default async function (req, res) {
  const ip = String(req.headers['x-forwarded-for'] ?? '').split(',')[0].trim() || 'unknown';
  if (rateLimited(ip)) return res.status(429).json({ error: 'Too many requests, please wait a minute' });
  const out = await extract(req.body ?? {}, await secrets());
  return res.status(out.status).json(out.body);
}
