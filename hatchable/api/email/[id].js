import { db, email } from 'hatchable';

export const access = 'public';
export const methods = ['POST'];

// ponytail: demo inbox hardcoded; the free plan only delivers to the project owner. Real PvPI inbox: pvpi.ipc@gov.in
const TO = 'jaypaldabsara@gmail.com';

// "Send to PvPI" button: emails one saved report with a link to its filled PvPI form as a PDF.
// ponytail: a link, not an attachment; on the free plan emails with attachments were silently dropped (2026-10-25).
// Attach it (email.send `attachments`) once the project has a verified email domain.
// Once per report, so the public button can't be used to flood the inbox.
export default async function (req, res) {
  const id = parseInt(req.params.id, 10);
  if (!id) return res.status(400).json({ error: 'invalid id' });
  const { rows } = await db.query(
    'SELECT id, drug_name, generic_name, reaction_english, severity, batch_no, emailed_at FROM reports WHERE id = $1', [id]);
  const r = rows[0];
  if (!r) return res.status(404).json({ error: 'report not found' });
  if (r.emailed_at) return res.json({ status: 'sent', to: TO, already: true });

  const pdf = `https://${req.headers.host}/api/pvpi/${id}?format=pdf`;
  const esc = s => String(s ?? '-').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
  const lines = [['Medicine', r.drug_name], ['Reaction', r.reaction_english], ['Severity', r.severity], ['Batch / lot no.', r.batch_no]];
  try {
    await email.send({
      to: TO,
      subject: `${r.severity === 'severe' ? 'SEVERE: ' : ''}Suspected ADR report #${id}: ${r.generic_name || r.drug_name || 'medicine'}`,
      text: `Suspected adverse drug reaction report #${id}, submitted via ADR Signal.\n\n` +
        lines.map(([k, v]) => `${k}: ${v ?? '-'}`).join('\n') +
        `\n\nFilled PvPI Suspected ADR Reporting Form (PDF): ${pdf}`,
      html: `<p>Suspected adverse drug reaction report #${id}, submitted via ADR Signal.</p><p>` +
        lines.map(([k, v]) => `${k}: <b>${esc(v)}</b>`).join('<br>') +
        `</p><p><a href="${pdf}">Download the filled PvPI Suspected ADR Reporting Form (PDF)</a></p>`,
    });
  } catch (e) {
    console.warn('report email:', e.message);
    return res.status(502).json({ error: 'Email could not be sent just now' });
  }
  await db.query('UPDATE reports SET emailed_at = NOW() WHERE id = $1', [id]);
  return res.json({ status: 'sent', to: TO, pdf });
}
